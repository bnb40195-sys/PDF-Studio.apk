import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Language, 
  BackgroundThemeId, 
  AppSettings, 
  ScannedPage, 
  ToastMessage,
  BackgroundTheme,
  AppTab,
  PdfDocumentState
} from '../types';
import { translations } from '../locales/translations';
import { getThemeById } from '../utils/themes';

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  currentTheme: BackgroundTheme;
  t: typeof translations['ar'];
  scannedPages: ScannedPage[];
  setScannedPages: React.Dispatch<React.SetStateAction<ScannedPage[]>>;
  addScannedPages: (newPages: ScannedPage[]) => void;
  updateScannedPage: (id: string, updates: Partial<ScannedPage>) => void;
  deleteScannedPage: (id: string) => void;
  reorderScannedPage: (fromIndex: number, toIndex: number) => void;
  openedPdf: {
    name: string;
    size: number;
    url: string;
    arrayBuffer?: ArrayBuffer;
  } | null;
  setOpenedPdf: (pdf: { name: string; size: number; url: string; arrayBuffer?: ArrayBuffer } | null) => void;
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  prefilledDocFromAi: PdfDocumentState | null;
  setPrefilledDocFromAi: (doc: PdfDocumentState | null) => void;
  storedDocuments: import('../types').StoredDocument[];
  saveToArchive: (doc: Omit<import('../types').StoredDocument, 'id' | 'timestamp'>) => void;
  deleteFromArchive: (id: string) => void;
  clearArchive: () => void;
}

const defaultSettings: AppSettings = {
  language: 'ar',
  themeId: 'dark-obsidian',
  defaultPageSize: 'a4',
  defaultOrientation: 'portrait',
  pdfQuality: 'high',
  autoEnhanceScans: true,
  includeTimestampWatermark: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('scanner');
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('docuscan_settings');
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    return defaultSettings;
  });

  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [openedPdf, setOpenedPdf] = useState<{
    name: string;
    size: number;
    url: string;
    arrayBuffer?: ArrayBuffer;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [prefilledDocFromAi, setPrefilledDocFromAi] = useState<PdfDocumentState | null>(null);

  // Update HTML dir and lang attributes when language changes
  useEffect(() => {
    const isRtl = settings.language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('docuscan_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist settings', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const showToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addScannedPages = (newPages: ScannedPage[]) => {
    setScannedPages(prev => [...prev, ...newPages]);
  };

  const updateScannedPage = (id: string, updates: Partial<ScannedPage>) => {
    setScannedPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteScannedPage = (id: string) => {
    setScannedPages(prev => prev.filter(p => p.id !== id));
  };

  const reorderScannedPage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setScannedPages(prev => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const [storedDocuments, setStoredDocuments] = useState<import('../types').StoredDocument[]>(() => {
    try {
      const saved = localStorage.getItem('docuscan_archive_docs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed loading archive documents', e);
    }
    return [];
  });

  const saveToArchive = (doc: Omit<import('../types').StoredDocument, 'id' | 'timestamp'>) => {
    const newDoc: import('../types').StoredDocument = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    setStoredDocuments(prev => {
      const next = [newDoc, ...prev.filter(d => d.name !== doc.name)];
      try {
        localStorage.setItem('docuscan_archive_docs', JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage quota exceeded for archive storage, keeping in memory', e);
      }
      return next;
    });
  };

  const deleteFromArchive = (id: string) => {
    setStoredDocuments(prev => {
      const next = prev.filter(d => d.id !== id);
      try {
        localStorage.setItem('docuscan_archive_docs', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const clearArchive = () => {
    setStoredDocuments([]);
    try {
      localStorage.removeItem('docuscan_archive_docs');
    } catch (e) {
      console.error(e);
    }
  };

  const currentTheme = getThemeById(settings.themeId);
  const t = translations[settings.language] || translations['ar'];

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        currentTheme,
        t,
        scannedPages,
        setScannedPages,
        addScannedPages,
        updateScannedPage,
        deleteScannedPage,
        reorderScannedPage,
        openedPdf,
        setOpenedPdf,
        toasts,
        showToast,
        dismissToast,
        prefilledDocFromAi,
        setPrefilledDocFromAi,
        storedDocuments,
        saveToArchive,
        deleteFromArchive,
        clearArchive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
