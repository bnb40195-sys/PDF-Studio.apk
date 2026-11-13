import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  RefreshCw, 
  X, 
  AlertCircle, 
  Sparkles, 
  QrCode, 
  CreditCard, 
  Stethoscope, 
  FileText, 
  Receipt,
  CheckCircle,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScanCategory, QrScanResult } from '../../types';
import { combineIdCardSides } from '../../utils/imageProcessing';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, category: ScanCategory, qrResult?: QrScanResult) => void;
  initialCategory?: ScanCategory;
}

export const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  onCapture,
  initialCategory = 'document'
}) => {
  const { t, currentTheme, showToast } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Active camera mode
  const [category, setCategory] = useState<ScanCategory>(initialCategory === 'all' ? 'document' : initialCategory);

  // ID Card Double-sided step
  const [idCardStep, setIdCardStep] = useState<'front' | 'back'>('front');
  const [idFrontDataUrl, setIdFrontDataUrl] = useState<string | null>(null);

  // Live QR scan feedback
  const [detectedQr, setDetectedQr] = useState<QrScanResult | null>(null);

  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setCategory(initialCategory);
    }
    setIdCardStep('front');
    setIdFrontDataUrl(null);
    setDetectedQr(null);
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Real-time QR scanner loop when in 'qr-barcode' mode
  useEffect(() => {
    if (!isOpen || category !== 'qr-barcode') return;

    let animId: number;
    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 480;
          canvas.height = Math.round((video.videoHeight / (video.videoWidth || 1)) * 480);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              let type: QrScanResult['type'] = 'text';
              if (/^https?:\/\//i.test(code.data)) type = 'url';
              else if (/^WIFI:/i.test(code.data)) type = 'wifi';
              else if (/^mailto:/i.test(code.data)) type = 'email';
              else if (/^tel:/i.test(code.data)) type = 'phone';

              const result: QrScanResult = {
                data: code.data,
                type,
                timestamp: Date.now(),
              };

              setDetectedQr(result);
            }
          }
        }
      }
      animId = requestAnimationFrame(scanFrame);
    };

    animId = requestAnimationFrame(scanFrame);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, category]);

  const startCamera = async () => {
    setError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        setError(t.scanner.cameraError);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setIsFlashActive(true);

    setTimeout(() => {
      setIsFlashActive(false);
    }, 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // If ID Card double-sided mode:
    if (category === 'id-card') {
      if (idCardStep === 'front') {
        setIdFrontDataUrl(capturedDataUrl);
        setIdCardStep('back');
        setIsCapturing(false);
        showToast('تم التقاط الوجه الأمامي! الآن اقلب البطاقة لالتقاط الوجه الخلفي', 'info');
        return;
      } else if (idCardStep === 'back' && idFrontDataUrl) {
        try {
          const combined = await combineIdCardSides(idFrontDataUrl, capturedDataUrl);
          stopCamera();
          setIsCapturing(false);
          onCapture(combined.dataUrl, 'id-card');
          onClose();
          showToast('تم دمج وجهي بطاقة الهوية على صفحة A4 واحدة بنجاح', 'success');
          return;
        } catch (err) {
          console.error('Failed combining ID sides', err);
        }
      }
    }

    // If QR Code mode
    let qrRes = detectedQr || undefined;
    if (category === 'qr-barcode' && !qrRes) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height);
      if (code && code.data) {
        qrRes = {
          data: code.data,
          type: /^https?:\/\//i.test(code.data) ? 'url' : 'text',
          timestamp: Date.now(),
        };
      }
    }

    setTimeout(() => {
      setIsCapturing(false);
      stopCamera();
      onCapture(capturedDataUrl, category, qrRes);
      onClose();
    }, 200);
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-3xl rounded-2xl overflow-hidden border ${currentTheme.borderClass} bg-slate-950 text-white shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm sm:text-base">الماسح الضوئي الذكي الشامل</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Strip */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border-b border-slate-800/80 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: 'document', label: 'أوراق وملفات', icon: FileText },
            { id: 'qr-barcode', label: 'QR وباركود', icon: QrCode },
            { id: 'medical', label: 'شهادة ووصفة طبية', icon: Stethoscope },
            { id: 'id-card', label: 'بطاقة هوية (وجهين)', icon: CreditCard },
            { id: 'receipt', label: 'فواتير وإيصالات', icon: Receipt },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = category === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setCategory(m.id as ScanCategory);
                  setIdCardStep('front');
                  setIdFrontDataUrl(null);
                  setDetectedQr(null);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <p className="text-sm text-slate-300 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* DYNAMIC VIEW-FINDER GUIDELINES ACCORDING TO CATEGORY */}

              {/* 1. Document Mode Frame */}
              {category === 'document' && (
                <div className="absolute inset-8 pointer-events-none border border-emerald-500/30 rounded-lg">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                  <div className="absolute top-3 inset-x-0 flex justify-center">
                    <span className="text-xs text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                      محاذاة الورقة / العقد داخل الإطار
                    </span>
                  </div>
                </div>
              )}

              {/* 2. QR & Barcode Mode Target Frame with Laser Animation */}
              {category === 'qr-barcode' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-64 border-2 border-emerald-400/60 rounded-2xl bg-black/20 backdrop-blur-xs flex items-center justify-center overflow-hidden shadow-2xl">
                    <div className="absolute -top-1 -left-1 w-7 h-7 border-t-3 border-l-3 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 border-t-3 border-r-3 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-3 border-l-3 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-3 border-r-3 border-emerald-400" />

                    {/* Animated Scanning Line */}
                    <div className="w-full h-1 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-bounce duration-1000" />
                  </div>

                  {detectedQr ? (
                    <div className="absolute bottom-6 inset-x-8 bg-emerald-950/90 border border-emerald-500/50 p-3 rounded-xl backdrop-blur-md flex items-center justify-between pointer-events-auto">
                      <div className="min-w-0 pr-2">
                        <span className="text-[11px] text-emerald-400 font-bold block">تم التعرف على الكود!</span>
                        <p className="text-xs text-slate-100 truncate font-mono">{detectedQr.data}</p>
                      </div>
                      <button
                        onClick={handleCapture}
                        className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap shadow-sm hover:bg-emerald-400"
                      >
                        التقاط وحفظ
                      </button>
                    </div>
                  ) : (
                    <span className="absolute top-6 text-xs text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                      وجه الكاميرا نحو رمز QR أو الباركود
                    </span>
                  )}
                </div>
              )}

              {/* 3. Medical Certificate / Prescription Mode */}
              {category === 'medical' && (
                <div className="absolute inset-8 pointer-events-none border-2 border-sky-500/40 rounded-xl">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-sky-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-sky-400" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-sky-400" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-sky-400" />
                  <div className="absolute top-3 inset-x-0 flex justify-center">
                    <span className="text-xs text-white bg-sky-950/80 px-3 py-1 rounded-full backdrop-blur-sm border border-sky-500/30 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                      <span>نمط التقارير الطبية والوصفات (تعزيز خط اليد والختم الطبي)</span>
                    </span>
                  </div>
                </div>
              )}

              {/* 4. ID Card Double-Sided Mode */}
              {category === 'id-card' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {/* Card shape: approx 86x54 aspect ratio */}
                  <div className="relative w-80 h-52 border-2 border-emerald-400 rounded-2xl bg-black/30 backdrop-blur-xs flex items-center justify-center shadow-2xl">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-emerald-400" />
                    
                    <span className="text-xs font-bold text-emerald-300 bg-black/60 px-3 py-1 rounded-full">
                      {idCardStep === 'front' ? 'الوجه الأمامي للبطاقة (Front)' : 'الوجه الخلفي للبطاقة (Back)'}
                    </span>
                  </div>

                  <div className="absolute top-4 inset-x-0 flex justify-center">
                    <span className="text-xs text-white bg-black/70 px-4 py-1.5 rounded-full border border-emerald-500/30 font-medium">
                      {idCardStep === 'front' ? 'الخطوة 1 من 2: التقط الوجه الأمامي' : 'الخطوة 2 من 2: اقلب البطاقة والتقط الوجه الخلفي'}
                    </span>
                  </div>
                </div>
              )}

              {/* 5. Receipt Mode */}
              {category === 'receipt' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-[85%] border-2 border-amber-400/60 rounded-xl bg-black/20 flex items-center justify-center">
                    <span className="text-xs text-amber-200 bg-black/70 px-3 py-1 rounded-full border border-amber-500/30">
                      محاذاة شريط الفاتورة / الإيصال الحراري
                    </span>
                  </div>
                </div>
              )}

              {/* Flash simulation */}
              {isFlashActive && <div className="absolute inset-0 bg-white z-20 pointer-events-none" />}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <button
            onClick={toggleFacingMode}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title={t.scanner.switchCamera}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t.scanner.switchCamera}</span>
          </button>

          <button
            onClick={handleCapture}
            disabled={!stream || isCapturing}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={t.scanner.snapPhoto}
          >
            <div className="w-11 h-11 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
          </button>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
