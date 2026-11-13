import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { 
  PlusCircle, 
  Share2, 
  Download, 
  Copy, 
  ExternalLink, 
  Check, 
  Wifi, 
  Mail, 
  Phone, 
  MessageSquare, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  Globe, 
  Sparkles, 
  Barcode as BarcodeIcon, 
  QrCode as QrCodeIcon,
  Layers,
  ArrowRight,
  Clipboard,
  Smartphone,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  RefreshCw,
  Send,
  Save
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExternalPathPickerModal } from '../common/ExternalPathPickerModal';

export type GeneratorTab = 'basic' | 'social' | 'barcode';

export type BasicCodeType = 
  | 'clipboard'
  | 'url' 
  | 'wifi' 
  | 'text' 
  | 'contact' 
  | 'email' 
  | 'sms' 
  | 'geo' 
  | 'phone' 
  | 'calendar' 
  | 'my_info';

export type SocialCodeType = 
  | 'facebook' 
  | 'youtube' 
  | 'whatsapp' 
  | 'instagram' 
  | 'twitter' 
  | 'threads';

export type BarcodeFormatType = 
  | 'EAN8'
  | 'EAN13'
  | 'UPCE'
  | 'UPCA'
  | 'CODE39'
  | 'CODE93'
  | 'CODE128'
  | 'ITF'
  | 'codabar';

