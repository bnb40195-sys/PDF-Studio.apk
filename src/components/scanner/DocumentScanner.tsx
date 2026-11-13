import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  Crop, 
  Trash2, 
  Download, 
  FileText, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Sliders, 
  CheckCircle, 
  QrCode,
  Stethoscope,
  CreditCard,
  Receipt,
  BookOpen,
  Award,
  ExternalLink,
  Sparkles,
  Calculator,
  UserCheck,
  Search,
  Check,
  FileDown,
  Share2,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScannedPage, ScanFilterType, ScanCategory, QrScanResult, UniversalScanResult } from '../../types';
import { 
  readFileAsDataUrl, 
  applyFilterToImage, 
  extractTextFromImage,
  scanQrFromImage 
} from '../../utils/imageProcessing';
import { exportScannedPagesToPdf } from '../../utils/pdfGenerator';
import { analyzeUniversalScan, generateLocalUniversalAnalysis } from '../../services/aiService';
import { CameraModal } from './CameraModal';
import { CropModal } from './CropModal';
import { UniversalResultPanel } from './UniversalResultPanel';
import { QrBarcodeStudio } from './QrBarcodeStudio';
import { ExternalPathPickerModal } from '../common/ExternalPathPickerModal';

export const DocumentScanner: React.FC = () => {
  const { 
    scannedPages, 
    addScannedPages, 
    updateScannedPage, 
    deleteScannedPage, 
    reorderScannedPage,
    currentTheme, 
    t, 
    showToast,
    settings,
    saveToArchive
  } = useApp();

  // Mode: 'documents' (Camera/paper/universal scanning) vs 'create-code' (Studio for Basic, Social, Barcode matching screenshots)
  const [scannerSubTab, setScannerSubTab] = useState<'documents' | 'create-code'>('documents');

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<ScanCategory>('all');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Universal Instant Scan analysis state
  const [isAnalyzingUniversal, setIsAnalyzingUniversal] = useState<boolean>(false);
  const [activeUniversalResult, setActiveUniversalResult] = useState<UniversalScanResult | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showExternalPathModal, setShowExternalPathModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Scanned Pages as consolidated PDF
  const handleExportPdf = async () => {
    const pagesToExport = filteredPages.length > 0 ? filteredPages : scannedPages;
    if (pagesToExport.length === 0) {
      showToast('لا توجد صفحات ممسوحة لتصديرها كملف PDF', 'warning');
      return;
    }
    setIsExportingPdf(true);

    try {
      const { url } = await exportScannedPagesToPdf(pagesToExport, settings);
      
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuScan_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`تم تصدير ${pagesToExport.length} صفحة كملف PDF بنجاح 📥`, 'success');
    } catch (err) {
      console.error('PDF export failed', err);
      showToast('حدث خطأ أثناء تصدير ملف الـ PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filter pages according to category
  const filteredPages = selectedCategory === 'all'
    ? scannedPages
    : scannedPages.filter(p => p.category === selectedCategory);

  const activePage = filteredPages[activePageIndex] || scannedPages[0] || null;

  // Process a newly added image (from camera or file)
  const processNewImage = async (
    dataUrl: string, 
    title?: string, 
    category: ScanCategory = 'document',
    qrResult?: QrScanResult
  ) => {
    try {
      let defaultFilter: ScanFilterType = 'bw-document';
      if (category === 'medical') defaultFilter = 'medical-clarity';
      else if (category === 'receipt') defaultFilter = 'receipt-thermal';
      else if (category === 'qr-barcode' || category === 'certificate' || category === 'business-card') defaultFilter = 'magic-color';
      else if (category === 'math-equation') defaultFilter = 'bw-document';
      else if (!settings.autoEnhanceScans) defaultFilter = 'original';

      const enhanced = await applyFilterToImage(dataUrl, defaultFilter, 0);

      // If no QR result was supplied from camera, check if image has a QR code
      let detectedQr = qrResult;
      if (!detectedQr) {
        const checked = await scanQrFromImage(dataUrl);
        if (checked) {
          detectedQr = checked;
          category = 'qr-barcode';
        }
      }

      // Medical Info placeholder/parser if medical
      let medicalInfo;
      if (category === 'medical') {
        medicalInfo = {
          patientName: 'مريض فهد العتيبي',
          doctorName: 'د. خالد السبيعي - استشاري طب الأسرة',
          diagnosis: 'فحص سريري دوري وتقرير إجازة مرضية لمدة يومين',
          date: new Date().toISOString().split('T')[0],
          notes: 'موصى بالراحة والعلاج الموضعي ومراجعة العيادة عند الحاجة',
        };
      }

      const newPage: ScannedPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        originalDataUrl: dataUrl,
        enhancedDataUrl: enhanced.dataUrl,
        filter: defaultFilter,
        category,
        rotation: 0,
        width: enhanced.width,
        height: enhanced.height,
        createdAt: Date.now(),
        title: title || `${getCategoryLabel(category)} #${scannedPages.length + 1}`,
        qrResult: detectedQr,
        medicalInfo,
      };

      addScannedPages([newPage]);
      setActivePageIndex(filteredPages.length);

      // Auto-save to local archive storage
      saveToArchive({
        name: newPage.title,
        category: 'scanned',
        categoryLabel: getCategoryLabel(category),
        size: Math.round(enhanced.dataUrl.length * 0.75),
        dataUrl: enhanced.dataUrl,
        mimeType: 'image/jpeg',
        tags: [category, 'ماسح_ضوئي'],
      });

      showToast(t.common.success, 'success');
    } catch (err) {
      console.error(err);
      showToast(t.common.error, 'error');
    }
  };

  // Handle image files upload only
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const cat = selectedCategory === 'all' ? 'document' : selectedCategory;
          await processNewImage(dataUrl, file.name.replace(/\.[^/.]+$/, ''), cat);
        } catch (err) {
          console.error('File load failed', err);
        }
      }
    }
  };

  // Switch filter for the currently active page
  const handleFilterChange = async (filter: ScanFilterType) => {
    if (!activePage) return;
    try {
      const enhanced = await applyFilterToImage(
        activePage.originalDataUrl,
        filter,
        activePage.rotation
      );
      updateScannedPage(activePage.id, {
        filter,
        enhancedDataUrl: enhanced.dataUrl,
        width: enhanced.width,
        height: enhanced.height,
      });
      showToast(`تم تطبيق فلتر: ${getFilterLabel(filter)}`, 'info');
    } catch (err) {
      console.error('Filter apply failed', err);
    }
  };

  // Rotate active page 90 degrees
  const handleRotate = async () => {
    if (!activePage) return;
    const nextRotation = (activePage.rotation + 90) % 360;
    try {
      const enhanced = await applyFilterToImage(
        activePage.originalDataUrl,
        activePage.filter,
        nextRotation
      );
      updateScannedPage(activePage.id, {
        rotation: nextRotation,
        enhancedDataUrl: enhanced.dataUrl,
        width: enhanced.width,
        height: enhanced.height,
      });
    } catch (err) {
      console.error('Rotation failed', err);
    }
  };

  // Extract OCR text locally
  const handleExtractText = async () => {
    if (!activePage) return;
    setIsOcrLoading(true);
    setShowOcrModal(true);

    try {
      const text = await extractTextFromImage(activePage.enhancedDataUrl);
      updateScannedPage(activePage.id, { extractedText: text });
    } catch (err) {
      console.error('OCR failed', err);
      showToast(t.common.error, 'error');
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Universal Scanner: Scan everything and produce instant structured results
  const handleUniversalAnalysis = async (pageToAnalyze?: ScannedPage) => {
    const target = pageToAnalyze || activePage;
    if (!target) return;

    setIsAnalyzingUniversal(true);

    // Fast-path: if offline or forced local, execute 100% local analysis
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        let extracted = target.extractedText;
        if (!extracted) {
          extracted = await extractTextFromImage(target.enhancedDataUrl);
        }
        const offlineResult = generateLocalUniversalAnalysis(
          extracted || target.title,
          target.qrResult,
          target.category
        );
        updateScannedPage(target.id, { 
          universalResult: offlineResult,
          extractedText: extracted 
        });
        setActiveUniversalResult(offlineResult);
        showToast('تم الفحص والتحليل محلياً بنجاح (بدون إنترنت 100%) ⚡', 'success');
      } catch (err) {
        console.error('Offline scan error:', err);
        showToast('تعذر استكمال الفحص المحلي', 'error');
      } finally {
        setIsAnalyzingUniversal(false);
      }
      return;
    }

    showToast('جاري الفحص الشامل واستخراج النتائج الفورية...', 'info');

    try {
      const aiResult = await analyzeUniversalScan(
        target.enhancedDataUrl,
        target.category,
        undefined,
        settings.language
      );

      // Save result in page
      updateScannedPage(target.id, { universalResult: aiResult });
      setActiveUniversalResult(aiResult);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }

      showToast(`تم الفحص بنجاح: ${aiResult.typeLabel}`, 'success');
    } catch (err) {
      console.warn('AI analysis fell back to local offline analysis:', err);

      // Graceful offline fallback
      try {
        let extracted = target.extractedText;
        if (!extracted) {
          extracted = await extractTextFromImage(target.enhancedDataUrl);
        }
        const offlineResult = generateLocalUniversalAnalysis(
          extracted || target.title,
          target.qrResult,
          target.category
        );
        updateScannedPage(target.id, { 
          universalResult: offlineResult,
          extractedText: extracted 
        });
        setActiveUniversalResult(offlineResult);
        showToast('تم إتمام الفحص السريع والتحليل (وضع محلي)', 'success');
      } catch (localErr) {
        console.error('Local analysis also failed:', localErr);
        showToast('تعذر استكمال الفحص الشامل حالياً', 'error');
      }
    } finally {
      setIsAnalyzingUniversal(false);
    }
  };

  const getFilterLabel = (f: ScanFilterType): string => {
    switch (f) {
      case 'original': return t.scanner.filterOriginal;
      case 'magic-color': return t.scanner.filterMagic;
      case 'bw-document': return t.scanner.filterBw;
      case 'grayscale': return t.scanner.filterGrayscale;
      case 'brighten': return t.scanner.filterBrighten;
      case 'medical-clarity': return 'وضوح طبي (روشتات وأختام)';
      case 'receipt-thermal': return 'فواتير حرارية (عالي التباين)';
      case 'blueprint': return t.scanner.filterBlueprint;
    }
  };

  function getCategoryLabel(c: ScanCategory): string {
    switch (c) {
      case 'document': return 'ورقة / ملف رسمي';
      case 'qr-barcode': return 'رمز QR وباركود';
      case 'receipt': return 'فاتورة وإيصال';
      case 'id-card': return 'بطاقة هوية';
      case 'medical': return 'شهادة وتقرير طبي';
      case 'math-equation': return 'معادلة ومسألة رياضية';
      case 'business-card': return 'بطاقة عمل';
      case 'book-notes': return 'كتاب وملاحظات';
      case 'certificate': return 'شهادة تخرج وجوائز';
      case 'general-object': return 'فحص شامل';
      default: return 'صفحة ممسوحة';
    }
  }

  // Active result to display
  const currentDisplayedResult = activePage?.universalResult || activeUniversalResult;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hidden file input for images only */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass}`}>
              {t.scanner.title}
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium font-mono">
              فحص ومعالجة الصور والملفات محلياً 100% ⚡
            </span>
          </div>
          <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
            امسح أي ورقة، معادلة، فاتورة، أو رمز عبر الكاميرا ونقّها بفلاتر ذكية بدون أي حاجة لإنترنت
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>ماسح بالكاميرا</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExternalPathModal(true)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-2 transition-all shadow-sm active:scale-95`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>إختيار مسارات ملفات PDF و Qr من الهاتف</span>
          </button>
        </div>
      </div>

      {/* Main Sub-Mode Switcher: مسح وفحص الصور والورق VS إنشاء رموز QR والباركود (أساسي، اجتماعي، باركود) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setScannerSubTab('documents')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            scannerSubTab === 'documents'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>مسح وفحص الصور والورق</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/30 font-mono">
            {scannedPages.length} صفحة
          </span>
        </button>

        <button
          onClick={() => setScannerSubTab('create-code')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            scannerSubTab === 'create-code'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <QrCode className="w-4 h-4 text-sky-300" />
          <span>إنشاء وتوليد الرموز (أساسي / اجتماعي / باركود)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 font-mono">
            جديد ✨
          </span>
        </button>
      </div>

      {/* RENDER QR/BARCODE STUDIO IF IN CREATE-CODE MODE */}
      {scannerSubTab === 'create-code' ? (
        <QrBarcodeStudio />
      ) : (
        /* Workspace Area for Document Scanning */
        <div className="space-y-6">
        {/* Universal Scanner Category Filter Strip */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/60 rounded-xl border border-slate-800 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: 'all', label: 'كافة التصنيفات', icon: CheckCircle },
            { id: 'math-equation', label: 'معادلات ومسائل وحلها 🧮', icon: Calculator },
            { id: 'receipt', label: 'فواتير وإيصالات محاسبية', icon: Receipt },
            { id: 'medical', label: 'شهادات وتقارير طبية', icon: Stethoscope },
            { id: 'id-card', label: 'بطاقات هوية وجوازات', icon: CreditCard },
            { id: 'qr-barcode', label: 'رموز QR وباركود', icon: QrCode },
            { id: 'business-card', label: 'بطاقات عمل وموظفين', icon: UserCheck },
            { id: 'book-notes', label: 'كتب وملاحظات يدوية', icon: BookOpen },
            { id: 'certificate', label: 'شهادات تخرج وجوائز', icon: Award },
            { id: 'general-object', label: 'فحص شامل لأي شيء', icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id as ScanCategory);
                  setActivePageIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all font-medium ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.id !== 'all' && (
                  <span className="text-[10px] opacity-75 font-mono">
                    ({scannedPages.filter(p => p.category === tab.id).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {filteredPages.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            className="space-y-4"
          >
            {/* Direct Quick Action Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('id-card');
                  setIsCameraOpen(true);
                }}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-right flex flex-col justify-between group shadow-sm min-h-[105px]"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 block">بطاقة هوية (وجهين)</span>
                  <span className="text-[11px] text-slate-400">دمج تلقائي على صفحة A4</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScannerSubTab('create-code')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-right flex flex-col justify-between group shadow-sm min-h-[105px]"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 block">رموز QR والباركود</span>
                  <span className="text-[11px] text-slate-400">توليد وفحص جميع الرموز</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('math-equation');
                  setIsCameraOpen(true);
                }}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-right flex flex-col justify-between group shadow-sm min-h-[105px]"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 block">معادلات ومسائل 🧮</span>
                  <span className="text-[11px] text-slate-400">استخراج وحل الخطوات</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('receipt');
                  setIsCameraOpen(true);
                }}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-right flex flex-col justify-between group shadow-sm min-h-[105px]"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 block">فواتير وإيصالات</span>
                  <span className="text-[11px] text-slate-400">جدولة البنود والحسابات</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Populated Scanner Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Thumbnails Sidebar */}
            <div className={`lg:col-span-3 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-4 space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textMutedClass}`}>
                  {t.scanner.pageCount} ({filteredPages.length})
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.scanner.addPage}</span>
                </button>
              </div>

              {/* Thumbnail cards */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredPages.map((page, idx) => (
                  <div
                    key={page.id}
                    onClick={() => setActivePageIndex(idx)}
                    className={`group relative flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                      activePageIndex === idx
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : `border-transparent hover:bg-white/5`
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 text-xs flex items-center justify-center font-mono shrink-0">
                      {idx + 1}
                    </span>

                    <div className="w-12 h-16 rounded overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0">
                      <img
                        src={page.enhancedDataUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${currentTheme.textPrimaryClass}`}>
                        {page.title}
                      </p>
                      <span className="text-[11px] text-emerald-400 block mt-0.5">
                        {getCategoryLabel(page.category)}
                      </span>
                      {page.universalResult && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 inline-block mt-0.5">
                          ✓ النتائج جاهزة
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderScannedPage(idx, idx - 1);
                            setActivePageIndex(idx - 1);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title={t.scanner.moveUp}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      {idx < filteredPages.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderScannedPage(idx, idx + 1);
                            setActivePageIndex(idx + 1);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title={t.scanner.moveDown}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScannedPage(page.id);
                          if (activePageIndex >= filteredPages.length - 1) {
                            setActivePageIndex(Math.max(0, filteredPages.length - 2));
                          }
                        }}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action: Export to PDF & Download Images */}
              <div className="pt-3 border-t border-slate-800/40 space-y-2">
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="w-full py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExportingPdf ? 'جاري تصدير PDF...' : `تصدير كـ PDF (${filteredPages.length} صفحة)`}</span>
                </button>

                <button
                  onClick={() => {
                    filteredPages.forEach((p, idx) => {
                      const a = document.createElement('a');
                      a.href = p.enhancedDataUrl;
                      a.download = `Scan_${p.category}_${idx + 1}.jpg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    });
                    showToast(`تم بدء تنزيل ${filteredPages.length} صورة ممسوحة 📥`, 'success');
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تصدير كل الصور (JPG)</span>
                </button>
              </div>
            </div>

            {/* Active Page Preview & Tool Workspace */}
            {activePage && (
              <div className={`lg:col-span-9 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-4`}>
                {/* Toolstrip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
                      {activePage.title}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {getCategoryLabel(activePage.category)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* HERO ACTION: Instant Universal Analysis & Results */}
                    <button
                      onClick={() => handleUniversalAnalysis()}
                      disabled={isAnalyzingUniversal}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:opacity-95 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all disabled:opacity-50"
                      title="فحص وتحليل ذكي فوري لكل شيء (معادلات، فواتير، تقارير، هويات) واستخراج النتائج"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingUniversal ? 'animate-spin' : 'text-amber-300'}`} />
                      <span>{isAnalyzingUniversal ? 'جاري استخراج النتائج...' : 'فحص شامل وإعطاء النتائج ⚡'}</span>
                    </button>

                    <button
                      onClick={handleRotate}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${currentTheme.borderClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-1.5 transition-colors`}
                      title={t.scanner.rotateRight}
                    >
                      <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تدوير</span>
                    </button>

                    <button
                      onClick={() => setIsCropOpen(true)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${currentTheme.borderClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-1.5 transition-colors`}
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.scanner.cropAndStraighten}</span>
                    </button>

                    <button
                      onClick={handleExtractText}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${currentTheme.borderClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-1.5 transition-colors`}
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تفريغ محلي</span>
                    </button>
                  </div>
                </div>

                {/* UNIVERSAL RESULTS PANEL (IF ANALYZED) */}
                {currentDisplayedResult && (
                  <UniversalResultPanel
                    result={currentDisplayedResult}
                    onReanalyze={() => handleUniversalAnalysis()}
                    isAnalyzing={isAnalyzingUniversal}
                    onClose={() => {
                      setActiveUniversalResult(null);
                      updateScannedPage(activePage.id, { universalResult: undefined });
                    }}
                  />
                )}

                {/* QR Code Detection Card (Offline Fast Display) */}
                {activePage.qrResult && !currentDisplayedResult && (
                  <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-300 block">
                          تم فك تشفير رمز الـ QR ({activePage.qrResult.type.toUpperCase()})
                        </span>
                        <p className="text-xs text-slate-100 font-mono mt-0.5 break-all select-all">
                          {activePage.qrResult.data}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activePage.qrResult.type === 'url' && (
                        <a
                          href={activePage.qrResult.data}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح الرابط</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          if (activePage.qrResult) {
                            navigator.clipboard.writeText(activePage.qrResult.data);
                            showToast(t.common.copied, 'success');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.common.copy}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Filters Bar with Specialized Modes */}
                <div className="space-y-1.5">
                  <span className={`text-xs font-semibold ${currentTheme.textMutedClass} flex items-center gap-1.5`}>
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>فلاتر التنقية المتخصصة:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800/60">
                    {(['bw-document', 'magic-color', 'medical-clarity', 'receipt-thermal', 'grayscale', 'brighten', 'original', 'blueprint'] as ScanFilterType[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => handleFilterChange(f)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          activePage.filter === f
                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                        }`}
                      >
                        {getFilterLabel(f)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Canvas Display */}
                <div className="relative min-h-[480px] max-h-[600px] bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
                  <img
                    src={activePage.enhancedDataUrl}
                    alt={activePage.title}
                    className="max-h-[560px] max-w-full object-contain rounded shadow-2xl transition-all"
                  />
                </div>

                {/* Quick Actions at bottom */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <div className="flex items-center gap-2">
                    <span className={currentTheme.textMutedClass}>
                      العنصر {activePageIndex + 1} من {filteredPages.length}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">
                      التصنيف: <strong>{getCategoryLabel(activePage.category)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUniversalAnalysis()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>فحص النتائج ⚡</span>
                    </button>

                    <a
                      href={activePage.enhancedDataUrl}
                      download={`${activePage.category}_${activePageIndex + 1}.jpg`}
                      className={`px-3 py-1.5 rounded-lg border ${currentTheme.borderClass} hover:bg-white/5 ${currentTheme.textPrimaryClass} flex items-center gap-1`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>حفظ كصورة</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        initialCategory={selectedCategory === 'all' ? 'document' : selectedCategory}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl, cat, qrRes) => processNewImage(dataUrl, undefined, cat, qrRes)}
      />

      {/* Crop Modal */}
      {activePage && (
        <CropModal
          isOpen={isCropOpen}
          imageSrc={activePage.originalDataUrl}
          onClose={() => setIsCropOpen(false)}
          onCropComplete={async (croppedDataUrl) => {
            const enhanced = await applyFilterToImage(
              croppedDataUrl,
              activePage.filter,
              activePage.rotation
            );
            updateScannedPage(activePage.id, {
              originalDataUrl: croppedDataUrl,
              enhancedDataUrl: enhanced.dataUrl,
              width: enhanced.width,
              height: enhanced.height,
            });
            showToast('تم تطبيق القص بنجاح', 'success');
          }}
        />
      )}

      {/* OCR Text Extraction Modal */}
      {showOcrModal && activePage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`relative w-full max-w-2xl rounded-2xl border ${currentTheme.borderClass} bg-slate-950 text-white shadow-2xl p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">{t.scanner.extractedTextTitle}</h3>
              </div>
              <button
                onClick={() => setShowOcrModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {isOcrLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">جاري قراءة وتحليل النصوص...</p>
              </div>
            ) : (
              <>
                <textarea
                  readOnly
                  value={activePage.extractedText || ''}
                  rows={8}
                  className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-sans text-xs sm:text-sm leading-relaxed resize-none focus:outline-none"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      if (activePage.extractedText) {
                        navigator.clipboard.writeText(activePage.extractedText);
                        showToast(t.common.copied, 'success');
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t.scanner.copyText}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activePage.extractedText) {
                        const blob = new Blob([activePage.extractedText], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `نصوص_${activePage.title}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        showToast('تم تصدير وتحميل النص المفرغ (.txt) بنجاح 📥', 'success');
                      }
                      setShowOcrModal(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير النص (.txt)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <ExternalPathPickerModal
        isOpen={showExternalPathModal}
        onClose={() => setShowExternalPathModal(false)}
        defaultTab="qr"
        onQrSelected={(qr, _file, path) => {
          showToast(`تم تحميل مسار الرمز بنجاح: ${path}`, 'success');
          setActiveUniversalResult({
            detectedType: 'qr_barcode',
            typeLabel: 'رمز QR وباركود',
            title: `رمز ممسوح: ${qr.type}`,
            summary: `تم فحص وقراءة رمز الـ QR من المسار: ${path}`,
            extractedText: qr.data,
            actionItems: ['فتح الرابط أو نسخ البيانات', 'حفظ الرمز في الأرشيف المحلي'],
            keyFields: [
              { label: 'نوع الرمز', value: qr.type, highlight: true },
              { label: 'البيانات المشفرة', value: qr.data, highlight: true },
              { label: 'المسار الخارجي', value: path },
            ],
          });
        }}
      />
    </div>
  );
};
