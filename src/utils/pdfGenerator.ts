import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { ScannedPage, PdfDocumentState, AppSettings } from '../types';

/**
 * Generate PDF from scanned pages
 */
export const exportScannedPagesToPdf = async (
  pages: ScannedPage[],
  settings?: Partial<AppSettings>,
  fileName: string = 'scanned_document.pdf'
): Promise<{ blob: Blob; url: string }> => {
  if (pages.length === 0) {
    throw new Error('No pages to export');
  }

  const format = settings?.defaultPageSize || 'a4';
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: format,
    compress: settings?.pdfQuality !== 'high',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage(format, pages[i].width > pages[i].height ? 'landscape' : 'portrait');
    }

    const curPageWidth = pdf.internal.pageSize.getWidth();
    const curPageHeight = pdf.internal.pageSize.getHeight();
    const page = pages[i];
    const imgData = page.enhancedDataUrl || page.originalDataUrl;

    // Calculate aspect ratio fit
    const imgAspect = page.width / page.height;
    const pageAspect = curPageWidth / curPageHeight;

    let renderWidth = curPageWidth;
    let renderHeight = curPageHeight;
    let offsetX = 0;
    let offsetY = 0;

    // Margin: 6mm for clean border
    const margin = 6;
    const usableWidth = curPageWidth - margin * 2;
    const usableHeight = curPageHeight - margin * 2;
    const usableAspect = usableWidth / usableHeight;

    if (imgAspect > usableAspect) {
      renderWidth = usableWidth;
      renderHeight = usableWidth / imgAspect;
      offsetX = margin;
      offsetY = margin + (usableHeight - renderHeight) / 2;
    } else {
      renderHeight = usableHeight;
      renderWidth = usableHeight * imgAspect;
      offsetX = margin + (usableWidth - renderWidth) / 2;
      offsetY = margin;
    }

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');

    // Optional timestamp or page number
    if (settings?.includeTimestampWatermark) {
      pdf.setFontSize(8);
      pdf.setTextColor(140, 140, 140);
      const footerText = `DocuScan · Page ${i + 1} of ${pages.length} · ${new Date().toLocaleDateString()}`;
      pdf.text(footerText, curPageWidth / 2, curPageHeight - 3, { align: 'center' });
    }
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  return { blob, url };
};

/**
 * Generate official PDF from Document State (Invoice, Report, Letter, Certificate, Resume, Contract)
 */
export const generateDocumentPdf = async (
  doc: PdfDocumentState
): Promise<{ blob: Blob; url: string }> => {
  const orientation = doc.orientation || 'portrait';
  const format = doc.pageSize || 'a4';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = width - margin * 2;

  // Primary accent color
  const hex = doc.primaryColor || '#0284c7';
  const r = parseInt(hex.slice(1, 3), 16) || 15;
  const g = parseInt(hex.slice(3, 5), 16) || 118;
  const b = parseInt(hex.slice(5, 7), 16) || 110;

  // Header band / decoration
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, width, 12, 'F');

  // Top header text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(30, 41, 59);
  pdf.text(doc.title || 'OFFICIAL DOCUMENT', margin, 26);

  if (doc.subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(100, 116, 139);
    pdf.text(doc.subtitle, margin, 33);
  }

  // Meta strip (Date & Author)
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 38, width - margin, 38);

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATE:', margin, 44);
  pdf.setFont('helvetica', 'normal');
  pdf.text(doc.date || new Date().toISOString().split('T')[0], margin + 14, 44);

  if (doc.author) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('ISSUER:', width / 2, 44);
    pdf.setFont('helvetica', 'normal');
    pdf.text(doc.author, width / 2 + 16, 44);
  }

  pdf.line(margin, 48, width - margin, 48);

  let currentY = 56;

  // If Invoice, render tabular items
  if (doc.templateId === 'invoice' && doc.items && doc.items.length > 0) {
    // Table Header
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);

    pdf.text('Description', margin + 4, currentY + 5.5);
    pdf.text('Qty', width - margin - 50, currentY + 5.5, { align: 'right' });
    pdf.text('Unit Price', width - margin - 26, currentY + 5.5, { align: 'right' });
    pdf.text('Total', width - margin - 4, currentY + 5.5, { align: 'right' });

    currentY += 9;
    let grandTotal = 0;

    doc.items.forEach((item, index) => {
      const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
      grandTotal += lineTotal;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, currentY - 1, contentWidth, 7, 'F');
      }

      pdf.text(item.description || `Item #${index + 1}`, margin + 4, currentY + 4);
      pdf.text(String(item.quantity || 1), width - margin - 50, currentY + 4, { align: 'right' });
      pdf.text(`$${(item.unitPrice || 0).toFixed(2)}`, width - margin - 26, currentY + 4, { align: 'right' });
      pdf.text(`$${lineTotal.toFixed(2)}`, width - margin - 4, currentY + 4, { align: 'right' });

      currentY += 7;
    });

    // Grand Total box
    currentY += 3;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(width - margin - 60, currentY, width - margin, currentY);
    currentY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Grand Total:', width - margin - 35, currentY);
    pdf.text(`$${grandTotal.toFixed(2)}`, width - margin - 4, currentY, { align: 'right' });
    currentY += 12;
  }

  // Document Content Body
  if (doc.content) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);

    const splitText = pdf.splitTextToSize(doc.content, contentWidth);
    pdf.text(splitText, margin, currentY);
    currentY += splitText.length * 5 + 10;
  }

  // Stamp Rendering (APPROVED, CONFIDENTIAL, PAID, OFFICIAL, DRAFT)
  if (doc.stamp && doc.stamp !== 'NONE') {
    const stampX = width - margin - 42;
    const stampY = Math.min(currentY + 10, height - 55);

    pdf.saveGraphicsState();
    if (doc.stamp === 'APPROVED' || doc.stamp === 'OFFICIAL') {
      pdf.setDrawColor(16, 185, 129); // emerald
      pdf.setTextColor(16, 185, 129);
    } else if (doc.stamp === 'PAID') {
      pdf.setDrawColor(14, 165, 233); // sky blue
      pdf.setTextColor(14, 165, 233);
    } else if (doc.stamp === 'CONFIDENTIAL') {
      pdf.setDrawColor(239, 68, 68); // red
      pdf.setTextColor(239, 68, 68);
    } else {
      pdf.setDrawColor(148, 163, 184); // slate draft
      pdf.setTextColor(148, 163, 184);
    }

    pdf.setLineWidth(1.2);
    pdf.roundedRect(stampX, stampY, 38, 14, 2, 2, 'D');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(doc.stamp, stampX + 19, stampY + 9, { align: 'center' });
    pdf.restoreGraphicsState();
  }

  // Electronic Signature section
  const sigY = height - 42;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, sigY, margin + 65, sigY);

  if (doc.signatureDataUrl) {
    try {
      pdf.addImage(doc.signatureDataUrl, 'PNG', margin, sigY - 20, 48, 18);
    } catch (e) {
      console.warn('Failed embedding signature image', e);
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 41, 59);
  pdf.text(doc.signerName || 'Authorized Signature', margin, sigY + 5);

  if (doc.signerTitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(doc.signerTitle, margin, sigY + 9);
  }

  // Watermark (diagonal)
  if (doc.watermarkText && doc.watermarkText.trim()) {
    pdf.saveGraphicsState();
    pdf.setTextColor(220, 225, 233);
    pdf.setFontSize(40);
    pdf.setFont('helvetica', 'bold');
    
    // Rotate and place in center
    // jsPDF rotation in degrees
    const cx = width / 2;
    const cy = height / 2;
    pdf.text(doc.watermarkText.toUpperCase(), cx, cy, {
      align: 'center',
      angle: 45,
    });
    pdf.restoreGraphicsState();
  }

  // Footer bar
  pdf.setFillColor(241, 245, 249);
  pdf.rect(0, height - 10, width, 10, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`DocuScan & PDF Studio · Generated ${new Date().toLocaleDateString()}`, width / 2, height - 4, { align: 'center' });

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  return { blob, url };
};

