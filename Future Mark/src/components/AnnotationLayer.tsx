import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { Annotation, Point, StrokeAnnotation, TextAnnotation, ToolType, StampType } from '../types';

interface AnnotationLayerProps {
  pageNumber: number;
  width: number;
  height: number;
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
  onUpdateAnnotation?: (ann: Annotation) => void;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNumber,
  width,
  height,
  annotations,
  activeTool,
  penColor,
  penWidth,
  activeStamp,
  activeScore,
  highlighterColor,
  highlighterWidth = 3,
  eraserSize = 3,
  commentFontSize = 14,
  onAddAnnotation,
  onDeleteAnnotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isCancellingRef = useRef(false);
  const mountTimeRef = useRef(0);

  // Focus textarea immediately when comment input appears
  useEffect(() => {
    if (textInputPos) {
      mountTimeRef.current = Date.now();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [textInputPos]);

  // Filter annotations for this specific page
  const pageAnnotations = annotations.filter((a) => a.page === pageNumber);

  // Redraw canvas whenever annotations, dimensions, or current active stroke changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Render committed page annotations
    for (const ann of pageAnnotations) {
      const isHovered = hoveredAnnotationId === ann.id && activeTool === 'eraser';

      if (ann.type === 'pen' || ann.type === 'highlighter') {
        if (ann.points.length < 2) continue;
        ctx.save();
        ctx.strokeStyle = isHovered ? '#ef4444' : ann.color;
        ctx.lineWidth = ann.width * (ann.type === 'highlighter' ? 8 : 3);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = ann.opacity ?? (ann.type === 'highlighter' ? 0.35 : 1.0);
        if (ann.type === 'highlighter') {
          ctx.globalCompositeOperation = 'multiply';
        }

        ctx.beginPath();
        const p0 = ann.points[0];
        ctx.moveTo(p0.x * width, p0.y * height);

        for (let i = 1; i < ann.points.length; i++) {
          const pt = ann.points[i];
          ctx.lineTo(pt.x * width, pt.y * height);
        }
        ctx.stroke();
        ctx.restore();
      } else if (ann.type === 'stamp') {
        const cx = ann.x * width;
        const cy = ann.y * height;
        const size = 32 * ann.scale;

        ctx.save();
        ctx.translate(cx, cy);
        if (isHovered) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        if (ann.stampType === 'check') {
          ctx.strokeStyle = isHovered ? '#ef4444' : (ann.color || '#16a34a');
          ctx.lineWidth = 4 * ann.scale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-size * 0.4, 0);
          ctx.lineTo(-size * 0.1, size * 0.35);
          ctx.lineTo(size * 0.45, -size * 0.35);
          ctx.stroke();
        } else if (ann.stampType === 'cross') {
          ctx.strokeStyle = isHovered ? '#ef4444' : (ann.color || '#dc2626');
          ctx.lineWidth = 4 * ann.scale;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-size * 0.35, -size * 0.35);
          ctx.lineTo(size * 0.35, size * 0.35);
          ctx.moveTo(size * 0.35, -size * 0.35);
          ctx.lineTo(-size * 0.35, size * 0.35);
          ctx.stroke();
        } else if (ann.stampType === 'question') {
          ctx.fillStyle = isHovered ? '#ef4444' : (ann.color || '#d97706');
          ctx.font = `bold ${Math.round(28 * ann.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', 0, 0);
        } else if (ann.stampType === 'half') {
          ctx.fillStyle = isHovered ? '#ef4444' : (ann.color || '#2563eb');
          ctx.font = `bold ${Math.round(22 * ann.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('½', 0, 0);
        } else if (ann.stampType === 'star') {
          ctx.fillStyle = isHovered ? '#ef4444' : (ann.color || '#eab308');
          drawStar(ctx, 0, 0, 5, size * 0.45, size * 0.22);
          ctx.fill();
        }

        ctx.restore();
      } else if (ann.type === 'score') {
        const cx = ann.x * width;
        const cy = ann.y * height;
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

        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textWidth = ctx.measureText(text).width;
        const pillWidth = Math.max(textWidth + 18, 36);
        const pillHeight = 26;

        ctx.fillStyle = isHovered ? '#ef4444' : isPositive ? '#16a34a' : '#dc2626';
        roundRect(ctx, -pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 13);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 1);
        ctx.restore();
      } else if (ann.type === 'text') {
        // Skip canvas drawing: Text comments are rendered as interactive DOM elements
        // with transparent neutral background and hover delete action
      }
    }

    // Render active live drawing stroke in progress
    if (isDrawing && currentStroke.length > 1) {
      const isHighlighter = activeTool === 'highlighter';
      ctx.save();
      ctx.strokeStyle = isHighlighter ? highlighterColor : penColor;
      ctx.lineWidth = isHighlighter ? highlighterWidth * 8 : penWidth * 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = isHighlighter ? 0.4 : 1.0;
      if (isHighlighter) {
        ctx.globalCompositeOperation = 'multiply';
      }

      ctx.beginPath();
      const p0 = currentStroke[0];
      ctx.moveTo(p0.x * width, p0.y * height);

      for (let i = 1; i < currentStroke.length; i++) {
        const pt = currentStroke[i];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [
    width,
    height,
    pageAnnotations,
    hoveredAnnotationId,
    activeTool,
    isDrawing,
    currentStroke,
    penColor,
    penWidth,
    highlighterColor,
    highlighterWidth,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Convert client pointer event coordinates to normalized [0..1]
  const getNormalizedCoords = (e: React.PointerEvent): Point | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const pressure = e.pressure > 0 ? e.pressure : 0.5;

    return { x, y, pressure };
  };

  // Find nearest annotation near point
  const findAnnotationAt = (pt: Point): Annotation | null => {
    const px = pt.x * width;
    const py = pt.y * height;
    const threshold = 8 + eraserSize * 4;

    for (let i = pageAnnotations.length - 1; i >= 0; i--) {
      const ann = pageAnnotations[i];
      if (ann.type === 'stamp' || ann.type === 'score' || ann.type === 'text') {
        const ax = ann.x * width;
        const ay = ann.y * height;
        const dist = Math.hypot(px - ax, py - ay);
        if (dist <= threshold + (ann.type === 'stamp' ? 16 : 24)) {
          return ann;
        }
      } else if (ann.type === 'pen' || ann.type === 'highlighter') {
        for (const p of ann.points) {
          const sx = p.x * width;
          const sy = p.y * height;
          if (Math.hypot(px - sx, py - sy) <= threshold + 6) {
            return ann;
          }
        }
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDrawing(true);
      setCurrentStroke([pt]);
    } else if (activeTool === 'stamp') {
      const stampAnn: Annotation = {
        id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        page: pageNumber,
        type: 'stamp',
        stampType: activeStamp,
        x: pt.x,
        y: pt.y,
        scale: 1.0,
        color:
          activeStamp === 'check'
            ? '#16a34a'
            : activeStamp === 'cross'
            ? '#dc2626'
            : activeStamp === 'question'
            ? '#d97706'
            : activeStamp === 'half'
            ? '#2563eb'
            : '#eab308',
        createdAt: Date.now(),
      };
      onAddAnnotation(stampAnn);
    } else if (activeTool === 'score') {
      const scoreAnn: Annotation = {
        id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        page: pageNumber,
        type: 'score',
        x: pt.x,
        y: pt.y,
        score: activeScore,
        label:
          activeScore === 0.5
            ? '+½'
            : activeScore === -0.5
            ? '-½'
            : activeScore >= 0
            ? `+${activeScore}`
            : `${activeScore}`,
        createdAt: Date.now(),
      };
      onAddAnnotation(scoreAnn);
    } else if (activeTool === 'text') {
      e.preventDefault();
      if (textInputPos && textInputValue.trim()) {
        onAddAnnotation({
          id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          page: pageNumber,
          type: 'text',
          x: textInputPos.x,
          y: textInputPos.y,
          text: textInputValue.trim(),
          fontSize: commentFontSize || 14,
          color: penColor || '#18181b',
          createdAt: Date.now(),
        });
      }
      mountTimeRef.current = Date.now();
      setTextInputPos({ x: pt.x, y: pt.y });
      setTextInputValue('');
    } else if (activeTool === 'eraser') {
      const target = findAnnotationAt(pt);
      if (target) {
        onDeleteAnnotation(target.id);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter')) {
      setCurrentStroke((prev) => [...prev, pt]);
    } else if (activeTool === 'eraser') {
      const target = findAnnotationAt(pt);
      setHoveredAnnotationId(target ? target.id : null);
      if (e.buttons === 1 && target) {
        onDeleteAnnotation(target.id);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing) {
      setIsDrawing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      if (currentStroke.length > 1) {
        const strokeAnn: StrokeAnnotation = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          page: pageNumber,
          type: activeTool === 'highlighter' ? 'highlighter' : 'pen',
          points: currentStroke,
          color: activeTool === 'highlighter' ? highlighterColor : penColor,
          width: activeTool === 'highlighter' ? highlighterWidth : penWidth,
          opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
          createdAt: Date.now(),
        };
        onAddAnnotation(strokeAnn);
      }
      setCurrentStroke([]);
    }
  };

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCancellingRef.current) {
      isCancellingRef.current = false;
      setTextInputPos(null);
      setTextInputValue('');
      return;
    }
    if (textInputPos && textInputValue.trim()) {
      onAddAnnotation({
        id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        page: pageNumber,
        type: 'text',
        x: textInputPos.x,
        y: textInputPos.y,
        text: textInputValue.trim(),
        fontSize: commentFontSize || 14,
        color: penColor || '#18181b',
        createdAt: Date.now(),
      });
    }
    setTextInputPos(null);
    setTextInputValue('');
  };

  const getCursor = () => {
    switch (activeTool) {
      case 'pen':
      case 'highlighter':
        return 'crosshair';
      case 'stamp':
      case 'score':
        return 'copy';
      case 'text':
        return 'text';
      case 'eraser':
        return 'pointer';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none touch-none"
      style={{ cursor: getCursor() }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="block absolute top-0 left-0"
      />

      {/* Placed Text Comments with transparent neutral background & hover delete icon */}
      {pageAnnotations
        .filter((ann): ann is TextAnnotation => ann.type === 'text')
        .map((ann) => (
          <div
            key={ann.id}
            className="group/comment absolute z-20 flex items-start bg-neutral-200/35 dark:bg-neutral-900/40 backdrop-blur-xs border border-neutral-300/40 dark:border-neutral-700/40 shadow-xs rounded-lg px-2.5 py-1.5 transition-all select-none"
            style={{
              left: `${ann.x * 100}%`,
              top: `${ann.y * 100}%`,
              transform: `${ann.x > 0.75 ? 'translateX(-90%)' : 'translateX(0)'} ${
                ann.y > 0.85 ? 'translateY(-90%)' : 'translateY(0)'
              }`,
              maxWidth: '360px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (activeTool === 'eraser') {
                onDeleteAnnotation(ann.id);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <div
              className="text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed whitespace-pre-wrap select-text break-words"
              style={{ fontSize: `${ann.fontSize || commentFontSize || 14}px` }}
            >
              {ann.text}
            </div>

            {/* Delete button appears on hover */}
            <button
              type="button"
              title="Delete comment"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAnnotation(ann.id);
              }}
              className="opacity-0 group-hover/comment:opacity-100 pointer-events-none group-hover/comment:pointer-events-auto transition-opacity absolute -top-2 -right-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-full p-1 shadow-xs text-neutral-400 hover:text-red-500 dark:text-neutral-300 dark:hover:text-red-400 hover:scale-110 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

      {/* Active Inline Typable Text Comment Input */}
      {textInputPos && (
        <div
          className="absolute z-30 flex items-start gap-1 bg-neutral-200/40 dark:bg-neutral-900/45 backdrop-blur-xs border border-neutral-300/50 dark:border-neutral-700/50 shadow-md rounded-lg p-1.5 min-w-48 max-w-80 select-text"
          style={{
            left: `${textInputPos.x * 100}%`,
            top: `${textInputPos.y * 100}%`,
            transform: `${textInputPos.x > 0.75 ? 'translateX(-90%)' : 'translateX(0)'} ${
              textInputPos.y > 0.85 ? 'translateY(-90%)' : 'translateY(0)'
            }`,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            rows={1}
            value={textInputValue}
            style={{ fontSize: `${commentFontSize}px` }}
            onChange={(e) => {
              setTextInputValue(e.target.value);
              mountTimeRef.current = 0;
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`;
            }}
            onBlur={() => {
              // Ignore spurious blur during the initial opening click
              if (Date.now() - mountTimeRef.current < 350) {
                textareaRef.current?.focus();
                return;
              }
              handleTextSubmit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                isCancellingRef.current = true;
                setTextInputPos(null);
                setTextInputValue('');
              }
            }}
            placeholder="Type comment..."
            className="bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-none flex-1 leading-relaxed px-1 py-0.5 select-text font-medium"
          />
          <button
            type="button"
            title="Delete comment"
            onPointerDown={(e) => {
              isCancellingRef.current = true;
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              isCancellingRef.current = true;
              setTextInputPos(null);
              setTextInputValue('');
            }}
            className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

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
