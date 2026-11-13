import React, { useState } from 'react';
import { 
  FolderOpen, 
  Images, 
  FilePlus, 
  Sparkles, 
  Layers, 
  FileText,
  Eye,
  Sliders,
  Award,
  Download,
  Share2,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PdfViewer } from '../viewer/PdfViewer';
import { ImagesToPdf } from '../imagesToPdf/ImagesToPdf';
import { PdfCreator } from '../creator/PdfCreator';
import { AiPdfCreator } from '../ai/AiPdfCreator';
import { ExternalPathPickerModal } from '../common/ExternalPathPickerModal';

export type PdfStudioSubTab = 'viewer' | 'images-to-pdf' | 'creator' | 'ai-creator';

interface PdfStudioProps {
  initialSubTab?: PdfStudioSubTab;
}

export const PdfStudio: React.FC<PdfStudioProps> = ({ initialSubTab = 'viewer' }) => {
  const { currentTheme, openedPdf, scannedPages } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<PdfStudioSubTab>(initialSubTab);
  const [showExternalPathModal, setShowExternalPathModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass} flex items-center gap-2.5`}>
              <Layers className="w-7 h-7 text-emerald-400" />
              <span>استوديو ومحرر ملفات PDF الشامل</span>
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium font-mono">
              دمج كل أدوات الـ PDF في مكان واحد ⚡
            </span>
          </div>
          <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
            فتح وعرض ملفات PDF، تحويل الصور إلى PDF، تصميم وتوليد ملفات PDF، وصياغة وتنسيق العقود والفواتير
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowExternalPathModal(true)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} hover:bg-white/10 ${currentTheme.textPrimaryClass} flex items-center gap-2 transition-all shadow-sm active:scale-95`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>إختيار مسارات ملفات PDF من الهاتف</span>
          </button>

          {/* Quick status badge if a PDF or images are loaded */}
          {openedPdf && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono truncate max-w-[200px]">{openedPdf.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Merged Navigation Tabs for all PDF operations */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => setActiveSubTab('viewer')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'viewer'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>عارض ومحرر PDF</span>
          {openedPdf && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              مفتوح
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('images-to-pdf')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'images-to-pdf'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Images className="w-4 h-4" />
          <span>تحويل الصور لـ PDF</span>
        </button>

        <button
          onClick={() => setActiveSubTab('creator')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'creator'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FilePlus className="w-4 h-4" />
          <span>تصميم وتوليد PDF</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai-creator')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'ai-creator'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-lg'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>صياغة بالذكاء الاصطناعي</span>
        </button>
      </div>

      {/* Render Active PDF Tool */}
      <div className="pt-2">
        {activeSubTab === 'viewer' && <PdfViewer />}
        {activeSubTab === 'images-to-pdf' && <ImagesToPdf />}
        {activeSubTab === 'creator' && <PdfCreator />}
        {activeSubTab === 'ai-creator' && <AiPdfCreator />}
      </div>

      {/* External Phone Path Selector Modal */}
      <ExternalPathPickerModal
        isOpen={showExternalPathModal}
        onClose={() => setShowExternalPathModal(false)}
        defaultTab="pdf"
      />
    </div>
  );
};
