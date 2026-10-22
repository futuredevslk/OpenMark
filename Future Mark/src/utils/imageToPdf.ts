import { PDFDocument } from 'pdf-lib';

/**
 * Converts any browser-compatible image file (JPG, PNG, WebP, etc.) to normalized JPEG bytes
 * and natural dimensions using an offscreen canvas.
 */
export async function fileToJpeg(
  file: File
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 1100;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // Draw solid white background in case image has transparent areas (PNG/WebP)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error(`Failed to encode image ${file.name} to JPEG`));
            return;
          }
          const buffer = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(buffer),
            width: w,
            height: h,
          });
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image file: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * Converts an ordered list of Image files into a multi-page PDF document.
 * Each image becomes one page in the exact order specified.
 */
export async function convertImagesToPdf(
  imageFiles: File[],
  onProgress?: (current: number, total: number) => void
): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imageFiles.length; i++) {
    if (onProgress) {
      onProgress(i + 1, imageFiles.length);
    }

    const file = imageFiles[i];
    const { bytes, width, height } = await fileToJpeg(file);
    const embeddedJpg = await pdfDoc.embedJpg(bytes);

    // Standard A4 reference width in PDF points is 595.28 pt
    const isLandscape = width > height;
    const targetWidth = isLandscape ? 841.89 : 595.28;
    const targetHeight = Math.round((height / width) * targetWidth);

    const page = pdfDoc.addPage([targetWidth, targetHeight]);
    page.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes.buffer as ArrayBuffer;
}
