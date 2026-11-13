import React, { useState, useRef, useEffect } from 'react';
import { Crop, Check, X, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cropImage } from '../../utils/imageProcessing';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (newImageSrc: string) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}) => {
  const { t, currentTheme } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Percentage coords (0 to 100)
  const [crop, setCrop] = useState({ top: 5, left: 5, right: 5, bottom: 5 });
  const [naturalSize, setNaturalSize] = useState({ width: 800, height: 600 });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ top: 5, left: 5, right: 5, bottom: 5 });
    }
  }, [isOpen]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight,
    });
  };

  const handleApply = async () => {
    if (!naturalSize.width || !naturalSize.height) return;
    setIsProcessing(true);

    try {
      const x = Math.round((crop.left / 100) * naturalSize.width);
      const y = Math.round((crop.top / 100) * naturalSize.height);
      const width = Math.round(((100 - crop.left - crop.right) / 100) * naturalSize.width);
      const height = Math.round(((100 - crop.top - crop.bottom) / 100) * naturalSize.height);

      const croppedDataUrl = await cropImage(imageSrc, { x, y, width, height });
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Crop failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ top: 0, left: 0, right: 0, bottom: 0 });
  };

  const setA4Preset = () => {
    setCrop({ top: 6, bottom: 6, left: 10, right: 10 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-3xl rounded-2xl overflow-hidden border ${currentTheme.borderClass} bg-slate-950 text-white shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm sm:text-base">{t.scanner.cropModalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop canvas / image area */}
        <div 
          ref={containerRef}
          className="relative max-h-[60vh] bg-black/90 p-4 flex items-center justify-center select-none overflow-hidden"
        >
          <div className="relative inline-block max-h-[55vh]">
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Scan crop preview"
              onLoad={onImageLoad}
              className="max-h-[55vh] max-w-full object-contain pointer-events-none rounded"
            />

            {/* Crop Overlay Area */}
            <div
              className="absolute border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              style={{
                top: `${crop.top}%`,
                left: `${crop.left}%`,
                right: `${crop.right}%`,
                bottom: `${crop.bottom}%`,
              }}
            >
              {/* Corner markers */}
              <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-sm" />
              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-sm" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-sm" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-sm" />

              {/* Grid 3x3 inside */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                <div className="border-r border-b border-emerald-300" />
                <div className="border-r border-b border-emerald-300" />
                <div className="border-b border-emerald-300" />
                <div className="border-r border-b border-emerald-300" />
                <div className="border-r border-b border-emerald-300" />
                <div className="border-b border-emerald-300" />
                <div className="border-r border-emerald-300" />
                <div className="border-r border-emerald-300" />
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* Sliders & presets */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">تعديل الهوامش:</span>
              <button
                onClick={setA4Preset}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
              >
                نمط A4 متوازن
              </button>
              <button
                onClick={handleReset}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.scanner.resetCrop}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <label className="flex items-center gap-2">
                <span>أفقي:</span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={crop.left}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCrop(prev => ({ ...prev, left: val, right: val }));
                  }}
                  className="w-20 accent-emerald-500"
                />
              </label>

              <label className="flex items-center gap-2">
                <span>عمودي:</span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={crop.top}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCrop(prev => ({ ...prev, top: val, bottom: val }));
                  }}
                  className="w-20 accent-emerald-500"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? t.common.loading : t.scanner.applyCrop}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
