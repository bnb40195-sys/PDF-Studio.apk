import React from 'react';
import { 
  Globe, 
  Palette, 
  FileCheck, 
  RotateCcw, 
  Check, 
  Sliders, 
  Sparkles,
  Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, BackgroundThemeId } from '../../types';
import { backgroundThemes } from '../../utils/themes';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    currentTheme, 
    t, 
    showToast 
  } = useApp();

  const handleLanguageChange = (lang: Language) => {
    updateSettings({ language: lang });
    showToast(t.settings.settingsSaved, 'success');
  };

  const handleThemeChange = (themeId: BackgroundThemeId) => {
    updateSettings({ themeId });
    showToast(t.settings.settingsSaved, 'success');
  };

  const handleReset = () => {
    updateSettings({
      language: 'ar',
      themeId: 'dark-obsidian',
      defaultPageSize: 'a4',
      defaultOrientation: 'portrait',
      pdfQuality: 'high',
      autoEnhanceScans: true,
      includeTimestampWatermark: true,
    });
    showToast('تمت استعادة الإعدادات الافتراضية بنجاح', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimaryClass}`}>
          {t.settings.title}
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMutedClass}`}>
          {t.settings.subtitle}
        </p>
      </div>

      {/* 1. Language Settings */}
      <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
              {t.settings.languageSection}
            </h2>
            <p className={`text-xs ${currentTheme.textMutedClass}`}>
              {t.settings.languageDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { id: 'ar', label: 'العربية', sub: 'Arabic (RTL)', flag: '🇸🇦' },
            { id: 'en', label: 'English', sub: 'English (LTR)', flag: '🇬🇧' },
            { id: 'fr', label: 'Français', sub: 'French (LTR)', flag: '🇫🇷' },
            { id: 'es', label: 'Español', sub: 'Spanish (LTR)', flag: '🇪🇸' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleLanguageChange(item.id as Language)}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                settings.language === item.id
                  ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/20'
                  : `border-slate-800 bg-slate-900/50 hover:bg-white/5`
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.flag}</span>
                <div>
                  <p className={`text-sm font-bold ${currentTheme.textPrimaryClass}`}>
                    {item.label}
                  </p>
                  <span className="text-[11px] text-slate-400">{item.sub}</span>
                </div>
              </div>
              {settings.language === item.id && (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Theme & Background Wallpaper Settings */}
      <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
              {t.settings.themeSection}
            </h2>
            <p className={`text-xs ${currentTheme.textMutedClass}`}>
              {t.settings.themeDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {backgroundThemes.map((theme) => {
            const isSelected = settings.themeId === theme.id;
            const themeName = theme.name[settings.language] || theme.name.ar;

            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/20'
                    : `border-slate-800 bg-slate-900/50 hover:bg-white/5`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-white/20 shadow-inner shrink-0"
                    style={{ backgroundColor: theme.previewColor }}
                  />
                  <div>
                    <p className={`text-xs sm:text-sm font-bold ${currentTheme.textPrimaryClass}`}>
                      {themeName}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {theme.mode === 'dark' ? 'نمط داكن مريح' : 'نمط فاتح ناصع'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PDF Export Preferences */}
      <div className={`p-6 rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} space-y-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${currentTheme.textPrimaryClass}`}>
              {t.settings.exportSection}
            </h2>
            <p className={`text-xs ${currentTheme.textMutedClass}`}>
              {t.settings.exportDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Paper Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {t.settings.defaultPaperSize}
            </label>
            <select
              value={settings.defaultPageSize}
              onChange={(e) => updateSettings({ defaultPageSize: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="a4">A4 (210 × 297 mm) - القياس القياسي</option>
              <option value="letter">US Letter (8.5 × 11 in)</option>
              <option value="legal">US Legal (8.5 × 14 in)</option>
            </select>
          </div>

          {/* Quality */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {t.settings.defaultQuality}
            </label>
            <select
              value={settings.pdfQuality}
              onChange={(e) => updateSettings({ pdfQuality: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="high">{t.settings.qualityHigh}</option>
              <option value="medium">{t.settings.qualityMedium}</option>
              <option value="compact">{t.settings.qualityCompact}</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoEnhanceScans}
              onChange={(e) => updateSettings({ autoEnhanceScans: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
            />
            <span className={`text-xs sm:text-sm ${currentTheme.textPrimaryClass}`}>
              تطبيق فلتر التنقية الذكية تلقائياً عند المسح
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeTimestampWatermark}
              onChange={(e) => updateSettings({ includeTimestampWatermark: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
            />
            <span className={`text-xs sm:text-sm ${currentTheme.textPrimaryClass}`}>
              {t.settings.includeWatermarkToggle}
            </span>
          </label>
        </div>
      </div>

      {/* Footer Reset */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.settings.resetDefaults}</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">
          DocuScan Studio v2.4 · 100% Client-Side Privacy
        </span>
      </div>
    </div>
  );
};
