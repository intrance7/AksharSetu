"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import {
  Camera,
  RefreshCw,
  Upload,
  AlertCircle,
  Loader2,
  FlipHorizontal2,
} from "lucide-react"

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
  const detectedRef = useRef(false)
  onScanRef.current = onScan

  const [status, setStatus] = useState<"starting" | "live" | "error">("starting")
  const [errorMsg, setErrorMsg] = useState("")
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string>("")
  // Only changes when user manually picks a different camera from the dropdown
  const [requestedCameraId, setRequestedCameraId] = useState<string>("")
  const [isMirrored, setIsMirrored] = useState(true)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    let nativeInterval: ReturnType<typeof setInterval> | null = null
    detectedRef.current = false

    const safeStopAndClear = async (instance: Html5Qrcode | null) => {
      if (nativeInterval) {
        clearInterval(nativeInterval)
        nativeInterval = null
      }
      if (!instance) return
      try {
        const state = instance.getState()
        // 2 = SCANNING, 3 = PAUSED
        if (state === 2 || state === 3) {
          await instance.stop()
        }
      } catch {}
      try {
        instance.clear()
      } catch {}
    }

    const triggerDetection = (rawText: string, qr: Html5Qrcode) => {
      if (detectedRef.current) return
      const clean = rawText.replace(/[^0-9Xx]/g, "")
      if (clean.length < 8) return
      detectedRef.current = true
      safeStopAndClear(qr).finally(() => {
        onScanRef.current(clean)
      })
    }

    const startCamera = async () => {
      setStatus("starting")
      setErrorMsg("")

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

      // Ensure any previous instance is fully stopped first
      if (scannerRef.current) {
        await safeStopAndClear(scannerRef.current)
        scannerRef.current = null
      }

      if (cancelled) return

      try {
        const qr = new Html5Qrcode(containerId, {
          formatsToSupport: ISBN_FORMATS,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        })
        scannerRef.current = qr

        // html5-qrcode start() requires EITHER a string cameraId OR a single-key facingMode object
        let cameraIdOrConfig: string | { facingMode: string } = {
          facingMode: "environment",
        }

        try {
          const devices = await Html5Qrcode.getCameras()
          if (cancelled) {
            await safeStopAndClear(qr)
            return
          }
          if (devices && devices.length > 0) {
            setCameras(devices)
            if (
              requestedCameraId &&
              devices.some((d) => d.id === requestedCameraId)
            ) {
              cameraIdOrConfig = requestedCameraId
              setActiveCameraId(requestedCameraId)
            } else {
              const rearCam = devices.find((d) =>
                /back|rear|environment/i.test(d.label)
              )
              const chosen = rearCam || devices[0]
              cameraIdOrConfig = chosen.id
              setActiveCameraId(chosen.id)
            }
          }
        } catch {
          cameraIdOrConfig = { facingMode: "user" }
        }

        if (cancelled) {
          await safeStopAndClear(qr)
          return
        }

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
            width: Math.min(
              440,
              Math.max(220, Math.floor(viewfinderWidth * 0.78))
            ),
            height: Math.min(
              200,
              Math.max(110, Math.floor(viewfinderHeight * 0.42))
            ),
          }),
          aspectRatio: 1.6,
          disableFlip: false,
        }

        const handleDecoded = (decodedText: string) => {
          triggerDetection(decodedText, qr)
        }

        await qr.start(cameraIdOrConfig, config, handleDecoded, () => {})

        if (cancelled) {
          await safeStopAndClear(qr)
          return
        }

        setStatus("live")

        // Native browser BarcodeDetector fast-path loop (Chrome/Brave/Edge)
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: [
                "ean_13",
                "ean_8",
                "upc_a",
                "upc_e",
                "code_128",
                "qr_code",
              ],
            })
            nativeInterval = setInterval(async () => {
              if (cancelled || detectedRef.current) return
              const video = document.querySelector(
                `#${containerId} video`
              ) as HTMLVideoElement | null
              if (!video || video.readyState < 2) return
              try {
                const results = await detector.detect(video)
                if (results && results.length > 0 && results[0].rawValue) {
                  triggerDetection(results[0].rawValue, qr)
                }
              } catch {}
            }, 220)
          } catch {}
        }
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
      const current = scannerRef.current
      scannerRef.current = null
      safeStopAndClear(current)
    }
  }, [containerId, requestedCameraId, retryTick])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState()
        if (state === 2 || state === 3) {
          await scannerRef.current.stop().catch(() => {})
        }
      }
      const qr =
        scannerRef.current ||
        new Html5Qrcode(containerId, {
          formatsToSupport: ISBN_FORMATS,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false,
        })
      const decoded = await qr.scanFile(file, true)
      const clean = decoded.replace(/[^0-9Xx]/g, "")
      if (clean.length >= 8) {
        onScanRef.current(clean)
      } else {
        setErrorMsg(
          "No ISBN barcode detected in that image. Try a clearer photo."
        )
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
              ? "Hold the ISBN barcode steady inside the frame"
              : "Camera unavailable"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMirrored((m) => !m)}
            title="Flip camera view horizontally"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
              isMirrored
                ? "bg-[#C84200] text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            {isMirrored ? "Mirrored" : "Normal"}
          </button>

          {cameras.length > 1 && (
            <select
              value={activeCameraId}
              onChange={(e) => setRequestedCameraId(e.target.value)}
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

      {/* Live Video Container (flipped horizontally by default for natural webcam alignment) */}
      <div className="relative w-full min-h-[240px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
        <div
          id={containerId}
          className={`w-full ${isMirrored ? "[&_video]:-scale-x-100" : ""}`}
        />

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
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-white/55">
          Tip: Hold barcode 15–25cm from camera in good light · EAN-13 / ISBN
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
