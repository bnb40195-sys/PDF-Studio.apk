import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FolderOpen, 
  FileText, 
  QrCode, 
  HardDrive, 
  Search, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Sparkles,
  Smartphone,
  FolderTree
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { scanQrFromImage, readFileAsDataUrl } from '../../utils/imageProcessing';
import { QrScanResult } from '../../types';

interface ExternalPathPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'pdf' | 'qr';
  onPdfSelected?: (file: File, path: string) => void;
  onQrSelected?: (qrResult: QrScanResult, file: File, path: string) => void;
}

interface PathHistoryItem {
  id: string;
  type: 'pdf' | 'qr';
  name: string;
  path: string;
  size: number;
  timestamp: number;
}

export const ExternalPathPickerModal: React.FC<ExternalPathPickerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'pdf',
  onPdfSelected,
  onQrSelected,
}) => {
  const { currentTheme, showToast, setOpenedPdf, setActiveTab } = useApp();

  const [activeTab, setActiveTabLocal] = useState<'pdf' | 'qr'>(defaultTab);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customPathInput, setCustomPathInput] = useState<string>('');
  const [detectedPath, setDetectedPath] = useState<string>('');
  const [qrDecoded, setQrDecoded] = useState<QrScanResult | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [history, setHistory] = useState<PathHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('docuscan_external_paths_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'sample-1',
        type: 'pdf',
        name: 'Report_Final_2026.pdf',
        path: '/storage/emulated/0/Download/Report_Final_2026.pdf',
        size: 1420500,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'sample-2',
        type: 'qr',
        name: 'wifi_office_qr.png',
        path: '/storage/emulated/0/DCIM/Camera/wifi_office_qr.png',
        size: 284000,
        timestamp: Date.now() - 7200000,
      }
    ];
  });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTabLocal(defaultTab);
  }, [defaultTab, isOpen]);

  // Save history to localStorage
  const saveToHistory = (item: Omit<PathHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: PathHistoryItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history.filter(h => h.path !== item.path)].slice(0, 10);
    setHistory(updated);
    try {
      localStorage.setItem('docuscan_external_paths_history', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Handle PDF file selection from phone storage
  const handlePdfPicked = async (file: File, folderPrefix = '/storage/emulated/0/Download/') => {
    if (!file) return;
    const computedPath = customPathInput.trim() || `${folderPrefix}${file.name}`;
    setSelectedFile(file);
    setDetectedPath(computedPath);

    saveToHistory({
      type: 'pdf',
      name: file.name,
      path: computedPath,
      size: file.size,
    });
  };

  // Handle QR image selection from phone storage
  const handleQrPicked = async (file: File, folderPrefix = '/storage/emulated/0/DCIM/Camera/') => {
    if (!file) return;
    const computedPath = customPathInput.trim() || `${folderPrefix}${file.name}`;
    setSelectedFile(file);
    setDetectedPath(computedPath);
    setIsDecoding(true);
    setQrDecoded(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setQrPreviewUrl(dataUrl);
      const decoded = await scanQrFromImage(dataUrl);
      if (decoded) {
        setQrDecoded(decoded);
        showToast('تم فك تشفير وقراءة رمز الـ QR بنجاح ⚡', 'success');
      } else {
        showToast('لم يتم العثور على رمز QR واضح في هذه الصورة، يمكنك فتحها في الماسح لتنقيتها', 'warning');
      }

      saveToHistory({
        type: 'qr',
        name: file.name,
        path: computedPath,
        size: file.size,
      });
    } catch (err) {
      console.error(err);
      showToast('تعذر قراءة الصورة المحددة', 'error');
    } finally {
      setIsDecoding(false);
    }
  };

  // Confirm and open PDF
  const handleConfirmPdf = async () => {
    if (!selectedFile) {
      showToast('يرجى اختيار ملف PDF أولاً من الهاتف', 'warning');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOpenedPdf({
        name: selectedFile.name,
        size: selectedFile.size,
        url,
        arrayBuffer,
      });

      if (onPdfSelected) {
        onPdfSelected(selectedFile, detectedPath);
      }

      setActiveTab('pdf-studio');
      showToast(`تم فتح الملف من المسار: ${detectedPath}`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء فتح الملف', 'error');
    }
  };

  // Confirm and handle QR
  const handleConfirmQr = () => {
    if (!selectedFile) {
      showToast('يرجى اختيار صورة رمز QR أولاً من الهاتف', 'warning');
      return;
    }

    if (onQrSelected && qrDecoded) {
      onQrSelected(qrDecoded, selectedFile, detectedPath);
    }

    showToast(`تم اعتماد مسار رمز الـ QR: ${detectedPath}`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-2xl border ${currentTheme.borderClass} ${currentTheme.cardBgClass} bg-slate-950 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>إختيار مسارات الملفات من مصدر خارجي من الهاتف</span>
              </h2>
              <p className="text-xs text-slate-400">
                استعراض وتحديد مسارات ملفات PDF وصور رموز QR من ذاكرة الهاتف أو وحدات التخزين الخارجية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: PDF vs QR */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <button
            onClick={() => {
              setActiveTabLocal('pdf');
              setSelectedFile(null);
              setDetectedPath('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pdf'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مسارات ملفات PDF</span>
          </button>

          <button
            onClick={() => {
              setActiveTabLocal('qr');
              setSelectedFile(null);
              setDetectedPath('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'qr'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>مسارات رموز الـ QR والباركود</span>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={pdfInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handlePdfPicked(e.target.files[0]);
          }}
        />
        <input
          type="file"
          ref={qrInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleQrPicked(e.target.files[0]);
          }}
        />

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Quick Phone Storage Paths Shortcuts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
              <span>المسارات الشائعة في ذاكرة الهاتف:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: '📁 التنزيلات (Download)', path: '/storage/emulated/0/Download/' },
                { label: '📄 المستندات (Documents)', path: '/storage/emulated/0/Documents/' },
                { label: '📷 الكاميرا (DCIM)', path: '/storage/emulated/0/DCIM/Camera/' },
                { label: '💬 وسائط واتساب', path: '/storage/emulated/0/Android/media/com.whatsapp/' },
              ].map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCustomPathInput(loc.path);
                    if (activeTab === 'pdf') {
                      pdfInputRef.current?.click();
                    } else {
                      qrInputRef.current?.click();
                    }
                  }}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-right text-[11px] text-slate-300 transition-colors flex flex-col justify-between"
                >
                  <span className="font-semibold text-emerald-400 truncate">{loc.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{loc.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: Browse Phone Storage */}
          <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                  {activeTab === 'pdf' ? 'اختيار ملف PDF من ذاكرة الهاتف' : 'اختيار صورة رمز QR من ذاكرة الهاتف'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  فتح مستكشف ملفات الهاتف وتحديد مسار الملف مباشرة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeTab === 'pdf') {
                  pdfInputRef.current?.click();
                } else {
                  qrInputRef.current?.click();
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95"
            >
              <FolderOpen className="w-4 h-4" />
              <span>استعراض ملفات الهاتف</span>
            </button>
          </div>

          {/* Manual Path Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium block">
              أو كتابة / تعديل مسار الملف في الهاتف يدوياً:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  activeTab === 'pdf' 
                    ? '/storage/emulated/0/Download/document.pdf' 
                    : '/storage/emulated/0/DCIM/Camera/qr_code.png'
                }
                value={customPathInput}
                onChange={(e) => setCustomPathInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'pdf') pdfInputRef.current?.click();
                  else qrInputRef.current?.click();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
              >
                تصفح
              </button>
            </div>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>تم التقاط مسار الملف بنجاح</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-slate-200 font-semibold truncate">{selectedFile.name}</p>
                <p className="text-slate-400 font-mono text-[11px] break-all bg-black/40 p-2 rounded-lg border border-slate-800">
                  {detectedPath}
                </p>
              </div>

              {/* QR Preview & Decoded info if QR */}
              {activeTab === 'qr' && qrDecoded && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    {qrPreviewUrl && (
                      <img 
                        src={qrPreviewUrl} 
                        alt="QR preview" 
                        className="w-12 h-12 rounded-lg object-contain bg-white p-1 border border-slate-700"
                      />
                    )}
                    <div className="text-xs min-w-0 flex-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        النوع: {qrDecoded.type}
                      </span>
                      <p className="text-slate-100 font-mono text-xs truncate mt-1">
                        {qrDecoded.data}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Paths History */}
          {history.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>سجل المسارات المختارة مؤخراً:</span>
              </span>

              <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {item.type === 'pdf' ? (
                        <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                      <span className="text-slate-200 font-medium truncate max-w-[180px] sm:max-w-xs">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline truncate max-w-[200px]">{item.path}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomPathInput(item.path);
                        showToast(`تم تعيين المسار: ${item.path}`, 'info');
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium shrink-0"
                    >
                      استخدام
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            إلغاء
          </button>

          {activeTab === 'pdf' ? (
            <button
              type="button"
              onClick={handleConfirmPdf}
              disabled={!selectedFile}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 flex items-center gap-2 transition-all active:scale-95 ${
                !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>فتح مسار ملف الـ PDF</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmQr}
              disabled={!selectedFile}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950 flex items-center gap-2 transition-all active:scale-95 ${
                !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>اعتماد مسار رمز الـ QR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
