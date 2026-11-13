export type Language = 'ar' | 'en' | 'fr' | 'es';

export type AppTab = 
  | 'scanner' 
  | 'pdf-studio'
  | 'images-to-pdf' 
  | 'creator' 
  | 'ai-creator'
  | 'viewer' 
  | 'settings' 
  | 'help';

export type StoredDocCategory = 'created' | 'modified' | 'scanned' | 'extracted';

export interface StoredDocument {
  id: string;
  name: string;
  category: StoredDocCategory;
  categoryLabel: string;
  size: number;
  dataUrl: string;
  mimeType: string;
  timestamp: number;
  tags?: string[];
  pageCount?: number;
}

export interface AiDocumentRequest {
  prompt: string;
  templateType?: DocumentTemplateId;
  language?: Language;
  customInstructions?: string;
}

export interface AiDocumentResult {
  title: string;
  subtitle?: string;
  author?: string;
  subject?: string;
  date?: string;
  templateId: DocumentTemplateId;
  content: string;
  items?: Array<{ id?: string; description: string; quantity: number; unitPrice: number }>;
  stamp?: 'APPROVED' | 'CONFIDENTIAL' | 'PAID' | 'OFFICIAL' | 'DRAFT' | 'NONE';
  primaryColor?: string;
  signerName?: string;
  signerTitle?: string;
  watermarkText?: string;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  summary?: string;
}

export type BackgroundThemeId = 
  | 'dark-obsidian'
  | 'paper-white'
  | 'royal-emerald'
  | 'midnight-blue'
  | 'warm-desert'
  | 'tech-grid';

export interface BackgroundTheme {
  id: BackgroundThemeId;
  name: {
    ar: string;
    en: string;
    fr: string;
    es: string;
  };
  mode: 'dark' | 'light';
  bgClass: string;
  cardBgClass: string;
  borderClass: string;
  textPrimaryClass: string;
  textMutedClass: string;
  accentClass: string;
  patternClass: string;
  previewColor: string;
}

export type ScanFilterType = 
  | 'original' 
  | 'magic-color' 
  | 'bw-document' 
  | 'grayscale' 
  | 'brighten' 
  | 'medical-clarity'
  | 'receipt-thermal'
  | 'blueprint';

export type ScanCategory = 
  | 'all'
  | 'document'       // أوراق وملفات عامة
  | 'qr-barcode'     // رموز QR وباركود
  | 'receipt'        // فواتير وإيصالات محاسبية
  | 'id-card'        // بطاقات هوية وجوازات
  | 'medical'        // شهادات وتقارير طبية ووصفات
  | 'math-equation'  // معادلات رياضية ومسائل وحلها
  | 'business-card'  // بطاقات عمل وموظفين
  | 'book-notes'     // كتب ودفاتر وملاحظات يدوية
  | 'certificate'    // شهادات تخرج وشكر
  | 'general-object';// فحص عام وشامل لأي شيء

export interface UniversalScanResult {
  detectedType: 
    | 'invoice_receipt' 
    | 'id_card_passport' 
    | 'medical_prescription' 
    | 'math_equation' 
    | 'business_card' 
    | 'handwritten_notes' 
    | 'qr_barcode' 
    | 'certificate'
    | 'general_object_document';
  typeLabel: string;
  title: string;
  confidence?: string;
  summary: string;
  keyFields: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;
  mathSolution?: {
    equation: string;
    steps: string[];
    finalAnswer: string;
  };
  financials?: {
    vendorName?: string;
    invoiceNumber?: string;
    date?: string;
    subtotal?: string;
    tax?: string;
    totalAmount?: string;
    currency?: string;
    lineItems?: Array<{ description: string; quantity?: number; amount?: string }>;
  };
  medicalData?: {
    patientName?: string;
    doctorName?: string;
    diagnosis?: string;
    medications?: Array<{ name: string; dosage: string; frequency: string; instructions?: string }>;
    recommendations?: string;
  };
  idCardData?: {
    fullName?: string;
    idNumber?: string;
    birthDate?: string;
    expiryDate?: string;
    nationality?: string;
  };
  contactData?: {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  actionItems: string[];
  extractedText: string;
  translatedText?: string;
}

export interface QrScanResult {
  data: string;
  type: 'url' | 'text' | 'wifi' | 'email' | 'phone';
  timestamp: number;
  imageThumbnail?: string;
}

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  enhancedDataUrl: string;
  filter: ScanFilterType;
  category: ScanCategory;
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
  extractedText?: string;
  qrResult?: QrScanResult;
  universalResult?: UniversalScanResult;
  medicalInfo?: {
    patientName?: string;
    doctorName?: string;
    diagnosis?: string;
    date?: string;
    notes?: string;
  };
  createdAt: number;
  title: string;
}

export type DocumentTemplateId = 
  | 'custom'
  | 'invoice' 
  | 'report' 
  | 'official-letter' 
  | 'certificate' 
  | 'resume' 
  | 'contract';

export interface TemplateField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'textarea' | 'date' | 'number';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PdfDocumentState {
  title: string;
  subtitle: string;
  author: string;
  subject: string;
  date: string;
  templateId: DocumentTemplateId;
  content: string;
  items?: InvoiceItem[];
  watermarkText?: string;
  stamp?: 'APPROVED' | 'CONFIDENTIAL' | 'PAID' | 'OFFICIAL' | 'DRAFT' | 'NONE';
  signatureDataUrl?: string;
  signerName?: string;
  signerTitle?: string;
  headerLogoUrl?: string;
  primaryColor: string;
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
}

export interface AppSettings {
  language: Language;
  themeId: BackgroundThemeId;
  defaultPageSize: 'a4' | 'letter' | 'legal';
  defaultOrientation: 'portrait' | 'landscape';
  pdfQuality: 'high' | 'medium' | 'compact';
  autoEnhanceScans: boolean;
  includeTimestampWatermark: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}
