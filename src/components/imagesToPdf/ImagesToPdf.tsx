import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Images, 
  Upload, 
  Download, 
  RotateCw, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Sparkles, 
  Layers, 
  CheckCircle,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImageToPdfItem, ImageToPdfOptions, convertImagesToPdf } from '../../utils/imageToPdf';
import { readFileAsDataUrl, loadImage } from '../../utils/imageProcessing';

export const ImagesToPdf: React.FC = () => {
  const { currentTheme, t, showToast, scannedPages } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageToPdfItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'slim',
    quality: 'high',
    includePageNumbers: true,
  });

  // Handle image files selection
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newItems: ImageToPdfItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const img = await loadImage(dataUrl);
          newItems.push({
            id: `img_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            dataUrl,
            name: file.name,
            width: img.width,
            height: img.height,
            rotation: 0,
          });
        } catch (err) {
          console.error('Error loading image', err);
        }
      }
    }

    if (newItems.length > 0) {
      setImages(prev => [...prev, ...newItems]);
      showToast(`تمت إضافة ${newItems.length} صورة بنجاح`, 'success');
    }
  };

  // Import from scanned pages
  const handleImportFromScanner = () => {
    if (scannedPages.length === 0) {
      showToast('لا توجد صفحات ممسوحة ضوئياً للاستيراد', 'warning');
      return;
    }

    const imported: ImageToPdfItem[] = scannedPages.map((p, idx) => ({
      id: `imported_${p.id}`,
      dataUrl: p.enhancedDataUrl || p.originalDataUrl,
      name: p.title || `صفحة ${idx + 1}`,
      width: p.width,
      height: p.height,
      rotation: p.rotation,
    }));

    setImages(prev => [...prev, ...imported]);
    showToast(`تم استيراد ${imported.length} صفحة من الماسح الضوئي`, 'success');
  };

  // Rotate specific image 90 deg
  const handleRotateImage = (id: string) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, rotation: (img.rotation + 90) % 360 };
      }
      return img;
    }));
  };

  // Remove image
  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Move up/down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Convert & Download
  const handleConvertAndDownload = async () => {
    if (images.length === 0) return;
    setIsConverting(true);

    try {
      const { url } = await convertImagesToPdf(images, options);
      setPreviewPdfUrl(url);

      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = `Images_Document_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('تم تحويل وتنزيل ملف الـ PDF بنجاح ⚡ (محلياً بدون إنترنت)', 'success');
    } catch (err) {
      console.error('PDF conversion failed', err);
      showToast(t.common.error, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass}`}>
              {t.imagesToPdf.title}
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
              100% بدون إنترنت ⚡
            </span>
          </div>
          <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
            {t.imagesToPdf.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف إلى هاتف</span>
          </button>

          {scannedPages.length > 0 && (
            <button
              onClick={handleImportFromScanner}
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border ${currentTheme.borderClass} ${currentTheme.cardBgClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-2 transition-all shadow-sm`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>استيراد من الماسح ({scannedPages.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Images Grid & Reorder (Left 8 cols) */}
        <div className={`lg:col-span-8 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textPrimaryClass}`}>
              {t.imagesToPdf.imageCount}: ({images.length} صفحة)
            </span>
            {images.length > 0 && (
              <button
                onClick={() => setImages([])}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                مسح الكل
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`p-8 rounded-xl border border-dashed ${
                isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/60'
              } flex flex-col items-center justify-center gap-3 text-center transition-colors`}
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>اختيار صور</span>
                </button>

                {scannedPages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportFromScanner}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border ${currentTheme.borderClass} ${currentTheme.textPrimaryClass} hover:bg-white/10 flex items-center gap-2`}
                  >
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>استيراد صفحات الماسح ({scannedPages.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {images.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-slate-800 bg-slate-950 p-2 flex flex-col justify-between overflow-hidden shadow-sm hover:border-emerald-500/60 transition-all"
                >
                  {/* Page number badge */}
                  <span className="absolute top-3 left-3 z-10 w-6 h-6 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs flex items-center justify-center font-mono font-bold">
                    {idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                      className="w-full h-full object-cover transition-transform duration-200"
                    />
                  </div>

                  {/* Caption & Controls */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 truncate max-w-20">
                      {item.name}
                    </span>

                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="تحريك للأمام"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="تحريك للخلف"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRotateImage(item.id)}
                        className="p-1 rounded text-emerald-400 hover:text-emerald-300"
                        title="تدوير 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(item.id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Options & PDF Export Panel (Right 4 cols) */}
          <div className={`lg:col-span-4 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-5 sticky top-20`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/40">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${currentTheme.textPrimaryClass}`}>
                خيارات تنسيق الـ PDF
              </h3>
            </div>

            {/* Page Size */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block">{t.imagesToPdf.pageSize}</label>
              <select
                value={options.pageSize}
                onChange={(e) => setOptions({ ...options, pageSize: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="a4">{t.imagesToPdf.pageA4}</option>
                <option value="letter">{t.imagesToPdf.pageLetter}</option>
                <option value="fit-image">{t.imagesToPdf.pageFit}</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block">{t.imagesToPdf.orientation}</label>
              <select
                value={options.orientation}
                onChange={(e) => setOptions({ ...options, orientation: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">{t.imagesToPdf.orientationAuto}</option>
                <option value="portrait">{t.imagesToPdf.orientationPortrait}</option>
                <option value="landscape">{t.imagesToPdf.orientationLandscape}</option>
              </select>
            </div>

            {/* Margins */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block">{t.imagesToPdf.margin}</label>
              <select
                value={options.margin}
                onChange={(e) => setOptions({ ...options, margin: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="none">{t.imagesToPdf.marginNone}</option>
                <option value="slim">{t.imagesToPdf.marginSlim}</option>
                <option value="normal">{t.imagesToPdf.marginNormal}</option>
              </select>
            </div>

            {/* Quality & Page Numbers */}
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={options.includePageNumbers}
                  onChange={(e) => setOptions({ ...options, includePageNumbers: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
                />
                <span>{t.imagesToPdf.includePageNumbers}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={options.quality === 'high'}
                  onChange={(e) => setOptions({ ...options, quality: e.target.checked ? 'high' : 'medium' })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
                />
                <span>جودة طباعة أصلية فائقة (300 DPI)</span>
              </label>
            </div>

            {/* Download CTA */}
            <button
              onClick={handleConvertAndDownload}
              disabled={isConverting || images.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isConverting ? t.common.loading : t.imagesToPdf.convertAndDownload}</span>
            </button>

            {/* Offline reassurance banner */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تتم معالجة الصور وتوليد ملف الـ PDF محلياً بالكامل على جهازك بدون إنترنت.</span>
            </div>
          </div>
        </div>
      </div>
  );
};
