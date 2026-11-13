import { BackgroundTheme } from '../types';

export const backgroundThemes: BackgroundTheme[] = [
  {
    id: 'dark-obsidian',
    name: {
      ar: 'استوديو داكن (أوبسيديان)',
      en: 'Dark Obsidian Studio',
      fr: 'Studio Sombre Obsidienne',
      es: 'Estudio Oscuro Obsidiana'
    },
    mode: 'dark',
    bgClass: 'bg-[#090D16]',
    cardBgClass: 'bg-[#111726]/80 backdrop-blur-md',
    borderClass: 'border-slate-800/80',
    textPrimaryClass: 'text-slate-100',
    textMutedClass: 'text-slate-400',
    accentClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    patternClass: 'bg-pattern-dots',
    previewColor: '#090D16'
  },
  {
    id: 'paper-white',
    name: {
      ar: 'ورقي أبيض ناصع (كلاسيكي)',
      en: 'Clean Paper White',
      fr: 'Blanc Papier Pur',
      es: 'Blanco Papel Puro'
    },
    mode: 'light',
    bgClass: 'bg-[#F8FAFC]',
    cardBgClass: 'bg-white/95 backdrop-blur-md shadow-sm',
    borderClass: 'border-slate-200',
    textPrimaryClass: 'text-slate-900',
    textMutedClass: 'text-slate-500',
    accentClass: 'bg-slate-900 hover:bg-slate-800 text-white',
    patternClass: 'bg-pattern-grid-light',
    previewColor: '#F8FAFC'
  },
  {
    id: 'royal-emerald',
    name: {
      ar: 'الزمرد الملكي الفاخر',
      en: 'Royal Emerald & Mint',
      fr: 'Émeraude Royale',
      es: 'Esmeralda Real'
    },
    mode: 'dark',
    bgClass: 'bg-[#061811]',
    cardBgClass: 'bg-[#0C241B]/80 backdrop-blur-md',
    borderClass: 'border-emerald-900/60',
    textPrimaryClass: 'text-emerald-50',
    textMutedClass: 'text-emerald-300/70',
    accentClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold',
    patternClass: 'bg-pattern-dots',
    previewColor: '#061811'
  },
  {
    id: 'midnight-blue',
    name: {
      ar: 'النيلي الأزرق العميق',
      en: 'Midnight Indigo Blue',
      fr: 'Bleu Nuit Indigo',
      es: 'Azul Noche Índigo'
    },
    mode: 'dark',
    bgClass: 'bg-[#080E1E]',
    cardBgClass: 'bg-[#0E172E]/80 backdrop-blur-md',
    borderClass: 'border-blue-900/60',
    textPrimaryClass: 'text-blue-50',
    textMutedClass: 'text-blue-300/70',
    accentClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    patternClass: 'bg-pattern-grid',
    previewColor: '#080E1E'
  },
  {
    id: 'warm-desert',
    name: {
      ar: 'رمال الصحراء الدافئة',
      en: 'Warm Desert Sand',
      fr: 'Sable Chaud du Désert',
      es: 'Arena Cálida del Desierto'
    },
    mode: 'light',
    bgClass: 'bg-[#F7F4EE]',
    cardBgClass: 'bg-white/90 backdrop-blur-md shadow-sm',
    borderClass: 'border-amber-200/80',
    textPrimaryClass: 'text-[#2D241E]',
    textMutedClass: 'text-[#7D6F63]',
    accentClass: 'bg-[#935626] hover:bg-[#7D4920] text-white',
    patternClass: 'bg-pattern-dots-light',
    previewColor: '#F7F4EE'
  },
  {
    id: 'tech-grid',
    name: {
      ar: 'شبكة تقنية حديثة',
      en: 'Modern Tech Blueprint',
      fr: 'Grille Moderne Tech',
      es: 'Cuadrícula Técnica Moderna'
    },
    mode: 'dark',
    bgClass: 'bg-[#0F172A]',
    cardBgClass: 'bg-[#1E293B]/85 backdrop-blur-md',
    borderClass: 'border-slate-700/60',
    textPrimaryClass: 'text-slate-100',
    textMutedClass: 'text-slate-400',
    accentClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    patternClass: 'bg-pattern-grid',
    previewColor: '#0F172A'
  }
];

export const getThemeById = (id: string): BackgroundTheme => {
  return backgroundThemes.find(t => t.id === id) || backgroundThemes[0];
};
