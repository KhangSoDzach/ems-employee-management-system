import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, MapPin, RefreshCw, X } from 'lucide-react';
import { SYSTEM_MESSAGES } from '@/constants/messages';

interface CaptureResult {
  photoBase64: string;   // without the "data:image/jpeg;base64," prefix
  latitude: number;
  longitude: number;
  locationLabel: string;
}

interface CameraModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onCapture: (result: CaptureResult) => void;
  onClose: () => void;
}

type ModalStep = 'init' | 'streaming' | 'captured' | 'error';

export function CameraModal({
  open,
  title = SYSTEM_MESSAGES.CAMERA.TITLE,
  description = SYSTEM_MESSAGES.CAMERA.DESC,
  onCapture,
  onClose,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<ModalStep>('init');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setStep('init');
    setErrorMsg('');
    setCapturedImage(null);
    setCoords(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep('streaming');

      // Request geolocation in parallel
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          let label = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const json = await res.json();
            if (json.display_name) label = (json.display_name as string).split(',').slice(0, 3).join(',').trim();
          } catch {
            // Use coordinate fallback
          }
          setCoords({ lat, lon, label });
          setGeoLoading(false);
        },
        (err) => {
          setGeoLoading(false);
          setErrorMsg(`Không lấy được vị trí: ${err.message}. Vui lòng bật GPS và thử lại.`);
          setStep('error');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Không thể mở camera: ${msg}`);
      setStep('error');
    }
  }, []);

  // ── Stop camera stream ──────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Lifecycle: open/close ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // ── Capture frame ───────────────────────────────────────────────────────────
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    setStep('captured');
    stopCamera();
  };

  // ── Retake ──────────────────────────────────────────────────────────────────
  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // ── Confirm ─────────────────────────────────────────────────────────────────
  const confirm = () => {
    if (!capturedImage || !coords) return;
    const base64 = capturedImage.replace(/^data:image\/\w+;base64,/, '');
    onCapture({ photoBase64: base64, latitude: coords.lat, longitude: coords.lon, locationLabel: coords.label });
    onClose();
  };

  // ── Close / cancel ──────────────────────────────────────────────────────────
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const canConfirm = step === 'captured' && !!coords && !geoLoading;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ── Camera / Preview area ── */}
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {/* Live video */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${step === 'streaming' ? 'block' : 'hidden'}`}
            muted
            playsInline
          />

          {/* Captured image */}
          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          )}

          {/* Error state */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-2 p-4 text-center text-destructive">
              <X className="w-8 h-8" />
              <p className="text-sm">{errorMsg}</p>
              <Button size="sm" variant="outline" onClick={startCamera}>
                <RefreshCw className="w-4 h-4 mr-1" /> {SYSTEM_MESSAGES.CAMERA.BTN_RETRY}
              </Button>
            </div>
          )}

          {/* Init loading */}
          {step === 'init' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/85">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">{SYSTEM_MESSAGES.CAMERA.LOADING}</p>
            </div>
          )}

          {/* Canvas (off-screen) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* ── Geolocation status ── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-h-[20px]">
          <MapPin className="w-4 h-4 shrink-0" />
          {geoLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> {SYSTEM_MESSAGES.CAMERA.LOCATION_LOADING}
            </span>
          ) : coords ? (
            <span className="truncate text-green-600 dark:text-green-400">{coords.label}</span>
          ) : step === 'error' ? (
            <span className="text-destructive">{SYSTEM_MESSAGES.CAMERA.NO_LOCATION}</span>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {SYSTEM_MESSAGES.BTN_CANCEL}
          </Button>

          {step === 'streaming' && (
            <Button onClick={capturePhoto} disabled={geoLoading}>
              <Camera className="w-4 h-4 mr-2" />
              {SYSTEM_MESSAGES.CAMERA.BTN_CAPTURE}
            </Button>
          )}

          {step === 'captured' && (
            <>
              <Button variant="outline" onClick={retake}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {SYSTEM_MESSAGES.CAMERA.BTN_RETAKE}
              </Button>
              <Button onClick={confirm} disabled={!canConfirm}>
                {geoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {SYSTEM_MESSAGES.BTN_CONFIRM}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
