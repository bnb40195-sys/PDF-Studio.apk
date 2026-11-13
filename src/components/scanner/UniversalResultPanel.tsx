import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  FileDown, 
  Calculator, 
  Receipt, 
  Stethoscope, 
  CreditCard, 
  UserCheck, 
  QrCode, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  Download, 
  Share2, 
  Globe, 
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { UniversalScanResult } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateDocumentPdf } from '../../utils/pdfGenerator';

interface Props {
  result: UniversalScanResult;
  onClose?: () => void;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const UniversalResultPanel: React.FC<Props> = ({ 
  result, 
  onClose, 
  onReanalyze, 
  isAnalyzing 
}) => {
  const { currentTheme, showToast, t, setActiveTab, setPrefilledDocFromAi } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(t.common.copied, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Download vCard for business cards
  const downloadVCard = () => {
    if (!result.contactData) return;
    const c = result.contactData;
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${c.fullName || ''}
ORG:${c.company || ''}
TITLE:${c.jobTitle || ''}
TEL:${c.phone || ''}
EMAIL:${c.email || ''}
URL:${c.website || ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.fullName || 'contact'}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تحميل بطاقة جهة الاتصال (vCard) بنجاح', 'success');
  };

  // Export official report PDF based on the detected type
  const exportOfficialReportPdf = async () => {
    setIsExportingPdf(true);
    try {
      let docTitle = result.title;
      let subtitle = result.typeLabel;
      let templateId: any = 'report';
      let contentBody = `• ملخص نتائج الفحص الرقمي:
${result.summary}

• الحقول والبيانات المستخرجة:
${result.keyFields.map(f => `  - ${f.label}: ${f.value}`).join('\n')}

• خطوات وإجراءات التوصية:
${result.actionItems.map(a => `  ✓ ${a}`).join('\n')}`;

      // Customize if math
      if (result.mathSolution) {
        docTitle = `حل المسألة الرياضية: ${result.mathSolution.equation}`;
        subtitle = 'MATH HOMEWORK SOLUTION REPORT';
        contentBody = `• المسألة / المعادلة الأصلية:
${result.mathSolution.equation}

• خطوات الحل الرياضي المفصلة:
${result.mathSolution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

• الناتج والحل النهائي:
★ ${result.mathSolution.finalAnswer} ★

• التلخيص والمفاهيم الرياضية المستخدمة:
${result.summary}`;
      }

      // Customize if invoice
      if (result.financials) {
        docTitle = `تقرير تدقيق فاتورة: ${result.financials.vendorName || 'فاتورة'}`;
        subtitle = `INVOICE AUDIT #${result.financials.invoiceNumber || '2026'}`;
        templateId = 'invoice';
      }

      // Customize if medical
      if (result.medicalData) {
        docTitle = `سجل وصفة وفحص طبي: ${result.medicalData.patientName || 'المريض'}`;
        subtitle = 'CLINICAL PRESCRIPTION & DIAGNOSIS';
      }

      const { url } = await generateDocumentPdf({
        title: docTitle,
        subtitle,
        author: 'DocuScan Universal Scanner Engine',
        subject: result.typeLabel,
        date: new Date().toISOString().split('T')[0],
        templateId,
        content: contentBody,
        stamp: 'OFFICIAL',
        primaryColor: '#059669',
        pageSize: 'a4',
        orientation: 'portrait',
        items: result.financials?.lineItems?.map((item, idx) => ({
          id: `item_${idx}`,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: parseFloat(item.amount || '0') || 0,
        })),
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.detectedType}_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('تم تصدير تقرير النتائج الموثق كـ PDF بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast(t.common.error, 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Send to AI PDF Creator
  const sendToAiCreator = () => {
    setPrefilledDocFromAi({
      title: result.title,
      subtitle: result.typeLabel,
      author: 'DocuScan Studio',
      subject: result.typeLabel,
      date: new Date().toISOString().split('T')[0],
      templateId: result.detectedType === 'invoice_receipt' ? 'invoice' : 'report',
      content: `${result.summary}\n\n${result.extractedText}`,
      primaryColor: '#059669',
      pageSize: 'a4',
      orientation: 'portrait',
      stamp: 'APPROVED',
      items: result.financials?.lineItems?.map((item, idx) => ({
        id: `item_${idx}`,
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.amount || '0') || 0,
      })),
    });
    setActiveTab('creator');
    showToast('تم نقل البيانات بنجاح إلى صانع الـ PDF', 'success');
  };

  const getCategoryIcon = () => {
    switch (result.detectedType) {
      case 'math_equation':
        return <Calculator className="w-5 h-5 text-amber-400" />;
      case 'invoice_receipt':
        return <Receipt className="w-5 h-5 text-emerald-400" />;
      case 'medical_prescription':
        return <Stethoscope className="w-5 h-5 text-sky-400" />;
      case 'id_card_passport':
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case 'business_card':
        return <UserCheck className="w-5 h-5 text-purple-400" />;
      case 'qr_barcode':
        return <QrCode className="w-5 h-5 text-teal-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCategoryThemeColors = () => {
    switch (result.detectedType) {
      case 'math_equation':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-300';
      case 'invoice_receipt':
        return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
      case 'medical_prescription':
        return 'border-sky-500/40 bg-sky-950/20 text-sky-300';
      case 'id_card_passport':
        return 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300';
      case 'business_card':
        return 'border-purple-500/40 bg-purple-950/20 text-purple-300';
      case 'qr_barcode':
        return 'border-teal-500/40 bg-teal-950/20 text-teal-300';
      default:
        return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
    }
  };

  return (
    <div className={`rounded-2xl border ${getCategoryThemeColors()} p-5 space-y-4 shadow-xl transition-all`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm shrink-0">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                {result.typeLabel}
              </span>
              {result.confidence && (
                <span className="text-[11px] text-slate-400 font-mono">
                  دقة التحقق: {result.confidence}
                </span>
              )}
            </div>
            <h3 className={`text-base sm:text-lg font-bold mt-1 ${currentTheme.textPrimaryClass}`}>
              {result.title}
            </h3>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="إعادة الفحص والتحليل"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>إعادة فحص</span>
            </button>
          )}

          <button
            onClick={() => copyToClipboard(
              `${result.title}\n\n${result.summary}\n\n${result.extractedText}`,
              'all'
            )}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ النتائج</span>
          </button>

          <button
            onClick={exportOfficialReportPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? t.common.loading : 'تصدير تقرير PDF'}</span>
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
          {result.summary}
        </p>
      </div>

      {/* 1. MATH EQUATION SOLVER RESULT */}
      {result.mathSolution && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              <span>المعادلة الرياضية المحلولة:</span>
            </span>
            <button
              onClick={() => copyToClipboard(result.mathSolution!.equation, 'math-eq')}
              className="text-xs text-amber-400 hover:text-amber-200 flex items-center gap-1"
            >
              {copiedKey === 'math-eq' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>نسخ المعادلة</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/90 border border-amber-500/30 text-amber-200 font-mono text-sm sm:text-base text-center tracking-wider font-bold">
            {result.mathSolution.equation}
          </div>

          {result.mathSolution.steps && result.mathSolution.steps.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                خطوات الحل المنطقي بالتفصيل:
              </span>
              <div className="space-y-1 text-xs text-slate-200">
                {result.mathSolution.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Answer Highlight */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  الناتج والحل النهائي (Final Result)
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono">
                  {result.mathSolution.finalAnswer}
                </span>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(result.mathSolution!.finalAnswer, 'math-ans')}
              className="px-2.5 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-medium"
            >
              {copiedKey === 'math-ans' ? 'تم النسخ' : 'نسخ الناتج'}
            </button>
          </div>
        </div>
      )}

      {/* 2. INVOICE & FINANCIALS BREAKDOWN */}
      {result.financials && (
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" />
              <span>تفاصيل الفاتورة المالية والضريبية:</span>
            </span>
            {result.financials.invoiceNumber && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                رقم: {result.financials.invoiceNumber}
              </span>
            )}
          </div>

          {/* Key totals cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">الجهة / المتجر</span>
              <span className="text-xs font-bold text-white truncate block mt-0.5">
                {result.financials.vendorName || 'غير محدد'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المبلغ قبل الضريبة</span>
              <span className="text-xs font-bold text-slate-200 block mt-0.5 font-mono">
                {result.financials.subtotal || '-'} {result.financials.currency || ''}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">ضريبة القيمة المضافة</span>
              <span className="text-xs font-bold text-amber-300 block mt-0.5 font-mono">
                {result.financials.tax || '-'} {result.financials.currency || ''}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50">
              <span className="text-[10px] text-emerald-400 font-bold block">الإجمالي الكلي المطلوب</span>
              <span className="text-sm font-extrabold text-white block mt-0.5 font-mono">
                {result.financials.totalAmount || '-'} {result.financials.currency || ''}
              </span>
            </div>
          </div>

          {/* Line items table if available */}
          {result.financials.lineItems && result.financials.lineItems.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2">البند / الوصف</th>
                    <th className="p-2 text-center">الكمية</th>
                    <th className="p-2 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                  {result.financials.lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium text-slate-200">{item.description}</td>
                      <td className="p-2 text-center font-mono text-slate-400">{item.quantity || 1}</td>
                      <td className="p-2 text-left font-mono text-emerald-400 font-bold">{item.amount || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. MEDICAL PRESCRIPTION & CLINICAL DATA */}
      {result.medicalData && (
        <div className="p-4 rounded-xl border border-sky-500/50 bg-sky-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4" />
              <span>البيانات الطبية والوصفة العلاجية:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">اسم المريض</span>
              <span className="text-xs font-bold text-white block mt-0.5">
                {result.medicalData.patientName || 'مريض معتمد'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">الطبيب / العيادة</span>
              <span className="text-xs font-bold text-white block mt-0.5">
                {result.medicalData.doctorName || 'استشاري معتمد'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">التشخيص السريري</span>
              <span className="text-xs font-bold text-sky-300 block mt-0.5">
                {result.medicalData.diagnosis || 'استشارة وفحص عام'}
              </span>
            </div>
          </div>

          {/* Medications list */}
          {result.medicalData.medications && result.medicalData.medications.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">الأدوية الموصوفة والجرعات:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.medicalData.medications.map((med, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-sky-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{med.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                        {med.dosage}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-300 font-medium">التكرار: {med.frequency}</p>
                    {med.instructions && (
                      <p className="text-[10px] text-slate-400">{med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.medicalData.recommendations && (
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              <strong className="text-sky-300">توصيات الطبيب: </strong>
              {result.medicalData.recommendations}
            </div>
          )}
        </div>
      )}

      {/* 4. ID CARD / PASSPORT DATA */}
      {result.idCardData && (
        <div className="p-4 rounded-xl border border-indigo-500/50 bg-indigo-950/30 space-y-3">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span>بيانات الوثيقة الرسمية / بطاقة الهوية:</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {result.idCardData.fullName && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الاسم الكامل</span>
                <span className="text-xs font-bold text-white block mt-0.5">{result.idCardData.fullName}</span>
              </div>
            )}
            {result.idCardData.idNumber && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">رقم الهوية / الجواز</span>
                <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5 select-all">{result.idCardData.idNumber}</span>
              </div>
            )}
            {result.idCardData.nationality && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الجنسية</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5">{result.idCardData.nationality}</span>
              </div>
            )}
            {result.idCardData.birthDate && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">تاريخ الميلاد</span>
                <span className="text-xs font-mono text-slate-300 block mt-0.5">{result.idCardData.birthDate}</span>
              </div>
            )}
            {result.idCardData.expiryDate && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">تاريخ الانتهاء</span>
                <span className="text-xs font-mono text-amber-300 block mt-0.5">{result.idCardData.expiryDate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. BUSINESS CARD & CONTACT EXPORT */}
      {result.contactData && (
        <div className="p-4 rounded-xl border border-purple-500/50 bg-purple-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>بطاقة العمل والاتصال:</span>
            </span>
            <button
              onClick={downloadVCard}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>حفظ كجهة اتصال (vCard)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {result.contactData.fullName && (
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">الاسم:</span>
                <span className="font-bold text-white">{result.contactData.fullName}</span>
              </div>
            )}
            {result.contactData.jobTitle && (
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">المسمى الوظيفي:</span>
                <span className="font-medium text-purple-300">{result.contactData.jobTitle}</span>
              </div>
            )}
            {result.contactData.company && (
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">الشركة / المؤسسة:</span>
                <span className="font-medium text-slate-200">{result.contactData.company}</span>
              </div>
            )}
            {result.contactData.phone && (
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">رقم الهاتف:</span>
                  <a href={`tel:${result.contactData.phone}`} className="font-mono text-emerald-400 hover:underline">
                    {result.contactData.phone}
                  </a>
                </div>
                <button
                  onClick={() => copyToClipboard(result.contactData!.phone!, 'phone')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
            {result.contactData.email && (
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">البريد الإلكتروني:</span>
                  <a href={`mailto:${result.contactData.email}`} className="font-mono text-sky-400 hover:underline">
                    {result.contactData.email}
                  </a>
                </div>
                <button
                  onClick={() => copyToClipboard(result.contactData!.email!, 'email')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Fields Grid (for all categories) */}
      {result.keyFields && result.keyFields.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>البيانات والحقول المستخرجة:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {result.keyFields.map((field, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  field.highlight
                    ? 'border-emerald-500/40 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block truncate">{field.label}</span>
                  <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">
                    {field.value}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(field.value, `field_${idx}`)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                >
                  {copiedKey === `field_${idx}` ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Action Items */}
      {result.actionItems && result.actionItems.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>إجراءات مقترحة فورية:</span>
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.actionItems.map((action, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/60"
              >
                ✓ {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Text & Translation Accordion */}
      <div className="border-t border-slate-800/60 pt-3">
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>عرض النص المفرغ كاملاً والترجمة ({result.extractedText.length} حرف)</span>
          </span>
          {showFullText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFullText && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">النص المستخرج:</span>
              <button
                onClick={() => copyToClipboard(result.extractedText, 'fulltext')}
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'fulltext' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>نسخ النص الكامل</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={result.extractedText}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs resize-none"
            />

            {result.translatedText && (
              <div className="space-y-1 pt-1">
                <span className="text-xs text-sky-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>الترجمة العربية:</span>
                </span>
                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-900/40 text-xs text-slate-200">
                  {result.translatedText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Conversion / Integration bar */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={sendToAiCreator}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>توليد ملف PDF رسمي من هذه النتائج</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            إخفاء لوحة النتائج
          </button>
        )}
      </div>
    </div>
  );
};