export const QrBarcodeStudio: React.FC = () => {
  const { currentTheme, showToast, saveToArchive } = useApp();

  const [activeTab, setActiveTab] = useState<GeneratorTab>('basic');
  const [selectedBasic, setSelectedBasic] = useState<BasicCodeType | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<SocialCodeType | null>(null);
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeFormatType | null>(null);
  const [showExternalPathModal, setShowExternalPathModal] = useState(false);

  // Social form sub-mode: link (رابط) vs username (اسم المستخدم) or ID
  const [socialSubMode, setSocialSubMode] = useState<'link' | 'username'>('username');

  // Basic Form States
  const [formText, setFormText] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPhoneCountryCode, setFormPhoneCountryCode] = useState('+966');
  const [formEmail, setFormEmail] = useState('');
  const [formEmailSubject, setFormEmailSubject] = useState('');
  const [formEmailBody, setFormEmailBody] = useState('');
  const [formSmsNumber, setFormSmsNumber] = useState('');
  const [formSmsMessage, setFormSmsMessage] = useState('');
  const [formWifiSsid, setFormWifiSsid] = useState('');
  const [formWifiPassword, setFormWifiPassword] = useState('');
  const [formWifiType, setFormWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [formContactName, setFormContactName] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactOrg, setFormContactOrg] = useState('');
  const [formGeoLat, setFormGeoLat] = useState('24.7136');
  const [formGeoLng, setFormGeoLng] = useState('46.6753');
  const [formEventTitle, setFormEventTitle] = useState('');
  const [formEventDate, setFormEventDate] = useState(new Date().toISOString().split('T')[0]);

  // Social Inputs
  const [socialValue, setSocialValue] = useState('');
  const [socialCountryCode, setSocialCountryCode] = useState('+1');

  // Barcode Value
  const [barcodeValue, setBarcodeValue] = useState('123456789012');

  // Generated Result
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [generatedPayload, setGeneratedPayload] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormText(text);
      setSelectedBasic('clipboard');
      showToast('تم لصق المحتوى من الحافظة', 'success');
    } catch (e) {
      showToast('يرجى كتابة أو لصق النص يدوياً', 'info');
      setSelectedBasic('clipboard');
    }
  };

  // Generate QR Code or Barcode based on current state
  const handleGenerate = async () => {
    let payload = '';

    if (activeTab === 'basic') {
      if (!selectedBasic) return;
      switch (selectedBasic) {
        case 'clipboard':
        case 'text':
          payload = formText.trim() || 'DocuScan QR';
          break;
        case 'url':
          payload = formUrl.trim().startsWith('http') ? formUrl.trim() : `https://${formUrl.trim()}`;
          break;
        case 'phone':
          payload = `tel:${formPhone.trim()}`;
          break;
        case 'email':
          payload = `mailto:${formEmail.trim()}?subject=${encodeURIComponent(formEmailSubject)}&body=${encodeURIComponent(formEmailBody)}`;
          break;
        case 'sms':
          payload = `SMSTO:${formSmsNumber.trim()}:${formSmsMessage}`;
          break;
        case 'wifi':
          payload = `WIFI:T:${formWifiType};S:${formWifiSsid};P:${formWifiPassword};;`;
          break;
        case 'contact':
        case 'my_info':
          payload = `BEGIN:VCARD\nVERSION:3.0\nFN:${formContactName}\nORG:${formContactOrg}\nTEL:${formContactPhone}\nEMAIL:${formContactEmail}\nEND:VCARD`;
          break;
        case 'geo':
          payload = `geo:${formGeoLat},${formGeoLng}`;
          break;
        case 'calendar':
          payload = `BEGIN:VEVENT\nSUMMARY:${formEventTitle}\nDTSTART:${formEventDate.replace(/-/g, '')}\nEND:VEVENT`;
          break;
      }
    } else if (activeTab === 'social') {
      if (!selectedSocial) return;
      const cleanVal = socialValue.trim();
      switch (selectedSocial) {
        case 'whatsapp':
          // WhatsApp supports direct phone chat or link
          const cleanPhone = cleanVal.replace(/[^0-9]/g, '');
          payload = socialSubMode === 'username'
            ? `https://wa.me/${(socialCountryCode + cleanPhone).replace(/[^0-9]/g, '')}`
            : (cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`);
          break;
        case 'facebook':
          payload = socialSubMode === 'username'
            ? `https://facebook.com/${cleanVal}`
            : (cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`);
          break;
        case 'instagram':
          payload = socialSubMode === 'username'
            ? `https://instagram.com/${cleanVal.replace(/^@/, '')}`
            : (cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`);
          break;
        case 'twitter':
          payload = socialSubMode === 'username'
            ? `https://twitter.com/${cleanVal.replace(/^@/, '')}`
            : (cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`);
          break;
        case 'youtube':
          payload = socialSubMode === 'username'
            ? `https://youtube.com/@${cleanVal.replace(/^@/, '')}`
            : (cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`);
          break;
        case 'threads':
          payload = socialSubMode === 'username'
            ? `https://threads.net/@${cleanVal.replace(/^@/, '')}`
            : (cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`);
          break;
      }
    } else if (activeTab === 'barcode') {
      if (!selectedBarcode) return;
      payload = barcodeValue.trim();
    }

    if (!payload) {
      showToast('يرجى ملء البيانات المطلوبة لإنشاء الرمز', 'warning');
      return;
    }

    setGeneratedPayload(payload);

    try {
      if (activeTab === 'barcode' && selectedBarcode) {
        // Generate linear 1D barcode using JsBarcode
        const canvas = document.createElement('canvas');
        let jsBarcodeFormat: string = selectedBarcode;
        if (selectedBarcode === 'UPCA') jsBarcodeFormat = 'UPC';
        if (selectedBarcode === 'UPCE') jsBarcodeFormat = 'UPC';
        if (selectedBarcode === 'codabar') jsBarcodeFormat = 'codabar';

        try {
          JsBarcode(canvas, payload, {
            format: jsBarcodeFormat,
            lineColor: '#000000',
            width: 2.5,
            height: 100,
            displayValue: true,
            fontSize: 16,
            background: '#ffffff',
            margin: 16,
          });
          const dataUrl = canvas.toDataURL('image/png');
          setGeneratedDataUrl(dataUrl);
          showToast('تم إنشاء الباركود بنجاح ⚡ (بدون إنترنت)', 'success');
        } catch (barcodeErr: any) {
          // If format digits don't match, fallback to standard CODE128
          JsBarcode(canvas, payload, {
            format: 'CODE128',
            lineColor: '#000000',
            width: 2.5,
            height: 100,
            displayValue: true,
            fontSize: 16,
            background: '#ffffff',
            margin: 16,
          });
          const dataUrl = canvas.toDataURL('image/png');
          setGeneratedDataUrl(dataUrl);
          showToast('تم إنشاء الباركود بصيغة CODE128 الموثوقة ⚡', 'success');
        }
      } else {
        // Generate 2D QR Code locally via qrcode library
        const dataUrl = await QRCode.toDataURL(payload, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        setGeneratedDataUrl(dataUrl);
        showToast('تم إنشاء رمز الاستجابة السريعة (QR Code) بنجاح ⚡ (بدون إنترنت)', 'success');
      }
    } catch (err) {
      console.error('Code generation failed', err);
      showToast('حدث خطأ أثناء إنشاء الرمز', 'error');
    }
  };

  const handleDownload = () => {
    if (!generatedDataUrl) return;
    const a = document.createElement('a');
    a.href = generatedDataUrl;
    a.download = `DocuScan_${activeTab}_code_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('جاري تحميل الرمز كصورة PNG عالية الدقة', 'success');
  };

  const handleSaveToArchive = () => {
    if (!generatedDataUrl) return;
    saveToArchive({
      name: `رمز_${activeTab === 'barcode' ? selectedBarcode : 'QR'}_${Date.now()}.png`,
      category: 'created',
      categoryLabel: activeTab === 'barcode' ? 'باركود تجاري' : 'رمز QR',
      size: Math.round(generatedDataUrl.length * 0.75),
      dataUrl: generatedDataUrl,
      mimeType: 'image/png',
      tags: ['رمز_سريع', activeTab, 'بدون_نت'],
    });
    showToast('تم حفظ الرمز في مسار الأرشيف المحلي بنجاح 💾', 'success');
  };

  const resetSelection = () => {
    setSelectedBasic(null);
    setSelectedSocial(null);
    setSelectedBarcode(null);
    setGeneratedDataUrl(null);
    setGeneratedPayload('');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & External QR Path Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => {
              setActiveTab('basic');
              resetSelection();
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all ${
              activeTab === 'basic'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            أساسي
          </button>

          <button
            onClick={() => {
              setActiveTab('social');
              resetSelection();
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all ${
              activeTab === 'social'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            اجتماعي
          </button>

          <button
            onClick={() => {
              setActiveTab('barcode');
              resetSelection();
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center transition-all ${
              activeTab === 'barcode'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            باركود
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowExternalPathModal(true)}
          className="px-3.5 py-3 text-xs font-bold rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>إختيار مسارات رموز QR من الهاتف</span>
        </button>
      </div>

      {/* SECTION 1: BASIC (محتوى من الحافظة، رابط، واي فاي، نص، جهة الاتصال، البريد، رسالة نصية، موقع جغرافي، الهاتف، تقويم، معلوماتي) */}
      {activeTab === 'basic' && !selectedBasic && (
        <div className="space-y-2.5">
          {[
            { id: 'clipboard', label: 'محتوى من الحافظة', icon: Clipboard, action: handlePasteClipboard },
            { id: 'url', label: 'رابط', icon: Globe },
            { id: 'wifi', label: 'واي فاي', icon: Wifi },
            { id: 'text', label: 'نص', icon: FileText },
            { id: 'contact', label: 'جهة الاتصال', icon: User },
            { id: 'email', label: 'البريد الإلكتروني', icon: Mail },
            { id: 'sms', label: 'رسالة نصية', icon: MessageSquare },
            { id: 'geo', label: 'موقع جغرافي', icon: MapPin },
            { id: 'phone', label: 'الهاتف', icon: Phone },
            { id: 'calendar', label: 'تقويم', icon: Calendar },
            { id: 'my_info', label: 'معلوماتي', icon: Smartphone },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setSelectedBasic(item.id as BasicCodeType);
                    setGeneratedDataUrl(null);
                  }
                }}
                className="w-full p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700 flex items-center justify-between transition-all group shadow-sm text-right"
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-100 flex-1 mr-4">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* BASIC FORM EDITOR */}
      {activeTab === 'basic' && selectedBasic && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              onClick={() => setSelectedBasic(null)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>← رجوع للقائمة</span>
            </button>
            <h3 className="font-bold text-sm sm:text-base text-white">
              {selectedBasic === 'clipboard' && 'إنشاء رمز من الحافظة'}
              {selectedBasic === 'url' && 'إنشاء رمز QR لرابط (URL)'}
              {selectedBasic === 'wifi' && 'إنشاء رمز QR للاتصال بشبكة واي فاي'}
              {selectedBasic === 'text' && 'إنشاء رمز QR لنص أو ملاحظة'}
              {selectedBasic === 'contact' && 'إنشاء رمز QR لبطاقة جهة اتصال'}
              {selectedBasic === 'email' && 'إنشاء رمز QR لإرسال بريد إلكتروني'}
              {selectedBasic === 'sms' && 'إنشاء رمز QR لرسالة نصية SMS'}
              {selectedBasic === 'geo' && 'إنشاء رمز QR لإحداثيات الموقع'}
              {selectedBasic === 'phone' && 'إنشاء رمز QR لرقم الهاتف'}
              {selectedBasic === 'calendar' && 'إنشاء رمز QR لحدث وموعد'}
              {selectedBasic === 'my_info' && 'إنشاء رمز QR لبطاقة معلوماتي الشخصية'}
            </h3>
          </div>

          {/* Form fields depending on type */}
          {(selectedBasic === 'clipboard' || selectedBasic === 'text') && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block font-medium">النص أو المحتوى:</label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="اكتب أو الصق النص هنا..."
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {selectedBasic === 'url' && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block font-medium">رابط الموقع (URL):</label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-left font-mono"
                dir="ltr"
              />
            </div>
          )}

          {selectedBasic === 'wifi' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">اسم الشبكة (SSID):</label>
                <input
                  type="text"
                  value={formWifiSsid}
                  onChange={(e) => setFormWifiSsid(e.target.value)}
                  placeholder="MyHomeWifi"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">كلمة المرور:</label>
                <input
                  type="text"
                  value={formWifiPassword}
                  onChange={(e) => setFormWifiPassword(e.target.value)}
                  placeholder="Password123"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                {(['WPA', 'WEP', 'nopass'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormWifiType(t)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold ${
                      formWifiType === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t === 'nopass' ? 'بدون كلمة سر' : t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selectedBasic === 'contact' || selectedBasic === 'my_info') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">الجهة أو الشركة:</label>
                <input
                  type="text"
                  value={formContactOrg}
                  onChange={(e) => setFormContactOrg(e.target.value)}
                  placeholder="مؤسسة النور"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                  placeholder="+966500000000"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {selectedBasic === 'phone' && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 block font-medium">رقم الهاتف:</label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm font-mono"
                dir="ltr"
              />
            </div>
          )}

          {selectedBasic === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="target@company.com"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">موضوع الرسالة:</label>
                <input
                  type="text"
                  value={formEmailSubject}
                  onChange={(e) => setFormEmailSubject(e.target.value)}
                  placeholder="طلب استشارة أو دعم"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">نص الرسالة:</label>
                <textarea
                  value={formEmailBody}
                  onChange={(e) => setFormEmailBody(e.target.value)}
                  placeholder="السلام عليكم ورحمة الله..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>إنشاء الرمز فوراً (بدون إنترنت ⚡)</span>
          </button>
        </div>
      )}

      {/* SECTION 2: SOCIAL (Facebook, YouTube, WhatsApp, Instagram, Twitter, Threads) */}
      {activeTab === 'social' && !selectedSocial && (
        <div className="space-y-2.5">
          {[
            { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
            { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500' },
            { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
            { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-400' },
            { id: 'threads', label: 'مواضيع (Threads)', icon: Globe, color: 'text-slate-100' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedSocial(item.id as SocialCodeType);
                  setSocialValue('');
                  setGeneratedDataUrl(null);
                }}
                className="w-full p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700 flex items-center justify-between transition-all group shadow-sm text-right"
              >
                <div className={`p-2 rounded-xl bg-slate-800 ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-100 flex-1 mr-4">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* SOCIAL FORM EDITOR (Matching screenshot 1, 2, 3, 4, 5, 6 UI exactly) */}
      {activeTab === 'social' && selectedSocial && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
          {/* Top Bar with "إنشاء" on top-left and Platform Name & Icon on top-right */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              onClick={handleGenerate}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              إنشاء
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white capitalize">
                {selectedSocial === 'threads' ? 'مواضيع' : selectedSocial}
              </span>
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                {selectedSocial === 'facebook' && <Facebook className="w-4 h-4 text-blue-500" />}
                {selectedSocial === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                {selectedSocial === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-500" />}
                {selectedSocial === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                {selectedSocial === 'twitter' && <Twitter className="w-4 h-4 text-sky-400" />}
                {selectedSocial === 'threads' && <Globe className="w-4 h-4 text-slate-100" />}
              </div>
            </div>
          </div>

          {/* Toggle pill buttons (رابط / اسم المستخدم / معرف / فتح) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSocialSubMode('username')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                socialSubMode === 'username'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {selectedSocial === 'facebook' && 'Facebook ID'}
              {selectedSocial === 'whatsapp' && 'رقم الهاتف'}
              {selectedSocial === 'youtube' && 'معرّف القناة'}
              {selectedSocial === 'instagram' && 'اسم المستخدم'}
              {selectedSocial === 'twitter' && 'اسم المستخدم'}
              {selectedSocial === 'threads' && 'اسم المستخدم'}
            </button>

            <button
              type="button"
              onClick={() => setSocialSubMode('link')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                socialSubMode === 'link'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              رابط
            </button>
          </div>

          {/* Input Field matching dark modern card in screenshot */}
          <div className="space-y-2">
            {selectedSocial === 'whatsapp' && socialSubMode === 'username' ? (
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={socialValue}
                  onChange={(e) => setSocialValue(e.target.value)}
                  placeholder="رقم الهاتف"
                  className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-mono"
                  dir="ltr"
                />
                <input
                  type="text"
                  value={socialCountryCode}
                  onChange={(e) => setSocialCountryCode(e.target.value)}
                  placeholder="+1"
                  className="w-20 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm text-center font-mono"
                  dir="ltr"
                />
              </div>
            ) : (
              <input
                type={socialSubMode === 'link' ? 'url' : 'text'}
                value={socialValue}
                onChange={(e) => setSocialValue(e.target.value)}
                placeholder={
                  socialSubMode === 'link' 
                    ? 'رابط' 
                    : selectedSocial === 'facebook' 
                    ? 'Facebook ID' 
                    : 'اسم المستخدم'
                }
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                dir={socialSubMode === 'link' ? 'ltr' : 'auto'}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={() => setSelectedSocial(null)}
              className="text-slate-400 hover:text-white"
            >
              ← اختيار منصة أخرى
            </button>
            <span className="text-[11px] text-emerald-400 font-mono">
              توليد محلي 100% بدون إنترنت
            </span>
          </div>
        </div>
      )}

      {/* SECTION 3: BARCODE (EAN_8, EAN_13, UPC_E, UPC_A, CODE_39, CODE_93, CODE_128, ITF, PDF_417, CODABAR, DATA_MATRIX, AZTEC) */}
      {activeTab === 'barcode' && !selectedBarcode && (
        <div className="space-y-2.5">
          {[
            { id: 'EAN_8', label: 'EAN_8', hint: '8 أرقام للمنتجات الصغيرة' },
            { id: 'EAN_13', label: 'EAN_13', hint: '13 رقم للمنتجات العالمية' },
            { id: 'UPC_E', label: 'UPC_E', hint: 'باركود المنتجات الأمريكي المصغر' },
            { id: 'UPC_A', label: 'UPC_A', hint: 'باركود المنتجات الأمريكي القياسي' },
            { id: 'CODE_39', label: 'CODE_39', hint: 'يدعم الحروف والأرقام' },
            { id: 'CODE_93', label: 'CODE_93', hint: 'باركود عالي الكثافة' },
            { id: 'CODE_128', label: 'CODE_128', hint: 'شامل لكافة المحارف والأرقام' },
            { id: 'ITF', label: 'ITF', hint: 'باركود الشحن والطرود' },
            { id: 'CODABAR', label: 'CODABAR', hint: 'المكتبات وبنوك الدم' },
          ].map((bar) => (
            <button
              key={bar.id}
              onClick={() => {
                setSelectedBarcode(bar.id as BarcodeFormatType);
                if (bar.id === 'EAN_8') setBarcodeValue('12345670');
                else if (bar.id === 'EAN_13') setBarcodeValue('978020137962');
                else if (bar.id === 'UPC_A') setBarcodeValue('12345678901');
                else setBarcodeValue('DOCUSCAN2026');
                setGeneratedDataUrl(null);
              }}
              className="w-full p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700 flex items-center justify-between transition-all group shadow-sm"
            >
              {/* Graphic barcode stripes icon on right */}
              <div className="flex items-center gap-0.5 text-blue-400">
                <div className="w-1 h-6 bg-blue-500 rounded-xs" />
                <div className="w-0.5 h-6 bg-blue-500/70 rounded-xs" />
                <div className="w-1.5 h-6 bg-blue-500 rounded-xs" />
                <div className="w-0.5 h-6 bg-blue-500/70 rounded-xs" />
                <div className="w-1 h-6 bg-blue-500 rounded-xs" />
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-100 font-mono block">
                  {bar.label}
                </span>
                <span className="text-[11px] text-slate-500">
                  {bar.hint}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* BARCODE FORM EDITOR */}
      {activeTab === 'barcode' && selectedBarcode && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              onClick={() => setSelectedBarcode(null)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>← رجوع لقائمة الباركود</span>
            </button>
            <h3 className="font-bold text-sm text-white font-mono">
              توليد باركود: {selectedBarcode}
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-medium">قيمة أو رقم الباركود:</label>
            <input
              type="text"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder="123456789012"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>رسم وتوليد الباركود فوراً (محلي 100%)</span>
          </button>
        </div>
      )}

      {/* GENERATED RESULT PREVIEW PANEL */}
      {generatedDataUrl && (
        <div className="p-6 rounded-2xl bg-slate-950 border-2 border-blue-500/40 text-center space-y-4 shadow-2xl animate-in fade-in duration-300">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
            <img
              src={generatedDataUrl}
              alt="Generated Code"
              className="max-h-64 max-w-full object-contain mx-auto"
            />
          </div>

          <div className="max-w-md mx-auto space-y-1 text-xs">
            <span className="text-slate-400 block font-medium">البيانات المشفرة بالرمز:</span>
            <p className="text-blue-300 font-mono break-all p-2 bg-slate-900 rounded-lg border border-slate-800 select-all">
              {generatedPayload}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تصدير كصورة PNG</span>
            </button>

            <button
              onClick={() => {
                if (!generatedDataUrl) return;
                const a = document.createElement('a');
                a.href = generatedDataUrl;
                a.download = `DocuScan_${activeTab}_code_${Date.now()}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast('تم تصدير الرمز كصورة JPG 📥', 'success');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تصدير كصورة JPG</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedPayload);
                setIsCopied(true);
                showToast('تم نسخ النص المشفر في الحافظة', 'success');
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>نسخ النص</span>
            </button>
          </div>
        </div>
      )}

      {/* External Phone Path Selector Modal */}
      <ExternalPathPickerModal
        isOpen={showExternalPathModal}
        onClose={() => setShowExternalPathModal(false)}
        defaultTab="qr"
        onQrSelected={(qr, _file, path) => {
          showToast(`تم استيراد الرمز من المسار: ${path}`, 'success');
          if (qr.data) {
            setFormText(qr.data);
            setFormUrl(qr.data);
            setActiveTab('basic');
            setSelectedBasic('text');
          }
        }}
      />
    </div>
  );
};
