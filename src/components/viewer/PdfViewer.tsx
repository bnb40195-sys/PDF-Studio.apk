import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  FileText, 
  Sparkles, 
  Layers, 
  Stamp,
  Maximize2,
  RefreshCw,
  ScanLine,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createSampleDemoPdf, watermarkExternalPdf } from '../../utils/pdfGenerator';
import { ScannedPage } from '../../types';
import { ExternalPathPickerModal } from '../common/ExternalPathPickerModal';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const PdfViewer: React.FC = () => {
  const { 
    openedPdf, 
    setOpenedPdf, 
    currentTheme, 
    t, 
    showToast, 
    addScannedPages, 
    setActiveTab 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState<boolean>(false);
  const [watermarkInput, setWatermarkInput] = useState<string>('ORIGINAL COPY');
  const [showExternalPathModal, setShowExternalPathModal] = useState<boolean>(false);

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
      showToast(`تم فتح الملف: ${file.name}`, 'success');
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

  // Auto load demo PDF on mount if none is opened
  useEffect(() => {
    if (!openedPdf) {
      handleLoadDemoPdf();
    }
  }, []);

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
        console.warn('PDF.js render error, fallback to iframe viewer', err);
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

  // Send current page to scanner for enhancement
  const handleSendToScanner = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);

    const newScannedPage: ScannedPage = {
      id: `pdf_import_${Date.now()}`,
      originalDataUrl: dataUrl,
      enhancedDataUrl: dataUrl,
      filter: 'original',
      category: 'document',
      rotation: 0,
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      createdAt: Date.now(),
      title: `${openedPdf?.name || 'PDF'} - ص ${currentPage}`,
    };

    addScannedPages([newScannedPage]);
    showToast('تم إرسال الصفحة للماسح الضوئي للتنقية والتعديل', 'success');
    setActiveTab('scanner');
  };

  // Import all pages of the PDF to the Document Scanner
  const [isImportingAll, setIsImportingAll] = useState(false);
  const handleImportAllPages = async () => {
    if (!pdfDoc) return;
    setIsImportingAll(true);
    showToast('جاري استخراج كافة صفحات الـ PDF للماسح...', 'info');

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
      showToast(`تم استيراد كافة الصفحات (${importedList.length} صفحة) إلى الماسح الضوئي!`, 'success');
      setActiveTab('scanner');
    } catch (err) {
      console.error('Failed importing all pages', err);
      showToast('تعذر استيراد كافة الصفحات', 'error');
    } finally {
      setIsImportingAll(false);
    }
  };

  // Add watermark and download
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass}`}>
            {t.viewer.title}
          </h1>
          <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
            {t.viewer.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف إلى هاتف</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExternalPathModal(true)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-2 transition-all shadow-sm active:scale-95`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>إختيار مسارات ملفات PDF من الهاتف</span>
          </button>

          {!openedPdf && (
            <button
              onClick={handleLoadDemoPdf}
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-2 transition-all`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>ملف PDF تجريبي</span>
            </button>
          )}
        </div>
      </div>

      {!openedPdf ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-sm font-semibold text-slate-300 mb-4">
            يرجى اختيار ملف PDF لبدء العرض والتعديل
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleLoadDemoPdf}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border ${currentTheme.borderClass} ${currentTheme.textPrimaryClass} hover:bg-white/10 flex items-center gap-2`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>فتح ملف تجريبي</span>
            </button>
          </div>
        </div>
      ) : (
        /* PDF Reader Workspace */
        <div className={`rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-4`}>
          {/* Top PDF Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
            {/* File info */}
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className={`text-xs sm:text-sm font-bold truncate ${currentTheme.textPrimaryClass}`}>
                  {openedPdf.name}
                </p>
                <span className={`text-[11px] ${currentTheme.textMutedClass}`}>
                  {(openedPdf.size / 1024).toFixed(1)} KB · {totalPages} {t.common.pages}
                </span>
              </div>
            </div>

            {/* Navigation & Zoom Strip */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title={t.viewer.previousPage}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title={t.viewer.nextPage}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setScale(prev => Math.max(0.6, prev - 0.2))}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white"
                title={t.viewer.zoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-400 min-w-10 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={() => setScale(prev => Math.min(2.5, prev + 0.2))}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white"
                title={t.viewer.zoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSendToScanner}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1.5 transition-colors"
                title={t.viewer.sendPageToScanner}
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>إرسال للماسح</span>
              </button>

              {totalPages > 1 && (
                <button
                  onClick={handleImportAllPages}
                  disabled={isImportingAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:bg-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="استيراد كافة الصفحات للماسح الضوئي"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isImportingAll ? 'جاري الاستيراد...' : `استيراد كل الصفحات (${totalPages})`}</span>
                </button>
              )}

              <button
                onClick={handleSavePageAsImage}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${currentTheme.borderClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-1.5 transition-colors`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>حفظ كصورة</span>
              </button>

              <button
                onClick={() => setShowWatermarkModal(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${currentTheme.borderClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-1.5 transition-colors`}
              >
                <Stamp className="w-3.5 h-3.5 text-emerald-400" />
                <span>علامة مائية</span>
              </button>

              <button
                onClick={() => {
                  window.open(openedPdf.url, '_blank');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${currentTheme.borderClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-1.5 transition-colors`}
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>طباعة</span>
              </button>
            </div>
          </div>

          {/* Canvas Rendering Area */}
          <div className="relative min-h-[620px] max-h-[760px] bg-slate-950/90 rounded-xl border border-slate-800 p-6 flex items-center justify-center overflow-auto shadow-inner">
            {pdfDoc ? (
              <div className="relative shadow-2xl rounded overflow-hidden">
                <canvas ref={canvasRef} className="block max-w-full" />
                {isRendering && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg text-xs text-white border border-slate-700">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{t.viewer.renderingPage}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback to Native Iframe if PDF.js is unavailable */
              <iframe
                src={`${openedPdf.url}#page=${currentPage}&zoom=${Math.round(scale * 100)}`}
                className="w-full h-[660px] rounded-lg border-0"
                title={openedPdf.name}
              />
            )}
          </div>
        </div>
      )}

      {/* Watermark Dialog */}
      {showWatermarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`relative w-full max-w-md rounded-2xl border ${currentTheme.borderClass} bg-slate-950 text-white shadow-2xl p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Stamp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">إضافة علامة مائية على الـ PDF</h3>
              </div>
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">نص العلامة المائية:</label>
              <input
                type="text"
                value={watermarkInput}
                onChange={(e) => setWatermarkInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleApplyWatermark}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2"
              >
                <span>تطبيق وتحميل النسخة المائية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Phone Path Selector Modal */}
      <ExternalPathPickerModal
        isOpen={showExternalPathModal}
        onClose={() => setShowExternalPathModal(false)}
        defaultTab="pdf"
      />
    </div>
  );
};
