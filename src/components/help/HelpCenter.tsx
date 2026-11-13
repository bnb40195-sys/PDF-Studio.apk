import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  CheckCircle2, 
  Lightbulb, 
  Keyboard, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Stamp,
  FolderOpen,
  Smartphone,
  Download,
  Github
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HelpCenter: React.FC = () => {
  const { currentTheme, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = (t.help.faqs || []).filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass}`}>
          {t.help.title}
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
          {t.help.subtitle}
        </p>
      </div>

      {/* 3-Step Visual Quick Start */}
      <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-6`}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-emerald-400" />
          <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
            {t.help.quickGuide}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className={`text-sm font-bold ${currentTheme.textPrimaryClass}`}>
              {t.help.step1Title}
            </h3>
            <p className={`text-xs ${currentTheme.textMutedClass} leading-relaxed`}>
              {t.help.step1Desc}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className={`text-sm font-bold ${currentTheme.textPrimaryClass}`}>
              {t.help.step2Title}
            </h3>
            <p className={`text-xs ${currentTheme.textMutedClass} leading-relaxed`}>
              {t.help.step2Desc}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className={`text-sm font-bold ${currentTheme.textPrimaryClass}`}>
              {t.help.step3Title}
            </h3>
            <p className={`text-xs ${currentTheme.textMutedClass} leading-relaxed`}>
              {t.help.step3Desc}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion with Search */}
      <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
              {t.help.faqTitle}
            </h2>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث في الأسئلة الشائعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <span className={`text-xs sm:text-sm font-bold ${currentTheme.textPrimaryClass}`}>
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <p className="text-center py-6 text-xs text-slate-400">
              لم يتم العثور على نتائج تطابق بحثك.
            </p>
          )}
        </div>
      </div>

      {/* Android APK Building & Direct Download Card */}
      <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
                تطبيق الأندرويد (Android Debug APK)
              </h2>
              <p className={`text-xs ${currentTheme.textMutedClass}`}>
                بناء تلقائي عبر GitHub Actions وتحميل مباشر عبر GitHub Releases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              .github/workflows/build-apk.yml
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
            <span className="font-bold text-emerald-400 block">1. التشغيل التلقائي</span>
            <p className="text-slate-300 leading-relaxed">
              عند رفع الكود (Push) إلى فرع main أو إنشاء وسم إصدار جديد (v*), يبدأ GitHub Actions تلقائياً بتجميع الـ APK.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
            <span className="font-bold text-emerald-400 block">2. بناء الـ APK عبر Gradle</span>
            <p className="text-slate-300 leading-relaxed">
              يقوم سير العمل بتثبيت بيئة Android SDK و JDK 21 وتوليد حزمة <code className="text-emerald-300">DocuScan-PDFStudio-debug.apk</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
            <span className="font-bold text-emerald-400 block">3. التحميل المباشر</span>
            <p className="text-slate-300 leading-relaxed">
              يتم إرفاق الـ APK كملف جاهز للتحميل المباشر في تبويب <strong>Releases</strong> أو من <strong>Actions Artifacts</strong> لتثبيته فوراً.
            </p>
          </div>
        </div>
      </div>

      {/* Pro Tips & Keyboard Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Tips */}
        <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
              {t.help.tipsTitle}
            </h2>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 mt-1">•</span>
              <span>{t.help.tip1}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 mt-1">•</span>
              <span>{t.help.tip2}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 mt-1">•</span>
              <span>{t.help.tip3}</span>
            </li>
          </ul>
        </div>

        {/* Security & Privacy Guarantee */}
        <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
              الأمان والخصوصية المطلقة
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            تطبيق DocuScan Studio يعمل بنسبة 100% محلياً داخل متصفحك عبر تقنيات Canvas و WebAssembly و JavaScript الحديثة. لا يتم إرسال أي ملفات أو أوراق أو صور أو توقيعات إلى أي خادم خارجي على الإطلاق.
          </p>

          <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>معالجة محلية بالكامل دون اتصال خارجي</span>
          </div>
        </div>
      </div>
    </div>
  );
};
