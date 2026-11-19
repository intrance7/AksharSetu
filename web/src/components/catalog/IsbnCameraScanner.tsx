"use client"

import { useEffect, useRef, useState } from "react"
import { BarcodeDetector as BarcodeDetectorPonyfill } from "barcode-detector/ponyfill"
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

const ISBN_FORMATS = ["ean_13", "ean_8", "upc_a"] as const

type DetectorLike = {
  detect: (
    source: HTMLVideoElement | ImageBitmap | HTMLImageElement | HTMLCanvasElement
  ) => Promise<Array<{ rawValue?: string }>>
}

function createDetector(): DetectorLike {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const NativeDetector = (window as any).BarcodeDetector
      return new NativeDetector({ formats: [...ISBN_FORMATS] })
    } catch {}
  }
  return new BarcodeDetectorPonyfill({ formats: [...ISBN_FORMATS] })
}

export function IsbnCameraScanner({ onScan, onClose }: IsbnCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<DetectorLike | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const onScanRef = useRef(onScan)
  const detectedRef = useRef(false)
  onScanRef.current = onScan

  const [status, setStatus] = useState<"starting" | "live" | "error">("starting")
  const [errorMsg, setErrorMsg] = useState("")
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string>("")
  const [requestedCameraId, setRequestedCameraId] = useState<string>("")
  const [isMirrored, setIsMirrored] = useState(true)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    let loopTimer: ReturnType<typeof setTimeout> | null = null
    detectedRef.current = false

    const stopStream = () => {
      if (loopTimer) {
        clearTimeout(loopTimer)
        loopTimer = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }

    const triggerDetection = (rawText: string) => {
      if (detectedRef.current) return
      const clean = rawText.replace(/[^0-9Xx]/g, "")
      if (clean.length < 8) return
      detectedRef.current = true
      stopStream()
      onScanRef.current(clean)
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

      stopStream()

      try {
        // Initialize WASM / Native BarcodeDetector in parallel with camera open
        if (!detectorRef.current) {
          detectorRef.current = createDetector()
        }

        const videoConstraints: MediaTrackConstraints = requestedCameraId
          ? {
              deviceId: { exact: requestedCameraId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }

        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          })
        } catch {
          // Fallback to default camera without strict constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        // Populate camera selector after permission is granted
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = allDevices
            .filter((d) => d.kind === "videoinput")
            .map((d, i) => ({
              id: d.deviceId,
              label: d.label || `Camera ${i + 1}`,
            }))
          if (!cancelled && videoInputs.length > 0) {
            setCameras(videoInputs)
            const activeTrackDeviceId =
              stream.getVideoTracks()[0]?.getSettings()?.deviceId || ""
            setActiveCameraId(activeTrackDeviceId || videoInputs[0].id)
          }
        } catch {}

        const video = videoRef.current
        if (!video) {
          stopStream()
          return
        }

        video.srcObject = stream
        await video.play()

        if (cancelled) {
          stopStream()
          return
        }

        setStatus("live")

        // Tight non-overlapping WASM/Native scan loop directly on full-resolution HD video frames
        const scanLoop = async () => {
          if (cancelled || detectedRef.current) return
          const v = videoRef.current
          const detector = detectorRef.current
          if (v && detector && v.readyState >= 2 && v.videoWidth > 0) {
            try {
              const results = await detector.detect(v)
              if (results && results.length > 0 && results[0].rawValue) {
                triggerDetection(results[0].rawValue)
                return
              }
            } catch {}
          }
          if (!cancelled && !detectedRef.current) {
            loopTimer = setTimeout(scanLoop, 45)
          }
        }

        scanLoop()
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
      stopStream()
    }
  }, [requestedCameraId, retryTick])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const detector = detectorRef.current || createDetector()
      detectorRef.current = detector
      const bitmap = await createImageBitmap(file)
      try {
        const results = await detector.detect(bitmap)
        const raw = results?.[0]?.rawValue || ""
        const clean = raw.replace(/[^0-9Xx]/g, "")
        if (clean.length >= 8) {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
          }
          onScanRef.current(clean)
        } else {
          setErrorMsg(
            "No ISBN barcode detected in that image. Try a clearer photo."
          )
        }
      } finally {
        bitmap.close()
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
              className="rounded-full bg-white/10 text-white text-[11px] font-semibold px-2.5 py-1 outline-none max-w-[160px] truncate"
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

      {/* Full-HD Live Video Container (reads native 720p pixels even inside compact modals) */}
      <div className="relative w-full aspect-[16/10] min-h-[210px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${
            isMirrored ? "-scale-x-100" : ""
          }`}
        />

        {status === "live" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
            <div className="w-[82%] h-[42%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] relative flex items-center justify-center">
              <div className="w-[90%] h-[2px] bg-[#C84200] shadow-[0_0_10px_#C84200]" />
            </div>
          </div>
        )}

        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-xs font-semibold text-white/80 z-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#C84200]" />
            <span>Requesting camera access...</span>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-black/90 z-20">
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
