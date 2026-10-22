import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker from public directory or fallback
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', window.location.href).href;
}

export { pdfjsLib };