/**
 * Add a watermark or signature to an existing external PDF using pdf-lib
 */
export const watermarkExternalPdf = async (
  pdfBytes: ArrayBuffer,
  watermarkText: string,
  signatureDataUrl?: string
): Promise<{ blob: Blob; url: string }> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (watermarkText && watermarkText.trim()) {
      page.drawText(watermarkText.toUpperCase(), {
        x: width / 4,
        y: height / 2,
        size: 42,
        font,
        color: rgb(0.85, 0.85, 0.88),
        rotate: degrees(40),
      });
    }

    if (signatureDataUrl) {
      try {
        const sigImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
        const sigImage = await pdfDoc.embedPng(sigImageBytes);
        page.drawImage(sigImage, {
          x: width - 160,
          y: 40,
          width: 120,
          height: 45,
        });
      } catch (err) {
        console.warn('Failed embedding signature to external pdf', err);
      }
    }
  }

  const modifiedBytes = await pdfDoc.save();
  const blob = new Blob([modifiedBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  return { blob, url };
};

/**
 * Creates a high quality sample demo PDF for immediate testing in the PDF Viewer
 */
export const createSampleDemoPdf = async (): Promise<{ blob: Blob; url: string }> => {
  return generateDocumentPdf({
    title: 'OFFICIAL SERVICE REPORT',
    subtitle: 'DocuScan Digital Transformation & Compliance Report',
    author: 'DocuScan Quality Lab & Archival Systems',
    subject: 'Verification & Quality Audit',
    date: new Date().toISOString().split('T')[0],
    templateId: 'report',
    content: `1. EXECUTIVE SUMMARY
This official certificate certifies the digital ingestion, optical verification, and automated archiving of enterprise documentation under standard digital preservation protocols.

2. SPECIFICATIONS & COMPLIANCE
- Resolution Standard: 300 DPI Optical Clarity
- Document Fidelity: 100% Uncompressed Vector Layout
- Privacy Guarantee: Zero Server Transit (100% In-Browser Execution)
- Format Standard: PDF/A-Compliant Archival Standards

3. RECOMMENDATIONS & AUDIT SIGN-OFF
The inspected files meet all institutional requirements for legal document scanning, OCR indexing, and secure PDF generation.`,
    stamp: 'APPROVED',
    signerName: 'Dr. Tariq Al-Mansoor',
    signerTitle: 'Director of Digital Archiving',
    watermarkText: 'VERIFIED & AUTHENTIC',
    primaryColor: '#059669',
    pageSize: 'a4',
    orientation: 'portrait',
  });
};
