import React, { useState } from 'react';
import { 
  ScanLine, 
  FolderOpen, 
  Settings, 
  HelpCircle, 
  Camera,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExternalPathPickerModal } from './common/ExternalPathPickerModal';

export const Header: React.FC<{ onTriggerScan?: () => void }> = ({ onTriggerScan }) => {
  const { activeTab, setActiveTab, currentTheme, t } = useApp();
  const [showExternalModal, setShowExternalModal] = useState(false);

  return (
    <header className={`sticky top-0 z-40 w-full border-b ${currentTheme.borderClass} ${currentTheme.cardBgClass} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <ScanLine className="w-5 h-5" />
          </div>
          <button 
            onClick={() => setActiveTab('scanner')} 
            className="text-left font-bold text-lg tracking-tight whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            <span className={currentTheme.textPrimaryClass}>DocuScan</span>
            <span className="text-emerald-500 font-light mx-1">·</span>
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400">PDF Studio</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'scanner'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : `${currentTheme.textMutedClass} hover:${currentTheme.textPrimaryClass} hover:bg-white/5`
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>{t.nav.scanner}</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf-studio')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'pdf-studio' || activeTab === 'viewer' || activeTab === 'images-to-pdf' || activeTab === 'creator' || activeTab === 'ai-creator'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold shadow-sm'
                : `${currentTheme.textMutedClass} hover:${currentTheme.textPrimaryClass} hover:bg-white/5`
            }`}
          >
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span>استوديو ومحرر PDF الشامل</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : `${currentTheme.textMutedClass} hover:${currentTheme.textPrimaryClass} hover:bg-white/5`
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.nav.settings}</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'help'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : `${currentTheme.textMutedClass} hover:${currentTheme.textPrimaryClass} hover:bg-white/5`
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t.nav.help}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowExternalModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all shadow-sm active:scale-95"
            title="إختيار مسارات ملفات PDF و QR من مصدر خارجي من الهاتف"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">مسارات ملفات الهاتف</span>
          </button>

          <div 
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700/60 text-slate-400 bg-slate-900/60"
            title="التطبيق يعمل بالكامل بدون إنترنت 100%، وتتطلب ميزات الذكاء الاصطناعي فقط اتصالاً"
          >
            <span>⚡ بدون نت 100%</span>
          </div>
        </div>
      </div>

      {/* Mobile nav strip with horizontal scroll */}
      <div className="lg:hidden flex items-center gap-1 border-t border-slate-800/40 px-3 py-2 overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'scanner' ? 'text-emerald-400 font-bold bg-emerald-500/10' : currentTheme.textMutedClass
          }`}
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>{t.nav.scanner}</span>
        </button>
        <button
          onClick={() => setActiveTab('pdf-studio')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'pdf-studio' || activeTab === 'viewer' || activeTab === 'images-to-pdf' || activeTab === 'creator' || activeTab === 'ai-creator'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : currentTheme.textMutedClass
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>استوديو PDF</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'settings' ? 'text-emerald-400 font-bold bg-emerald-500/10' : currentTheme.textMutedClass
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t.nav.settings}</span>
        </button>
        <button
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'help' ? 'text-emerald-400 font-bold bg-emerald-500/10' : currentTheme.textMutedClass
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t.nav.help}</span>
        </button>
      </div>

      {/* External Phone Path Selector Modal */}
      <ExternalPathPickerModal
        isOpen={showExternalModal}
        onClose={() => setShowExternalModal(false)}
      />
    </header>
  );
};
