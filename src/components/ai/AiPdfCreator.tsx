import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  FileText, 
  Download, 
  Edit3, 
  Wand2, 
  Scan, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  FileCheck,
  ChevronRight,
  Wifi,
  WifiOff,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { DocumentTemplateId, PdfDocumentState, InvoiceItem } from '../../types';
import { generateDocumentWithAi, reconstructScanWithAi, checkAiAvailability } from '../../services/aiService';
import { generateDocumentPdf } from '../../utils/pdfGenerator';

export const AiPdfCreator: React.FC = () => {
  const { currentTheme, t, settings, scannedPages, setActiveTab, setPrefilledDocFromAi, showToast } = useApp();

  const [mode, setMode] = useState<'prompt' | 'scan'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<PdfDocumentState | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Check online/AI connectivity on mount
  useEffect(() => {
    const verifyAi = async () => {
      const available = await checkAiAvailability();
      setIsAiAvailable(available);
    };
    verifyAi();
  }, []);

  // Quick prompt presets
  const presets = [
    {
      title: t.aiCreator.presetInvoice,
      prompt: 'فاتورة تجارية ضريبية رسمية لخدمات استشارية وبرمجية، بقيمة 5400 ريال مع 3 بنود تفصيلية، وحساب ضريبة 15%، وملاحظات شروط الدفع خلال 14 يوماً.',
      template: 'invoice',
    },
    {
      title: t.aiCreator.presetContract,
      prompt: 'عقد اتفاقية تقديم خدمات تطوير ودعم فني بين طرف أول وطرف ثانٍ، يتضمن بنود نطاق العمل، الدفعات المالية، وحفظ السرية وحقوق الملكية الفكرية.',
      template: 'contract',
    },
    {
      title: t.aiCreator.presetReport,
      prompt: 'تقرير إنجاز ربع سنوي شامل لمشروع التحول الرقمي والأرشفة، مع ملخص تنفيذي، ومؤشرات الأداء الرئيسية KPIs، وأهم التوصيات الاستراتيجية.',
      template: 'report',
    },
    {
      title: t.aiCreator.presetCertificate,
      prompt: 'شهادة شكر وتقدير واعتزاز لموظف متميز تقديراً لجهوده الاستثنائية وتفانيه في إنجاح المشاريع المؤسسية بأعلى درجات الجودة والإتقان.',
      template: 'certificate',
    },
    {
      title: t.aiCreator.presetLetter,
      prompt: 'خطاب رسمي إداري موجه إلى الجهات المختصة لتفويض صلاحيات واعتماد مندوب رسمي للقيام بالإجراءات القانونية والمصادقة على المعاملات والأوراق.',
      template: 'official-letter',
    },
    {
      title: t.aiCreator.presetResume,
      prompt: 'سيرة ذاتية احترافية ملهمة لمهندس برمجيات ونظم سحابية بخبرة 7 سنوات، تبرز المهارات التقنية، والمشاريع الكبرى، والشهادات المهنية المعتمدة.',
      template: 'resume',
    },
  ];

  // Handle Preset Click
  const handleSelectPreset = (p: typeof presets[0]) => {
    setPrompt(p.prompt);
    setSelectedTemplate(p.template);
  };

  // Convert AI result to PdfDocumentState
  const formatAiResultToDocState = (data: any): PdfDocumentState => {
    return {
      title: data.title || 'ملف ذكي',
      subtitle: data.subtitle || '',
      author: data.author || 'DocuScan AI Studio',
      subject: data.subject || '',
      date: data.date || new Date().toISOString().split('T')[0],
      templateId: (data.templateId as DocumentTemplateId) || 'custom',
      content: data.content || '',
      items: Array.isArray(data.items)
        ? data.items.map((item: any, idx: number) => ({
            id: String(idx + 1),
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
          }))
        : [],
      stamp: data.stamp || 'APPROVED',
      primaryColor: data.primaryColor || '#059669',
      signerName: data.signerName || '',
      signerTitle: data.signerTitle || '',
      watermarkText: data.watermarkText || '',
      pageSize: data.pageSize === 'letter' ? 'letter' : 'a4',
      orientation: data.orientation === 'landscape' ? 'landscape' : 'portrait',
    };
  };

  // Generate Document from Prompt
  const handleGenerateFromPrompt = async () => {
    if (!prompt.trim()) {
      showToast('يرجى كتابة وصف الملف المطلوب صياغته', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateDocumentWithAi({
        prompt,
        templateType: selectedTemplate === 'auto' ? undefined : (selectedTemplate as DocumentTemplateId),
        language: settings.language,
        customInstructions: customInstructions.trim() ? customInstructions : undefined,
      });

      const formatted = formatAiResultToDocState(result);
      setGeneratedDoc(formatted);
      setSummary(result.summary || '');
      showToast('تمت صياغة الملف بالذكاء الاصطناعي بنجاح ✨', 'success');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      showToast(err.message || 'تعذر صياغة الملف. يرجى التحقق من الاتصال بالإنترنت.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload for scan reconstruction
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageBase64(reader.result as string);
      setSelectedScanId('');
      showToast('تم تحميل صورة الملف جاهزة للتحويل', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Transform Scanned Image to structured PDF Document
  const handleConvertScanToDoc = async () => {
    let imageToProcess: string | undefined = uploadedImageBase64 || undefined;

    if (!imageToProcess && selectedScanId) {
      const scan = scannedPages.find(p => p.id === selectedScanId);
      if (scan) {
        imageToProcess = scan.enhancedDataUrl || scan.originalDataUrl;
      }
    }

    if (!imageToProcess) {
      showToast('يرجى اختيار صفحة من الماسح الضوئي أو رفع ملف', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const result = await reconstructScanWithAi(
        imageToProcess,
        customInstructions.trim() ? customInstructions : undefined,
        settings.language
      );

      const formatted = formatAiResultToDocState(result);
      setGeneratedDoc(formatted);
      setSummary(result.summary || 'تم استخراج وتحويل الملف الممسوح بنجاح');
      showToast('تم تحويل الملف الممسوح إلى PDF رقمي فائق الوضوح ✨', 'success');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      console.error('Scan to Doc Error:', err);
      showToast(err.message || 'تعذر تحويل صورة الملف', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Send to PdfCreator to Edit and Certify
  const handleSendToStudio = () => {
    if (!generatedDoc) return;
    setPrefilledDocFromAi(generatedDoc);
    setActiveTab('creator');
    showToast('تم نقل الملف إلى محرر الـ PDF للتوقيع والاعتماد', 'success');
  };

  // 1-Click Instant Download
  const handleDownloadDirect = async () => {
    if (!generatedDoc) return;
    setIsDownloading(true);
    try {
      const { url } = await generateDocumentPdf(generatedDoc);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(generatedDoc.title || 'document').replace(/\s+/g, '_')}_ai.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(t.common.success, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(t.common.error, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header section with AI badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass} flex items-center gap-2.5`}>
              <span>{t.aiCreator.title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>محرك الذكاء الاصطناعي</span>
              </span>
            </h1>
          </div>
          <p className={`mt-1.5 text-xs sm:text-sm ${currentTheme.textMutedClass} max-w-3xl leading-relaxed`}>
            {t.aiCreator.subtitle}
          </p>
        </div>

        {/* Connectivity Status Chip */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAiAvailable === true && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>الذكاء الاصطناعي متصل ومتاح</span>
            </div>
          )}
          {isAiAvailable === false && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>جاري التحقق من الاتصال</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 w-fit">
          <button
            onClick={() => setMode('prompt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'prompt'
                ? 'bg-emerald-600 text-white shadow-sm'
                : `${currentTheme.textMutedClass} hover:${currentTheme.textPrimaryClass}`
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>صياغة بالأوامر والوصف النصي</span>
          </button>

          <button
            onClick={() => setMode('scan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'scan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : `${currentTheme.textMutedClass} hover:${currentTheme.textPrimaryClass}`
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>{t.aiCreator.scanToDocTitle}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode('scan');
            fileInputRef.current?.click();
          }}
          className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>رفع ملف إلى هاتف</span>
        </button>
      </div>

      {/* Main Grid: Input Builder vs Generated Document Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form & Presets */}
        <div className={`lg:col-span-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-5`}>
          {mode === 'prompt' ? (
            <>
              {/* Presets Strip */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textMutedClass} flex items-center gap-1.5`}>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.aiCreator.promptPresetsTitle}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-xs font-medium transition-all group"
                    >
                      <div className="font-semibold text-slate-200 group-hover:text-emerald-300 flex items-center justify-between">
                        <span>{p.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Prompt Textarea */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${currentTheme.textPrimaryClass}`}>
                  وصف الملف ومحتواه
                </label>
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.aiCreator.promptPlaceholder}
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-500"
                />
              </div>

              {/* Template Style & Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{t.aiCreator.template}</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="auto">{t.aiCreator.selectTemplateAuto}</option>
                    <option value="invoice">فاتورة تجارية ضريبية</option>
                    <option value="contract">عقد واتفاقية رسمية</option>
                    <option value="report">تقرير إنجاز وتدقيق</option>
                    <option value="official-letter">خطاب رسمي معتمد</option>
                    <option value="certificate">شهادة شكر وتقدير</option>
                    <option value="resume">سيرة ذاتية احترافية</option>
                    <option value="custom">ملف مخصص حر</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">لغة صياغة الملف</label>
                  <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono">
                    {settings.language === 'ar' && 'العربية (Arabic)'}
                    {settings.language === 'en' && 'English'}
                    {settings.language === 'fr' && 'Français'}
                    {settings.language === 'es' && 'Español'}
                  </div>
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.aiCreator.additionalInstructions}</label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={t.aiCreator.customInstructionsPlaceholder}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateFromPrompt}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.aiCreator.generating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t.aiCreator.generateBtn}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Mode 2: Scan to Structured Document with AI */
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textMutedClass}`}>
                  {t.aiCreator.selectScannedPage}
                </label>

                {scannedPages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {scannedPages.map((scan, idx) => (
                      <button
                        key={scan.id}
                        type="button"
                        onClick={() => {
                          setSelectedScanId(scan.id);
                          setUploadedImageBase64(null);
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 aspect-[3/4] transition-all ${
                          selectedScanId === scan.id
                            ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105 z-10'
                            : 'border-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={scan.enhancedDataUrl || scan.originalDataUrl}
                          alt={`Scan ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 px-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-xs text-slate-400">
                    لا توجد صفحات ممسوحة حالياً. يمكنك مسح ورقة بالكاميرا أو رفع ملف مباشرة.
                  </div>
                )}
              </div>

              {/* Upload image alternative */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">{t.aiCreator.orUploadNew}</label>
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl bg-slate-900/60 cursor-pointer transition-colors text-xs text-slate-300">
                  <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                  <span>اختيار صورة</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {uploadedImageBase64 && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">تم تحميل صورة الملف بنجاح وجاهزة للمعالجة</span>
                  </div>
                )}
              </div>

              {/* Special instructions */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{t.aiCreator.additionalInstructions}</label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="مثال: استخرج بنود الأسعار، وصحح التواريخ والأسماء..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleConvertScanToDoc}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.aiCreator.convertingScan}</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>{t.aiCreator.convertScanBtn}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Privacy & Offline Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{t.aiCreator.aiNotice}</span>
          </div>
        </div>

        {/* Right Column: AI Document Output & Studio Preview */}
        <div className={`lg:col-span-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h2 className={`text-sm font-bold uppercase tracking-wider ${currentTheme.textPrimaryClass}`}>
                {t.aiCreator.resultTitle}
              </h2>
            </div>

            {generatedDoc && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                جاهز للطباعة والاعتماد
              </span>
            )}
          </div>

          {generatedDoc ? (
            <div className="space-y-4">
              {/* Summary Banner */}
              {summary && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
                  <span className="font-bold ml-1">{t.aiCreator.summary}:</span>
                  <span>{summary}</span>
                </div>
              )}

              {/* Document Preview Card */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-slate-200">
                {/* Meta Header */}
                <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {generatedDoc.title}
                    </h3>
                    {generatedDoc.subtitle && (
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        {generatedDoc.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      {generatedDoc.author && <span>الجهة: {generatedDoc.author}</span>}
                      {generatedDoc.date && <span>التاريخ: {generatedDoc.date}</span>}
                    </div>
                  </div>

                  {/* Stamp Badge */}
                  {generatedDoc.stamp && generatedDoc.stamp !== 'NONE' && (
                    <div className="px-3 py-1.5 rounded-lg border-2 border-emerald-500 text-emerald-400 text-xs font-mono font-extrabold uppercase tracking-wider rotate-3">
                      {generatedDoc.stamp}
                    </div>
                  )}
                </div>

                {/* Line Items if Invoice */}
                {generatedDoc.items && generatedDoc.items.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">البنود والتكاليف:</span>
                    <div className="rounded-lg border border-slate-800 overflow-hidden text-xs">
                      <table className="w-full text-right">
                        <thead className="bg-slate-900 text-slate-400 text-[11px]">
                          <tr>
                            <th className="p-2">الوصف</th>
                            <th className="p-2 w-16 text-center">الكمية</th>
                            <th className="p-2 w-20 text-center">السعر</th>
                            <th className="p-2 w-24 text-center">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {generatedDoc.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="p-2">{it.description}</td>
                              <td className="p-2 text-center font-mono">{it.quantity}</td>
                              <td className="p-2 text-center font-mono">{it.unitPrice}</td>
                              <td className="p-2 text-center font-mono font-bold text-emerald-400">
                                {(it.quantity * it.unitPrice).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Content body preview */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">نص الملف:</span>
                  <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs leading-relaxed text-slate-300 whitespace-pre-line max-h-56 overflow-y-auto font-sans">
                    {generatedDoc.content}
                  </div>
                </div>

                {/* Signer Info */}
                {(generatedDoc.signerName || generatedDoc.signerTitle) && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span className="block font-bold text-slate-200">{generatedDoc.signerName}</span>
                      <span className="text-[11px] text-slate-400">{generatedDoc.signerTitle}</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                      معتمد إلكترونياً
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Edit in Studio or Download Directly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendToStudio}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-sm"
                >
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>{t.aiCreator.editInStudio}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDirect}
                  disabled={isDownloading}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{t.aiCreator.downloadDirect}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-96 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wand2 className="w-7 h-7" />
              </div>
              <h3 className={`text-sm font-bold ${currentTheme.textPrimaryClass}`}>
                لا يوجد ملف مُنشأ حتى الآن
              </h3>
              <p className={`text-xs ${currentTheme.textMutedClass} max-w-sm leading-relaxed`}>
                اختر أحد النماذج السريعة على اليمين أو اكتب طلبك باللغة الطبيعية لصياغة ملف PDF احترافي كامل خلال ثوانٍ.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
