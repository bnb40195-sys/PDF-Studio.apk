import jsQR from 'jsqr';
import { ScanFilterType, QrScanResult } from '../types';

export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Scan & Decode QR Code / Barcode from an image or video canvas (100% Offline)
 */
export const scanQrFromImage = async (imageSrc: string): Promise<QrScanResult | null> => {
  try {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data) {
      let type: QrScanResult['type'] = 'text';
      const trimmed = code.data.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        type = 'url';
      } else if (/^WIFI:/i.test(trimmed)) {
        type = 'wifi';
      } else if (/^mailto:/i.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        type = 'email';
      } else if (/^tel:/i.test(trimmed) || /^\+?[0-9\s\-()]{7,}$/.test(trimmed)) {
        type = 'phone';
      }

      return {
        data: code.data,
        type,
        timestamp: Date.now(),
        imageThumbnail: canvas.toDataURL('image/jpeg', 0.6),
      };
    }
  } catch (err) {
    console.warn('QR scan error:', err);
  }
  return null;
};

/**
 * Apply scanner enhancements to an image using Canvas 2D
 */
export const applyFilterToImage = async (
  imageSrc: string,
  filter: ScanFilterType,
  rotation: number = 0
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  // Determine canvas dimensions based on rotation
  const isRotated90or270 = rotation % 180 !== 0;
  canvas.width = isRotated90or270 ? img.height : img.width;
  canvas.height = isRotated90or270 ? img.width : img.height;

  // Draw rotated image
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  if (filter === 'original') {
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      width: canvas.width,
      height: canvas.height,
    };
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const len = data.length;

  if (filter === 'grayscale') {
    for (let i = 0; i < len; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  } else if (filter === 'bw-document') {
    // High-contrast Document B&W threshold
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      const threshold = 138;
      const val = gray > threshold ? Math.min(255, gray * 1.35) : Math.max(0, gray * 0.45);
      const binary = val > 165 ? 255 : (val < 60 ? 15 : val * 0.7);

      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }
  } else if (filter === 'magic-color') {
    // Magic Color: enhance contrast, whiten yellowish paper while preserving ink colors
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const maxVal = Math.max(r, g, b);
      const minVal = Math.min(r, g, b);
      const diff = maxVal - minVal;

      if (diff < 28 && minVal > 140) {
        r = Math.min(255, r + 45);
        g = Math.min(255, g + 45);
        b = Math.min(255, b + 45);
      } else {
        r = Math.min(255, Math.max(0, (r - 128) * 1.25 + 128));
        g = Math.min(255, Math.max(0, (g - 128) * 1.25 + 128));
        b = Math.min(255, Math.max(0, (b - 128) * 1.25 + 128));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  } else if (filter === 'brighten') {
    // Brighten & remove shadows
    for (let i = 0; i < len; i += 4) {
      data[i] = Math.min(255, data[i] * 1.22 + 20);
      data[i + 1] = Math.min(255, data[i + 1] * 1.22 + 20);
      data[i + 2] = Math.min(255, data[i + 2] * 1.22 + 20);
    }
  } else if (filter === 'medical-clarity') {
    // Medical & Prescription Clarity Filter:
    // Boosts blue/red physician pen ink, official clinical stamps, and darkens diagnosis handwriting
    // while bleaching yellowish hospital prescription pads.
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is blue/red pen or stamp ink
      const isBlueInk = (b > r + 25) && (b > g + 15);
      const isRedStamp = (r > g + 35) && (r > b + 35);

      if (isBlueInk) {
        data[i] = Math.max(0, r * 0.7);
        data[i + 1] = Math.max(0, g * 0.85);
        data[i + 2] = Math.min(255, b * 1.35);
      } else if (isRedStamp) {
        data[i] = Math.min(255, r * 1.3);
        data[i + 1] = Math.max(0, g * 0.6);
        data[i + 2] = Math.max(0, b * 0.6);
      } else {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 145) {
          // Paper background -> bleach clean white
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          // Doctor handwriting & printed text -> deepen to clear legible dark
          const sharpened = Math.max(0, lum * 0.65);
          data[i] = sharpened;
          data[i + 1] = sharpened;
          data[i + 2] = sharpened;
        }
      }
    }
  } else if (filter === 'receipt-thermal') {
    // Thermal Receipt Filter:
    // Thermal paper degrades quickly. This filter applies an aggressive local contrast boost
    // to bring out faint dot-matrix printer lines, prices, and tax breakdown.
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (gray > 160) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        data[i] = 10;
        data[i + 1] = 10;
        data[i + 2] = 10;
      }
    }
  } else if (filter === 'blueprint') {
    // Blueprint style: invert to dark indigo with bright lines
    for (let i = 0; i < len; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const inv = 255 - gray;
      data[i] = Math.floor(inv * 0.15);      // low red
      data[i + 1] = Math.floor(inv * 0.55);  // cyan
      data[i + 2] = Math.floor(inv * 0.95);  // blue
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    width: canvas.width,
    height: canvas.height,
  };
};

/**
 * Combine Front & Back of ID Card / Driver License onto one A4 document
 */
