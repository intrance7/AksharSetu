"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Camera, RefreshCw, Upload, AlertCircle, Loader2 } from "lucide-react"

interface IsbnCameraScannerProps {
  onScan: (cleanIsbn: string) => void
  onClose?: () => void
}

const ISBN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
]

export function IsbnCameraScanner({ onScan, onClose }: IsbnCameraScannerProps) {
  const reactId = useId().replace(/:/g, "")
  const containerId = `isbn-cam-${reactId}`

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const [status, setStatus] = useState<"starting" | "live" | "error">("starting")
  const [errorMsg, setErrorMsg] = useState("")
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    let started = false

    const stopAndClear = async (instance: Html5Qrcode | null) => {
      if (!instance) return
      try {
        if (instance.isScanning) {
          await instance.stop()
        }
      } catch {}
      try {
        instance.clear()
      } catch {}
    }

    const startCamera = async () => {
      setStatus("starting")
      setErrorMsg("")

      // Check secure context (HTTPS or localhost)
      if (
        typeof window !== "undefined" &&
        !window.isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        setStatus("error")
        setErrorMsg(
          "Camera access requires HTTPS or localhost. You can still upload a barcode photo below."
        )
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error")
        setErrorMsg(
          "Your browser does not expose camera access. Use 'Upload Barcode Photo' below."
        )
        return
      }

      try {
        const qr = new Html5Qrcode(containerId, {
          formatsToSupport: ISBN_FORMATS,
          verbose: false,
        })
        scannerRef.current = qr

        // Request camera list (triggers browser permission prompt immediately)
        let cameraConfig: string | MediaTrackConstraints = { facingMode: "user" }
        try {
          const devices = await Html5Qrcode.getCameras()
          if (cancelled) {
            await stopAndClear(qr)
            return
          }
          if (devices && devices.length > 0) {
            setCameras(devices)
            if (
              selectedCameraId &&
              devices.some((d) => d.id === selectedCameraId)
            ) {
              cameraConfig = selectedCameraId
            } else {
              const rearCam = devices.find((d) =>
                /back|rear|environment/i.test(d.label)
              )
              const chosen = rearCam || devices[0]
              cameraConfig = chosen.id
              setSelectedCameraId(chosen.id)
            }
          }
        } catch {
          // Fallback directly to default camera constraint if getCameras fails
          cameraConfig = { facingMode: "environment" }
        }

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 140 },
          aspectRatio: 1.6,
        }

        const handleDecoded = (decodedText: string) => {
          const clean = decodedText.replace(/[^0-9Xx]/g, "")
          if (!clean) return
          stopAndClear(qr).finally(() => {
            onScanRef.current(clean)
          })
        }

        try {
          await qr.start(cameraConfig, config, handleDecoded, () => {})
          started = true
        } catch {
          // Second fallback: try facingMode: "user" (standard laptop webcam)
          if (cancelled) {
            await stopAndClear(qr)
            return
          }
          await qr.start({ facingMode: "user" }, config, handleDecoded, () => {})
          started = true
        }

        if (cancelled) {
          await stopAndClear(qr)
          return
        }

        setStatus("live")
      } catch (err: any) {
        if (cancelled) return
        setStatus("error")
        const rawMsg = String(err?.message || err || "")
        if (/NotAllowedError|Permission/i.test(rawMsg)) {
          setErrorMsg(
            "Camera permission was blocked. Click the camera icon in your browser address bar to allow access, then click Retry."
          )
        } else if (/NotFoundError|DevicesNotFound/i.test(rawMsg)) {
          setErrorMsg(
            "No camera was detected on this device. Use 'Upload Barcode Photo' below instead."
          )
        } else if (/NotReadableError|TrackStartError/i.test(rawMsg)) {
          setErrorMsg(
            "Your camera is currently being used by another app (Zoom, Meet, Teams, etc.). Close it and click Retry."
          )
        } else {
          setErrorMsg(
            rawMsg ||
              "Unable to open camera. You can retry or upload a photo of the barcode."
          )
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (started || scannerRef.current) {
        stopAndClear(scannerRef.current)
        scannerRef.current = null
      }
    }
  }, [containerId, selectedCameraId, retryTick])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop().catch(() => {})
      }
      const qr =
        scannerRef.current ||
        new Html5Qrcode(containerId, {
          formatsToSupport: ISBN_FORMATS,
          verbose: false,
        })
      const decoded = await qr.scanFile(file, true)
      const clean = decoded.replace(/[^0-9Xx]/g, "")
      if (clean) {
        onScanRef.current(clean)
      } else {
        setErrorMsg("No ISBN barcode detected in that image. Try a clearer photo.")
      }
    } catch {
      setErrorMsg(
        "Could not detect a barcode in that photo. Ensure the barcode is sharp and well-lit."
      )
    } finally {
      e.target.value = ""
    }
  }

  return (
    <div className="rounded-2xl bg-[#1D1D1F] text-white p-4 space-y-3 border border-black/10">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold">
          <Camera className="w-4 h-4 text-[#C84200]" />
          <span>
            {status === "starting"
              ? "Opening camera..."
              : status === "live"
              ? "Point camera at the ISBN barcode on the back cover"
              : "Camera unavailable"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="rounded-full bg-white/10 text-white text-[11px] font-semibold px-2.5 py-1 outline-none"
            >
              {cameras.map((c, idx) => (
                <option
                  key={c.id}
                  value={c.id}
                  className="text-[#1D1D1F] bg-white"
                >
                  {c.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-white/70 hover:text-white cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Live Video Container */}
      <div className="relative w-full min-h-[220px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
        <div id={containerId} className="w-full" />

        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-xs font-semibold text-white/80">
            <Loader2 className="w-6 h-6 animate-spin text-[#C84200]" />
            <span>Requesting camera access...</span>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-black/90">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            <p className="text-xs text-white/85 max-w-sm leading-relaxed">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => setRetryTick((t) => t + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C84200] hover:bg-[#A33500] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* Upload Photo Fallback */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-white/55">
          Supports EAN-13, ISBN-10/13, UPC &amp; QR barcodes
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-[11px] font-bold text-white transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Barcode Photo
        </button>
      </div>
    </div>
  )
}
