import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText, 
  Layers, 
  Stamp,
  Maximize2,
  RefreshCw,
  ScanLine,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createSampleDemoPdf, watermarkExternalPdf } from '../../utils/pdfGenerator';
import { ScannedPage } from '../../types';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface Props {
  onClose?: () => void;
  onPageImported?: (page: ScannedPage) => void;
  onAllPagesImported?: (pages: ScannedPage[]) => void;
}

export const ScannerPdfViewer: React.FC<Props> = ({ 
  onClose, 
  onPageImported, 
  onAllPagesImported 
}) => {
  const { 
    openedPdf, 
    setOpenedPdf, 
    currentTheme, 
    t, 
    showToast, 
    addScannedPages 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isImportingAll, setIsImportingAll] = useState<boolean>(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState<boolean>(false);
  const [watermarkInput, setWatermarkInput] = useState<string>('ORIGINAL COPY');

  // Handle external PDF file selection
  const handleFileChange = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      showToast('يرجى اختيار ملف بصيغة PDF صالحة', 'warning');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOpenedPdf({
        name: file.name,
        size: file.size,
        url,
        arrayBuffer,
      });

      setCurrentPage(1);
      showToast(`تم فتح ملف PDF: ${file.name}`, 'success');
    } catch (err) {
      console.error('Failed reading PDF file', err);
      showToast(t.common.error, 'error');
    }
  };

  // Load sample demo PDF
  const handleLoadDemoPdf = async () => {
    try {
      const { blob, url } = await createSampleDemoPdf();
      const arrayBuffer = await blob.arrayBuffer();
      setOpenedPdf({
        name: 'Official_Audit_Report_2026.pdf',
        size: blob.size,
        url,
        arrayBuffer,
      });
      setCurrentPage(1);
      showToast('تم تحميل الملف التجريبي بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast(t.common.error, 'error');
    }
  };

  // Initialize PDF.js document when openedPdf changes
  useEffect(() => {
    if (!openedPdf?.url) {
      setPdfDoc(null);
      setTotalPages(1);
      return;
    }

    if (window.pdfjsLib) {
      window.pdfjsLib.getDocument(openedPdf.url).promise.then((loadedPdf: any) => {
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
      }).catch((err: any) => {
        console.warn('PDF.js render error', err);
      });
    }
  }, [openedPdf]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;
    setIsRendering(true);

    pdfDoc.getPage(currentPage).then((page: any) => {
      if (isCancelled) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      page.render(renderContext).promise.then(() => {
        if (!isCancelled) setIsRendering(false);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale]);

  // Import active page into Scanner gallery
  const handleImportCurrentPage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);

    const newPage: ScannedPage = {
      id: `pdf_page_${Date.now()}_${currentPage}`,
      originalDataUrl: dataUrl,
      enhancedDataUrl: dataUrl,
      filter: 'original',
      category: 'document',
      rotation: 0,
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      createdAt: Date.now(),
      title: `${openedPdf?.name || 'ملف PDF'} - ص ${currentPage}`,
    };

    addScannedPages([newPage]);
    if (onPageImported) onPageImported(newPage);
    showToast(`تم استيراد الصفحة ${currentPage} بنجاح إلى الماسح الضوئي`, 'success');
  };

  // Import all pages of the PDF at once
  const handleImportAllPages = async () => {
    if (!pdfDoc) return;
    setIsImportingAll(true);
    showToast('جاري استيراد كافة صفحات الـ PDF إلى الماسح...', 'info');

    try {
      const importedList: ScannedPage[] = [];

      for (let p = 1; p <= pdfDoc.numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: 1.5 });
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const ctx = offscreenCanvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.92);
          importedList.push({
            id: `pdf_bulk_${Date.now()}_${p}`,
            originalDataUrl: dataUrl,
            enhancedDataUrl: dataUrl,
            filter: 'original',
            category: 'document',
            rotation: 0,
            width: viewport.width,
            height: viewport.height,
            createdAt: Date.now() + p,
            title: `${openedPdf?.name || 'PDF'} - ص ${p}`,
          });
        }
      }

      addScannedPages(importedList);
      if (onAllPagesImported) onAllPagesImported(importedList);
      showToast(`تم استيراد كافة الصفحات (${importedList.length} صفحة) إلى الماسح الضوئي!`, 'success');
    } catch (err) {
      console.error('Failed importing all pages', err);
      showToast('تعذر استيراد كافة الصفحات', 'error');
    } finally {
      setIsImportingAll(false);
    }
  };

  // Save current page as image
  const handleSavePageAsImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${openedPdf?.name || 'document'}_page_${currentPage}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم حفظ الصفحة كصورة عالية الدقة', 'success');
  };

  // Apply watermark and download
  const handleApplyWatermark = async () => {
    if (!openedPdf?.arrayBuffer) return;
    try {
      const { url } = await watermarkExternalPdf(openedPdf.arrayBuffer, watermarkInput);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked_${openedPdf.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShowWatermarkModal(false);
      showToast('تم تطبيق العلامة المائية وتنزيل ملف PDF بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast(t.common.error, 'error');
    }
  };

  return (
    <div className={`rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-4 sm:p-5 space-y-4 shadow-xl transition-all`}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
        }}
      />

      {/* Top Header / Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base sm:text-lg font-bold ${currentTheme.textPrimaryClass}`}>
                عارض ومحرر ملفات الـ PDF المدمج
              </h2>
              {openedPdf && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {openedPdf.name}
                </span>
              )}
            </div>
            <p className={`text-xs ${currentTheme.textMutedClass}`}>
              تصفح ملفات PDF، استخرج صفحاتها لمعالجتها بالماسح وتطبيق الفلاتر والـ OCR، أو أضف علامة مائية.
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">


          {!openedPdf && (
            <button
              onClick={handleLoadDemoPdf}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ملف تجريبي</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="إغلاق العارض والعودة للماسح"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!openedPdf ? (
        /* Empty PDF dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-200">
            انقر هنا لاختيار ملف PDF أو اسحبه وأفلته
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            يمكنك استعراض أي ملف PDF مباشرة داخل الماسح، واستخراج صفحاته لتنقيتها وتعديلها وتحويلها لملفات ممسوحة بدقة عالية.
          </p>
        </div>
      ) : (
        /* Active PDF viewer area */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isRendering}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="px-2 text-xs font-mono text-slate-200 font-bold">
                صفحة {currentPage} من {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isRendering}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="px-1 text-[11px] font-mono text-slate-400">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScale(1.2)}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                100%
              </button>
            </div>

            {/* Import to Scanner Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleImportCurrentPage}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="استيراد هذه الصفحة إلى الماسح الضوئي لمعالجتها وفحصها"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>استيراد الصفحة للماسح</span>
              </button>

              {totalPages > 1 && (
                <button
                  onClick={handleImportAllPages}
                  disabled={isImportingAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="استيراد جميع الصفحات دفعة واحدة"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isImportingAll ? 'جاري الاستيراد...' : `استيراد كل الصفحات (${totalPages})`}</span>
                </button>
              )}

              <button
                onClick={() => setShowWatermarkModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                title="إضافة علامة مائية"
              >
                <Stamp className="w-3.5 h-3.5 text-amber-400" />
                <span>علامة مائية</span>
              </button>

              <button
                onClick={handleSavePageAsImage}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                title="حفظ الصفحة كصورة"
              >
                <Download className="w-3.5 h-3.5" />
                <span>حفظ صورة</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative min-h-[460px] max-h-[640px] bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-auto">
            {isRendering && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري رسم الصفحة...</span>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="max-w-full shadow-2xl rounded transition-transform" />
          </div>
        </div>
      )}

      {/* Watermark Modal */}
      {showWatermarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Stamp className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">إضافة علامة مائية على ملف الـ PDF</h3>
              </div>
              <button onClick={() => setShowWatermarkModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">نص العلامة المائية:</label>
              <input
                type="text"
                value={watermarkInput}
                onChange={(e) => setWatermarkInput(e.target.value)}
                placeholder="مثال: نسخة سرية / معتمد / DRAFT"
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleApplyWatermark}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تطبيق وتنزيل PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