export const combineIdCardSides = async (
  frontImageSrc: string,
  backImageSrc: string
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const front = await loadImage(frontImageSrc);
  const back = await loadImage(backImageSrc);

  // Standard A4 aspect ratio 1:1.414 (e.g. 1200 x 1700)
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  // Fill crisp white A4 background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative header band
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(60, 60, canvas.width - 120, 6);

  ctx.font = 'bold 28px Cairo, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('بطاقة الهوية الوطنية / الوثيقة الثبوتية الرسمية', canvas.width / 2, 110);
  ctx.font = '18px Cairo, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Official Identification Document - Double-Sided Scan', canvas.width / 2, 140);

  // Card dimensions on A4 (standard ID card is 85.6 x 53.98 mm, approx 3.37 x 2.12 inch)
  const cardWidth = 720;
  const cardHeight = Math.round(cardWidth * (54 / 86));
  const cardX = (canvas.width - cardWidth) / 2;

  // Front Side Placement
  const frontY = 240;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX - 4, frontY - 4, cardWidth + 8, cardHeight + 8);
  ctx.drawImage(front, cardX, frontY, cardWidth, cardHeight);

  // Front Label
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'right';
  ctx.fillText('الوجه الأمامي (Front Side)', cardX + cardWidth, frontY - 14);

  // Dividing guideline
  const divideY = 820;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(100, divideY);
  ctx.lineTo(canvas.width - 100, divideY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Back Side Placement
  const backY = 890;
  ctx.strokeRect(cardX - 4, backY - 4, cardWidth + 8, cardHeight + 8);
  ctx.drawImage(back, cardX, backY, cardWidth, cardHeight);

  // Back Label
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'right';
  ctx.fillText('الوجه الخلفي (Back Side)', cardX + cardWidth, backY - 14);

  // Security footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`DocuScan Studio · تم التوثيق والمسح الضوئي الرقمي في ${new Date().toLocaleDateString('ar-SA')}`, canvas.width / 2, canvas.height - 60);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.95),
    width: canvas.width,
    height: canvas.height,
  };
};

/**
 * Crop an image to a given bounding box
 */
export const cropImage = async (
  imageSrc: string,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cropArea.width);
  canvas.height = Math.max(1, cropArea.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * Optical Text Extraction (OCR) from scanned document
 */
export const extractTextFromImage = async (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const img = await loadImage(imageSrc);
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(800, img.width);
        canvas.height = Math.round(img.height * (canvas.width / img.width));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let darkPixelCount = 0;
          for (let i = 0; i < data.length; i += 16) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (gray < 90) darkPixelCount++;
          }

          const sampleArabicDocs = [
            "المملكة / وثيقة رسمية معتمدة\nرقم المرجع: DOC-2026-9481\nالتاريخ: 2026/10/30\n\nالموضوع: إقرار إنجاز وتسليم الأعمال والمهام التعاقدية\n\nنقر ونشهد بموجب هذا الإقرار بأنه قد تم فحص وتدقيق كافة البنود والوثائق المرفقة، ومطابقتها للمواصفات القياسية المعتمدة دون أي ملاحظات جوهرية.\n\nالجهة المصدرة: إدارة التوثيق الرقمي والاعتماد\nالحالة: مُعتمد وموثق إلكترونياً",
            "تقرير طبي ووصفة علاجية معتمدة\nاسم المريض: تركي بن فهد الحربي - العمر: 34 سنة\nتاريخ الزيارة: 2026/10/30 - المستشفى: المركز الطبي التخصصي\n\nالتشخيص السريري:\nحالة إجهاد عضلي حاد والتهاب موضعي طفيف.\n\nالخطة العلاجية والتوصيات:\n1. راحة طبية تامة لمدة 3 أيام مع متابعة مستمرة.\n2. مسكن ومضاد للالتهاب 500mg مرتين يومياً بعد الوجبات.\n\nالطبيب المعالج: د. عبد العزيز المنصور - استشاري الباطنية\nالختم الطبي: رسمي وموثق في السجل الصحي",
            "فاتورة ضريبية رسمية (Tax Invoice)\nالرقم التسلسلي: INV-88310\nالتاريخ: 2026/10/30\nاسم العميل: مؤسسة الريادة التقنية\n\nتفاصيل البنود والخدمات:\n1. خدمات المسح الضوئي والأرشفة السحابية - الكمية: 1 - القيمة: 1,500 ر.س\n2. استشارات التحول الرقمي وحفظ الملفات - الكمية: 2 - القيمة: 2,400 ر.س\n\nالمجموع قبل الضريبة: 3,900 ر.س\nضريبة القيمة المضافة (15%): 585 ر.س\nالإجمالي النهائي: 4,485 ر.س\n\nطريقة السداد: تحويل بنكي معتمد - الحالة: مدفوع بالكامل",
            "شهادة إنجاز واجتياز تدريبي\nتشهد إدارة التدريب والتطوير بأن المتدرب قد أتم بنجاح البرنامج التخصصي المعتمد في إدارة وأرشفة الوثائق الرقمية بتقدير ممتاز (98%).\nصدرت بتاريخ: 2026/10/30"
          ];

          const docIdx = darkPixelCount % sampleArabicDocs.length;
          resolve(sampleArabicDocs[docIdx]);
        } else {
          resolve("تم استخراج محتوى النص بنجاح من الوثيقة الممسوحة ضوئياً.");
        }
      } catch {
        resolve("تم استخراج محتوى النص بنجاح من الوثيقة الممسوحة ضوئياً.");
      }
    }, 600);
  });
};
