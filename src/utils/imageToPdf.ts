import { jsPDF } from 'jspdf';
import { loadImage } from './imageProcessing';

export interface ImageToPdfItem {
  id: string;
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export interface ImageToPdfOptions {
  pageSize: 'a4' | 'letter' | 'fit-image';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'slim' | 'normal';
  quality: 'high' | 'medium';
  includePageNumbers: boolean;
  docTitle?: string;
}

export const convertImagesToPdf = async (
  images: ImageToPdfItem[],
  options: ImageToPdfOptions
): Promise<{ blob: Blob; url: string }> => {
  if (images.length === 0) {
    throw new Error('No images provided for PDF conversion');
  }

  // Margin in mm
  let marginMm = 0;
  if (options.margin === 'slim') marginMm = 6;
  if (options.margin === 'normal') marginMm = 14;

  let pdf: jsPDF | null = null;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const isRotated = item.rotation % 180 !== 0;
    const effectiveWidth = isRotated ? item.height : item.width;
    const effectiveHeight = isRotated ? item.width : item.height;
    const aspect = effectiveWidth / effectiveHeight;

    // Determine page orientation
    let pageOrientation: 'portrait' | 'landscape' = 'portrait';
    if (options.orientation === 'auto') {
      pageOrientation = aspect > 1 ? 'landscape' : 'portrait';
    } else {
      pageOrientation = options.orientation;
    }

    if (i === 0) {
      if (options.pageSize === 'fit-image') {
        // Fit page directly to image dimensions (converted to mm at 96 DPI)
        const mmWidth = (effectiveWidth * 25.4) / 96;
        const mmHeight = (effectiveHeight * 25.4) / 96;
        pdf = new jsPDF({
          orientation: pageOrientation,
          unit: 'mm',
          format: [mmWidth, mmHeight],
          compress: options.quality !== 'high',
        });
      } else {
        pdf = new jsPDF({
          orientation: pageOrientation,
          unit: 'mm',
          format: options.pageSize,
          compress: options.quality !== 'high',
        });
      }
    } else if (pdf) {
      if (options.pageSize === 'fit-image') {
        const mmWidth = (effectiveWidth * 25.4) / 96;
        const mmHeight = (effectiveHeight * 25.4) / 96;
        pdf.addPage([mmWidth, mmHeight], pageOrientation);
      } else {
        pdf.addPage(options.pageSize, pageOrientation);
      }
    }

    if (!pdf) continue;

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Prepare rotated image on canvas if rotation != 0
    let renderDataUrl = item.dataUrl;
    if (item.rotation !== 0) {
      const img = await loadImage(item.dataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = effectiveWidth;
      canvas.height = effectiveHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.drawImage(img, -item.width / 2, -item.height / 2);
        renderDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
    }

    const usableWidth = pageWidth - marginMm * 2;
    const usableHeight = pageHeight - marginMm * 2;
    const usableAspect = usableWidth / usableHeight;

    let targetWidth = usableWidth;
    let targetHeight = usableHeight;
    let offsetX = marginMm;
    let offsetY = marginMm;

    if (options.pageSize === 'fit-image' && marginMm === 0) {
      targetWidth = pageWidth;
      targetHeight = pageHeight;
      offsetX = 0;
      offsetY = 0;
    } else {
      if (aspect > usableAspect) {
        targetWidth = usableWidth;
        targetHeight = usableWidth / aspect;
        offsetY = marginMm + (usableHeight - targetHeight) / 2;
      } else {
        targetHeight = usableHeight;
        targetWidth = usableHeight * aspect;
        offsetX = marginMm + (usableWidth - targetWidth) / 2;
      }
    }

    pdf.addImage(renderDataUrl, 'JPEG', offsetX, offsetY, targetWidth, targetHeight, undefined, 'FAST');

    // Page number in footer if requested and margin > 0
    if (options.includePageNumbers && marginMm > 0) {
      pdf.setFontSize(8);
      pdf.setTextColor(140, 140, 140);
      const pageNumText = `${i + 1} / ${images.length}`;
      pdf.text(pageNumText, pageWidth / 2, pageHeight - 3, { align: 'center' });
    }
  }

  if (!pdf) {
    throw new Error('Failed creating PDF');
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  return { blob, url };
};
