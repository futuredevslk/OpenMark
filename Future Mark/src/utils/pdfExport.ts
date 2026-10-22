import { PDFDocument } from 'pdf-lib';
import type { Annotation, StudentPaper } from '../types';

/**
 * Draws annotations for a specific page onto an offscreen HTML5 canvas at high DPI
 */
export function renderAnnotationsToCanvas(
  annotations: Annotation[],
  pageWidth: number,
  pageHeight: number,
  scale: number = 2.5
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pageWidth * scale);
  canvas.height = Math.round(pageHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  for (const ann of annotations) {
    if (ann.type === 'pen' || ann.type === 'highlighter') {
      if (ann.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.width * (ann.type === 'highlighter' ? 8 : 3);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = ann.opacity ?? (ann.type === 'highlighter' ? 0.35 : 1.0);
      if (ann.type === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      }

      ctx.beginPath();
      const first = ann.points[0];
      ctx.moveTo(first.x * pageWidth, first.y * pageHeight);

      for (let i = 1; i < ann.points.length; i++) {
        const pt = ann.points[i];
        ctx.lineTo(pt.x * pageWidth, pt.y * pageHeight);
      }
      ctx.stroke();
      ctx.restore();
    } else if (ann.type === 'stamp') {
      const cx = ann.x * pageWidth;
      const cy = ann.y * pageHeight;
      const size = 32 * ann.scale;

      ctx.save();
      ctx.translate(cx, cy);

      if (ann.stampType === 'check') {
        ctx.strokeStyle = ann.color || '#16a34a';
        ctx.lineWidth = 4 * ann.scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, 0);
        ctx.lineTo(-size * 0.1, size * 0.35);
        ctx.lineTo(size * 0.45, -size * 0.35);
        ctx.stroke();
      } else if (ann.stampType === 'cross') {
        ctx.strokeStyle = ann.color || '#dc2626';
        ctx.lineWidth = 4 * ann.scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-size * 0.35, -size * 0.35);
        ctx.lineTo(size * 0.35, size * 0.35);
        ctx.moveTo(size * 0.35, -size * 0.35);
        ctx.lineTo(-size * 0.35, size * 0.35);
        ctx.stroke();
      } else if (ann.stampType === 'question') {
        ctx.fillStyle = ann.color || '#d97706';
        ctx.font = `bold ${Math.round(28 * ann.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
      } else if (ann.stampType === 'half') {
        ctx.fillStyle = ann.color || '#2563eb';
        ctx.font = `bold ${Math.round(22 * ann.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('½', 0, 0);
      } else if (ann.stampType === 'star') {
        ctx.fillStyle = ann.color || '#eab308';
        drawStar(ctx, 0, 0, 5, size * 0.45, size * 0.22);
        ctx.fill();
      }

      ctx.restore();
    } else if (ann.type === 'score') {
      const cx = ann.x * pageWidth;
      const cy = ann.y * pageHeight;
      ctx.save();
      ctx.translate(cx, cy);

      const text =
        ann.label ||
        (ann.score === 0.5
          ? '+½'
          : ann.score === -0.5
          ? '-½'
          : ann.score >= 0
          ? `+${ann.score}`
          : `${ann.score}`);
      const isPositive = ann.score >= 0;

      // Badge pill
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const pillWidth = Math.max(textWidth + 18, 36);
      const pillHeight = 26;

      ctx.fillStyle = isPositive ? '#16a34a' : '#dc2626';
      roundRect(ctx, -pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 13);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 1);
      ctx.restore();
    } else if (ann.type === 'text') {
      const cx = ann.x * pageWidth;
      const cy = ann.y * pageHeight;
      ctx.save();

      const fontSize = Math.round(ann.fontSize || 14);
      ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const lineHeight = fontSize * 1.35;
      const paddingX = 10;
      const paddingY = 6;

      // Support multi-line comments
      const lines = ann.text.split('\n');
      let maxLineWidth = 0;
      for (const line of lines) {
        const lw = ctx.measureText(line).width;
        if (lw > maxLineWidth) maxLineWidth = lw;
      }
      const boxWidth = maxLineWidth + paddingX * 2;
      const boxHeight = lines.length * lineHeight + paddingY * 2;

      // Handle edge shifting to stay inside page bounds
      const drawX = ann.x > 0.75 ? Math.max(0, cx - boxWidth * 0.9) : cx;
      const drawY = ann.y > 0.85 ? Math.max(0, cy - boxHeight * 0.9) : cy;

      // Draw neutral transparent background badge
      ctx.fillStyle = 'rgba(244, 244, 245, 0.45)';
      ctx.strokeStyle = 'rgba(212, 212, 216, 0.45)';
      ctx.lineWidth = 1;
      roundRect(ctx, drawX, drawY, boxWidth, boxHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Draw comment text inside badge
      ctx.fillStyle = '#18181b';
      ctx.textBaseline = 'top';
      lines.forEach((line, idx) => {
        ctx.fillText(line, drawX + paddingX, drawY + paddingY + idx * lineHeight);
      });
      ctx.restore();
    }
  }

  return canvas;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Embeds annotations into the original PDF and produces a downloadable Uint8Array
 */
export async function exportGradedPdf(paper: StudentPaper): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(paper.fileBuffer);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const pageAnnotations = paper.annotations.filter((a) => a.page === pageNum);
    if (pageAnnotations.length === 0) continue;

    const page = pages[i];
    const { width, height } = page.getSize();

    // Render annotations to high-res offscreen canvas
    const canvas = renderAnnotationsToCanvas(pageAnnotations, width, height, 2.5);
    const pngDataUrl = canvas.toDataURL('image/png');
    const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());

    const embeddedImage = await pdfDoc.embedPng(pngBytes);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}
