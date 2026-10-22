import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { AnnotationLayer } from './AnnotationLayer';
import type { Annotation, ToolType, StampType } from '../types';

interface PdfPageViewProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  paperInverted: boolean;
  annotations: Annotation[];
  activeTool: ToolType;
  penColor: string;
  penWidth: number;
  activeStamp: StampType;
  activeScore: number;
  highlighterColor: string;
  highlighterWidth?: number;
  eraserSize?: number;
  commentFontSize?: number;
  onAddAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (ann: Annotation) => void;
}

export const PdfPageView: React.FC<PdfPageViewProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  paperInverted,
  annotations,
  activeTool,
  penColor,
  penWidth,
  activeStamp,
  activeScore,
  highlighterColor,
  highlighterWidth,
  eraserSize,
  commentFontSize,
  onAddAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        setDimensions({ width: viewport.width, height: viewport.height });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);

        // Cancel previous active render task if still running
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const transform = [
          canvas.width / viewport.width,
          0,
          0,
          canvas.height / viewport.height,
          0,
          0,
        ];

        const renderContext = {
          canvas: canvas,
          canvasContext: ctx,
          viewport: viewport,
          transform: transform,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div
      className={`relative mb-8 mx-auto transition-all duration-200 select-none shadow-2xl rounded-sm ${
        paperInverted ? 'paper-inverted' : 'bg-white'
      }`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      {/* Background PDF Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        className="block absolute top-0 left-0 bg-white"
      />

      {/* Foreground Annotation Layer */}
      <AnnotationLayer
        pageNumber={pageNumber}
        width={dimensions.width}
        height={dimensions.height}
        annotations={annotations}
        activeTool={activeTool}
        penColor={penColor}
        penWidth={penWidth}
        activeStamp={activeStamp}
        activeScore={activeScore}
        highlighterColor={highlighterColor}
        highlighterWidth={highlighterWidth}
        eraserSize={eraserSize}
        commentFontSize={commentFontSize}
        onAddAnnotation={onAddAnnotation}
        onDeleteAnnotation={onDeleteAnnotation}
        onUpdateAnnotation={onUpdateAnnotation}
      />

      {/* Discreet Page Number Badge */}
      <div className="absolute bottom-2 right-3 pointer-events-none text-[11px] font-medium text-slate-400 bg-white/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-zinc-700">
        Page {pageNumber}
      </div>
    </div>
  );
};
