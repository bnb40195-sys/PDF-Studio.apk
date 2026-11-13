import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  FileText, 
  Download, 
  Eye, 
  Sparkles, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Stamp, 
  Palette, 
  Layers, 
  ShieldCheck,
  RefreshCw,
  Upload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentTemplateId, PdfDocumentState, InvoiceItem } from '../../types';
import { generateDocumentPdf } from '../../utils/pdfGenerator';
import { SignaturePad } from './SignaturePad';

export const PdfCreator: React.FC = () => {
  const { currentTheme, t, showToast, prefilledDocFromAi, setPrefilledDocFromAi, setActiveTab: setGlobalActiveTab } = useApp();

  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateId>('invoice');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Form State
  const [docState, setDocState] = useState<PdfDocumentState>({
    title: 'فاتورة تجارية ضريبية',
    subtitle: 'TAX INVOICE - مؤسسة التقنية الحديثة',
    author: 'شركة الأفق الرقمي للتطوير والبرمجيات',
    subject: 'معاملة مالية معتمدة',
    date: new Date().toISOString().split('T')[0],
    templateId: 'invoice',
    content: 'نشكركم على تعاملكم معنا. يرجى سداد المبلغ المستحق عبر الحساب البنكي المعتمد خلال 14 يوماً من تاريخ الإصدار.',
    items: [
      { id: '1', description: 'تطوير وتصميم واجهات تطبيق الويب التفاعلية', quantity: 1, unitPrice: 3500 },
      { id: '2', description: 'تهيئة الخوادم السحابية ونظام الحماية المتقدم', quantity: 1, unitPrice: 1200 },
      { id: '3', description: 'الدعم الفني والصيانة الدورية الشهرية', quantity: 3, unitPrice: 400 },
    ],
    stamp: 'PAID',
    watermarkText: '',
    signerName: 'م. أحمد السالم',
    signerTitle: 'المدير المالي التنفيذي',
    primaryColor: '#059669',
    pageSize: 'a4',
    orientation: 'portrait',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setDocState(prev => ({ ...prev, logo: dataUrl }));
        showToast(`تم رفع وتضمين الشعار: ${file.name}`, 'success');
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.json') || file.type === 'application/json') {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        setDocState(prev => ({ ...prev, ...parsed }));
        showToast(`تم استيراد بيانات الملف: ${file.name}`, 'success');
      } catch (err) {
        showToast('تعذر قراءة بيانات الملف المرفوع', 'error');
      }
    } else {
      showToast('يرجى اختيار صورة شعار أو ملف إعدادات صالح', 'info');
    }
  };

  // Switch template templates defaults
  const handleSelectTemplate = (templateId: DocumentTemplateId) => {
    setSelectedTemplate(templateId);
    let newDoc: Partial<PdfDocumentState> = { templateId };

    if (templateId === 'invoice') {
      newDoc = {
        templateId: 'invoice',
        title: 'فاتورة ضريبية رسمية',
        subtitle: 'COMMERCIAL TAX INVOICE',
        author: 'مؤسسة التقنية والابتكار الرقمي',
        content: 'تعتبر هذه الفاتورة سنداً رسمياً معتمداً. جميع المبالغ بالريال السعودي.',
        items: [
          { id: '1', description: 'خدمات المسح الضوئي والأرشفة السحابية المتطورة', quantity: 1, unitPrice: 2200 },
          { id: '2', description: 'ترقية رخص برمجيات إدارة الملفات', quantity: 2, unitPrice: 650 },
        ],
        stamp: 'PAID',
        primaryColor: '#059669',
      };
    } else if (templateId === 'report') {
      newDoc = {
        templateId: 'report',
        title: 'تقرير الإنجاز والتدقيق الفني',
        subtitle: 'QUARTERLY PERFORMANCE & AUDIT REPORT',
        author: 'لجنة الجودة والتطوير المؤسسي',
        content: `1. الملخص التنفيذي:
تم استكمال مراحل الأرشفة الرقمية بنجاح بنسبة إنجاز بلغت 100% مع تحقيق معايير الدقة القياسية.

2. مؤشرات الأداء الرئيسية (KPIs):
- إجمالي الأوراق والصفحات المفحوصة والممسوحة: 14,850 صفحة
- نسبة الوضوح ونقاء النصوص المعتمدة: 99.4%
- زمن الاستجابة والأرشفة السحابية: أقل من 1.2 ثانية

3. التوصيات:
المضي قدماً في اعتماد النسخ الرقمية الموقعة كمرجع أساسي، وأرشفة السجلات التاريخية وفق أعلى معايير الأمان.`,
        items: [],
        stamp: 'APPROVED',
        primaryColor: '#0284c7',
      };
    } else if (templateId === 'official-letter') {
      newDoc = {
        templateId: 'official-letter',
        title: 'خطاب رسمي رسمي موثق',
        subtitle: 'OFFICIAL MEMORANDUM & CORRESPONDENCE',
        author: 'الإدارة العامة للشؤون القانونية والتوثيق',
        content: `إلى من يهمه الأمر،

تحية طيبة وبعد،،،

نفيدكم بموجب هذا الخطاب الرسمي الموثق بأنه قد تمت المصادقة على كافة البيانات والمعاملات المشار إليها، وهي سارية المفعول ومعتمدة رسمياً لدى كافة الجهات المختصة والمعنية.

وتفضلوا بقبول فائق الاحترام والتقدير.`,
        items: [],
        stamp: 'OFFICIAL',
        primaryColor: '#4f46e5',
      };
    } else if (templateId === 'certificate') {
      newDoc = {
        templateId: 'certificate',
        title: 'شهادة شكر وتقدير واعتزاز',
        subtitle: 'CERTIFICATE OF EXCELLENCE & ACHIEVEMENT',
        author: 'مجلس الإدارة والأمانة العامة',
        content: `يسرنا أن نمنح هذه الشهادة تقديراً للجهود الاستثنائية والمساهمة المتميزة في إنجاح مشروع التحول الرقمي وحفظ التراث المؤسسي الرقمي بأعلى درجات الإتقان والمهنية العالية.`,
        items: [],
        stamp: 'APPROVED',
        primaryColor: '#b45309',
        orientation: 'landscape',
      };
    } else if (templateId === 'resume') {
      newDoc = {
        templateId: 'resume',
        title: 'السيرة الذاتية المهنية (CV)',
        subtitle: 'PROFESSIONAL CURRICULUM VITAE',
        author: 'المهندس / عمر الهاشمي',
        content: `• الملف الشخصي:
مهندس برمجيات ونظم خبير بخبرة تزيد عن 8 سنوات في تطوير البنى السحابية والتحول الرقمي للوثائق.

• الخبرات العملية:
- كبير مهندسي الحلول الرقمية (2022 - الآن): قيادة فرق هندسية لبناء منصات إدارة الملفات وتكاملها.
- مهندس برمجيات أول (2018 - 2022): تصميم وتطوير محركات المعالجة الرقمية.

• المهارات الأساسية:
TypeScript, React, Python, Document Engineering, Cloud Architecture.`,
        items: [],
        stamp: 'NONE',
        primaryColor: '#0f172a',
      };
    } else if (templateId === 'contract') {
      newDoc = {
        templateId: 'contract',
        title: 'عقد اتفاقية تقديم خدمات مهنية',
        subtitle: 'MASTER SERVICES AGREEMENT',
        author: 'المستشار القانوني المعتمد',
        content: `البند الأول: موضوع العقد
يلتزم الطرف الأول بتقديم خدمات المسح الضوئي، وإدارة الملفات، والربط البرمجي السحابي لصالح الطرف الثاني وفق أعلى معايير الجودة والسرية التامة.

البند الثاني: السرية وحماية البيانات
يتعهد الطرفان بالحفاظ التام على سرية المعلومات والملفات المتداولة وعدم إفشائها لأي طرف ثالث دون موافقة خطية مسبقة.

البند الثالث: القانون الحاكم
يخضع هذا العقد ويفسر وفقاً للأنظمة واللوائح السارية المعمول بها.`,
        items: [],
        stamp: 'OFFICIAL',
        primaryColor: '#1e293b',
      };
    } else {
      newDoc = {
        templateId: 'custom',
        title: 'ملف مخصص جديد',
        subtitle: 'CUSTOM DOCUMENT',
        author: 'المحرر المستقل',
        content: 'اكتب محتوى ملفك المخصص هنا بكل حرية ومرونة...',
        items: [],
        stamp: 'NONE',
        primaryColor: '#059669',
      };
    }

    setDocState(prev => ({ ...prev, ...newDoc }));
    showToast(t.creator.sampleLoaded, 'info');
  };

  // Add Item to Invoice
  const handleAddInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `${Date.now()}`,
      description: 'بند جديد إضافي',
      quantity: 1,
      unitPrice: 100,
    };
    setDocState(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleUpdateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setDocState(prev => ({
      ...prev,
      items: (prev.items || []).map(item => item.id === id ? { ...item, ...updates } : item),
    }));
  };

  const handleRemoveItem = (id: string) => {
    setDocState(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== id),
    }));
  };

  // Generate & Preview PDF
  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const { url } = await generateDocumentPdf(docState);
      setPreviewPdfUrl(url);
      showToast('تم إنشاء ومعاينة ملف الـ PDF بنجاح', 'success');
    } catch (err) {
      console.error('PDF creation error:', err);
      showToast(t.common.error, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Final PDF
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const { url } = await generateDocumentPdf(docState);
      
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
      a.download = `${(docState.title || 'document').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(t.common.success, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(t.common.error, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load AI-prefilled document if coming from AI creator
  useEffect(() => {
    if (prefilledDocFromAi) {
      setDocState(prefilledDocFromAi);
      setSelectedTemplate(prefilledDocFromAi.templateId);
      // Immediately regenerate preview for the new AI doc
      generateDocumentPdf(prefilledDocFromAi)
        .then(({ url }) => {
          setPreviewPdfUrl(url);
          showToast('تم تحميل وتنسيق الملف من الذكاء الاصطناعي بنجاح ✨', 'success');
        })
        .catch(console.error);
      setPrefilledDocFromAi(null);
    }
  }, [prefilledDocFromAi]);

  // Generate initial preview on mount
  useEffect(() => {
    if (!prefilledDocFromAi) {
      handleGeneratePdf();
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass}`}>
            {t.creator.title}
          </h1>
          <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
            {t.creator.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.json,application/json"
            className="hidden"
            onChange={handleUploadedFile}
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
            onClick={() => setGlobalActiveTab('ai-creator')}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>صياغة بالذكاء الاصطناعي ✨</span>
          </button>

          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border ${currentTheme.borderClass} ${currentTheme.cardBgClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-2 transition-all shadow-sm`}
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>تحديث المعاينة</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Builder on Left / Live PDF Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls Column */}
        <div className={`lg:col-span-7 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-5`}>
          {/* Template Selector Strip */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textMutedClass} block`}>
              {t.creator.selectTemplate}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'invoice', label: t.creator.templateInvoice, icon: '💰' },
                { id: 'report', label: t.creator.templateReport, icon: '📊' },
                { id: 'official-letter', label: t.creator.templateLetter, icon: '✉️' },
                { id: 'certificate', label: t.creator.templateCertificate, icon: '🏆' },
                { id: 'resume', label: t.creator.templateResume, icon: '👤' },
                { id: 'contract', label: t.creator.templateContract, icon: '📜' },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id as DocumentTemplateId)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs font-medium flex items-center gap-2 ${
                    selectedTemplate === tmpl.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-sm'
                      : `border-slate-800 bg-slate-900/60 ${currentTheme.textPrimaryClass} hover:bg-white/5`
                  }`}
                >
                  <span className="text-base">{tmpl.icon}</span>
                  <span className="truncate">{tmpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.docTitle}</label>
              <input
                type="text"
                value={docState.title}
                onChange={(e) => setDocState({ ...docState, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.docSubtitle}</label>
              <input
                type="text"
                value={docState.subtitle}
                onChange={(e) => setDocState({ ...docState, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.author}</label>
              <input
                type="text"
                value={docState.author}
                onChange={(e) => setDocState({ ...docState, author: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.date}</label>
              <input
                type="date"
                value={docState.date}
                onChange={(e) => setDocState({ ...docState, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* If Invoice, render Line Items editor */}
          {docState.templateId === 'invoice' && (
            <div className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {t.creator.invoiceItems}
                </span>
                <button
                  type="button"
                  onClick={handleAddInvoiceItem}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.creator.addItem}</span>
                </button>
              </div>

              <div className="space-y-2">
                {(docState.items || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder={t.creator.itemDescription}
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder={t.creator.quantity}
                      value={item.quantity}
                      min="1"
                      onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                      className="w-16 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder={t.creator.unitPrice}
                      value={item.unitPrice}
                      min="0"
                      onChange={(e) => handleUpdateItem(item.id, { unitPrice: Number(e.target.value) })}
                      className="w-20 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                    <span className="w-20 text-right font-mono font-bold text-emerald-400">
                      ${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Body Textarea */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">{t.creator.content}</label>
            <textarea
              rows={6}
              value={docState.content}
              onChange={(e) => setDocState({ ...docState, content: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Official Stamps Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 flex items-center gap-1.5">
              <Stamp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.creator.stampsAndBadges}</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { val: 'NONE', label: t.creator.stampNone },
                { val: 'APPROVED', label: t.creator.stampApproved, color: 'text-emerald-400 border-emerald-500/40' },
                { val: 'PAID', label: t.creator.stampPaid, color: 'text-sky-400 border-sky-500/40' },
                { val: 'CONFIDENTIAL', label: t.creator.stampConfidential, color: 'text-rose-400 border-rose-500/40' },
                { val: 'OFFICIAL', label: t.creator.stampOfficial, color: 'text-indigo-400 border-indigo-500/40' },
                { val: 'DRAFT', label: t.creator.stampDraft, color: 'text-slate-400 border-slate-500/40' },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setDocState({ ...docState, stamp: s.val as any })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    docState.stamp === s.val
                      ? 'bg-white/10 ring-2 ring-emerald-500 font-bold'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Watermark & Accent Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.watermark}</label>
              <input
                type="text"
                placeholder={t.creator.watermarkPlaceholder}
                value={docState.watermarkText || ''}
                onChange={(e) => setDocState({ ...docState, watermarkText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.themeColor}</label>
              <div className="flex items-center gap-2 pt-1">
                {['#059669', '#0284c7', '#4f46e5', '#b45309', '#0f172a', '#e11d48'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setDocState({ ...docState, primaryColor: col })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      docState.primaryColor === col ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Electronic Signature */}
          <SignaturePad
            initialSignature={docState.signatureDataUrl}
            onSaveSignature={(dataUrl) => setDocState({ ...docState, signatureDataUrl: dataUrl })}
            onClearSignature={() => setDocState({ ...docState, signatureDataUrl: undefined })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.signerName}</label>
              <input
                type="text"
                value={docState.signerName || ''}
                onChange={(e) => setDocState({ ...docState, signerName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">{t.creator.signerTitle}</label>
              <input
                type="text"
                value={docState.signerTitle || ''}
                onChange={(e) => setDocState({ ...docState, signerTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className={`lg:col-span-5 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} p-5 space-y-4 sticky top-20`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textPrimaryClass}`}>
                معاينة الـ PDF المباشرة
              </span>
            </div>

            <button
              onClick={handleGeneratePdf}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              تحديث
            </button>
          </div>

          {/* Embedded PDF Object or Canvas Preview */}
          <div className="w-full h-[600px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative">
            {previewPdfUrl ? (
              <iframe
                src={`${previewPdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="PDF Live Preview"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <FileText className="w-10 h-10" />
                <span className="text-xs">جاري تجهيز المعاينة...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
