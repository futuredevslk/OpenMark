import React, { useState, useRef } from 'react';
import {
  PenLine,
  Highlighter,
  MessageSquare,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Keyboard,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Eye,
  Download,
  FolderArchive,
  Award,
  FileText,
  Images,
  Files,
} from 'lucide-react';
import type { ToolType, StampType, StudentPaper } from '../types';

export interface SidebarProps {
  papers: StudentPaper[];
  activePaperIndex: number;
  onSelectPaper: (index: number) => void;
  onUploadPapers: (files: FileList) => void;
  scale: number;
  setScale: (update: (prev: number) => number) => void;
  paperInverted: boolean;
  setPaperInverted: (val: boolean | ((prev: boolean) => boolean)) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExportCurrent: () => void;
  onExportAllZip: () => void;
  onExportAllSeparate?: () => void;
  exportStatus?: string | null;
  totalScore: number;
  isExporting: boolean;

  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (w: number) => void;
  highlighterWidth: number;
  setHighlighterWidth: (w: number) => void;
  eraserSize: number;
  setEraserSize: (s: number) => void;
  activeStamp?: StampType;
  setActiveStamp?: (stamp: StampType) => void;
  activeScore: number;
  setActiveScore: (s: number) => void;
  highlighterColor: string;
  setHighlighterColor: (color: string) => void;
  commentFontSize?: number;
  setCommentFontSize?: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearPage: () => void;
  onDeletePaper?: (index: number) => void;
  onClearAllPapers?: () => void;
  onOpenImagesToPdf?: () => void;
}

const PEN_COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Black', hex: '#1e293b' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Green', hex: '#4ade80' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Cyan', hex: '#38bdf8' },
];

const QUICK_SCORES = [
  { value: 0.5, label: '+½', title: 'Half Credit (+0.5)' },
  { value: 1, label: '+1', title: '+1 Point' },
  { value: 2, label: '+2', title: '+2 Points' },
  { value: 3, label: '+3', title: '+3 Points' },
  { value: 5, label: '+5', title: '+5 Points' },
  { value: 10, label: '+10', title: '+10 Points' },
  { value: -0.5, label: '-½', title: 'Deduct Half Point (-0.5)' },
  { value: -1, label: '-1', title: '-1 Point' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  papers,
  activePaperIndex,
  onSelectPaper,
  onUploadPapers,
  scale,
  setScale,
  paperInverted,
  setPaperInverted,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  onExportCurrent,
  onExportAllZip,
  onExportAllSeparate,
  exportStatus,
  totalScore,
  isExporting,
  activeTool,
  setActiveTool,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  highlighterWidth,
  setHighlighterWidth,
  eraserSize,
  setEraserSize,
  activeScore,
  setActiveScore,
  highlighterColor,
  setHighlighterColor,
  commentFontSize = 14,
  setCommentFontSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearPage,
  onDeletePaper,
  onClearAllPapers,
  onOpenImagesToPdf,
}) => {
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentPaper = papers[activePaperIndex];

  // Hidden File Input
  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept=".pdf,application/pdf,image/*"
      className="hidden"
      onChange={(e) => {
        if (e.target.files && e.target.files.length > 0) {
          onUploadPapers(e.target.files);
        }
      }}
    />
  );
  return (
    <aside className="w-72 shrink-0 flex flex-col h-screen bg-white dark:bg-[#121212] border-r border-[#e2e8f0] dark:border-[#262626] z-20 select-none shadow-xs relative">
      {hiddenFileInput}

      {/* Brand Header & Quick Actions */}
      <div className="h-13 shrink-0 px-3.5 flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#262626]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#2563eb] dark:bg-[#3b82f6] flex items-center justify-center text-white text-xs font-black shadow-xs">
            ✓
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-zinc-100">
            Future Mark
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] dark:text-zinc-400 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Fullscreen Button */}
          <button
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Mode (F11)'}
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] dark:text-zinc-400 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3.5">
        {/* SECTION 1: Student Papers & Upload (Two-box fixed layout) */}
        <div className="space-y-2">
          {/* First Box: Open / Upload PDF(s) / Images + Images to PDF + Delete All PDFs button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-[#2563eb] dark:hover:border-[#3b82f6] bg-slate-50 dark:bg-[#171717] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#3b82f6]" />
              <span>Open PDF(s) / Images</span>
            </button>

            {onOpenImagesToPdf && (
              <button
                type="button"
                title="Convert Images to PDF"
                onClick={onOpenImagesToPdf}
                className="py-2 px-2.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-[#171717] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shrink-0"
              >
                <Images className="w-3.5 h-3.5" />
              </button>
            )}

            {onClearAllPapers && (
              <button
                title="Delete all PDFs"
                disabled={papers.length === 0}
                onClick={onClearAllPapers}
                className="py-2 px-2.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 bg-slate-50 dark:bg-[#171717] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Second Box: Fixed-size section showing list of uploaded PDFs (or empty state) */}
          <div className="h-28 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-zinc-800 p-1.5 overflow-y-auto">
            {papers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 dark:text-zinc-400 text-center space-y-1 px-2 select-none">
                <p className="font-semibold text-slate-700 dark:text-zinc-200">No Document Open</p>
                <p className="text-[11px] leading-tight">Upload student PDF submissions or use the demo sample on the canvas.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {papers.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPaper(idx)}
                    className={`group/paper w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      idx === activePaperIndex
                        ? 'bg-white dark:bg-[#262626] text-[#2563eb] dark:text-[#60a5fa] font-semibold shadow-2xs'
                        : 'hover:bg-white/60 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-mono text-[10px] opacity-50 w-3.5 shrink-0">{idx + 1}.</span>
                      <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      <span className="text-[10px] opacity-60 font-medium">{p.pageCount}p</span>
                      {p.annotations.length > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
                      )}
                      {onDeletePaper && (
                        <button
                          type="button"
                          title={`Delete ${p.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePaper(idx);
                          }}
                          className="opacity-0 group-hover/paper:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: View & Zoom with Invert in same row */}
        {currentPaper && (
          <div>
            <div className="flex items-center gap-1.5">
              {/* Zoom Controls */}
              <div className="flex-1 flex items-center justify-between bg-slate-100 dark:bg-[#171717] rounded-xl p-1 border border-slate-200 dark:border-zinc-800 text-xs">
                <button
                  title="Zoom Out"
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
                  className="p-1 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-medium text-slate-700 dark:text-zinc-300 text-[11px] px-1">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  title="Zoom In"
                  onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
                  className="p-1 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  title="Fit Width"
                  onClick={() => setScale(() => 1.25)}
                  className="px-1.5 py-0.5 text-[10px] font-semibold rounded text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Fit
                </button>
              </div>

              {/* Invert Button in same row */}
              <button
                title={paperInverted ? 'Switch to Normal White Paper' : 'Invert Paper Colors'}
                onClick={() => setPaperInverted((prev) => !prev)}
                className={`shrink-0 flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  paperInverted
                    ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300 font-semibold shadow-2xs'
                    : 'bg-slate-100 dark:bg-[#171717] border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Invert</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: History & Actions (Undo, Redo, Clear) */}
        {currentPaper && (
          <div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#171717] p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                title="Undo (Ctrl+Z)"
                disabled={!canUndo}
                onClick={onUndo}
                className="py-1.5 flex items-center justify-center gap-1 text-xs rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                title="Redo (Ctrl+Y)"
                disabled={!canRedo}
                onClick={onRedo}
                className="py-1.5 flex items-center justify-center gap-1 text-xs rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>

              <button
                title="Clear Marks on Current Page"
                onClick={onClearPage}
                className="py-1.5 flex items-center justify-center gap-1 text-xs rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: Marks Adding Option (Score Badges) - Above Marking Tools */}
        {currentPaper && (
          <div>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-[#171717] p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              {QUICK_SCORES.map((s) => (
                <button
                  key={s.value}
                  title={s.title}
                  onClick={() => {
                    setActiveTool('score');
                    setActiveScore(s.value);
                  }}
                  className={`py-1 text-xs rounded font-bold transition-all cursor-pointer ${
                    activeTool === 'score' && activeScore === s.value
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#262626] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: Marking Tools */}
        {currentPaper && (
          <div className="space-y-2">

            {/* Primary Tool Buttons Grid (4 tools: Pen, Highlighter, Comment, Eraser) */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-[#171717] p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                title="Grading Pen (P)"
                onClick={() => setActiveTool('pen')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === 'pen'
                    ? 'bg-white dark:bg-[#262626] text-[#2563eb] dark:text-[#60a5fa] font-bold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800'
                }`}
              >
                <PenLine className="w-4 h-4" style={{ color: activeTool === 'pen' ? penColor : undefined }} />
              </button>

              <button
                title="Highlighter (H)"
                onClick={() => setActiveTool('highlighter')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === 'highlighter'
                    ? 'bg-white dark:bg-[#262626] text-amber-500 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800'
                }`}
              >
                <Highlighter className="w-4 h-4" />
              </button>

              <button
                title="Comment (T)"
                onClick={() => setActiveTool('text')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === 'text'
                    ? 'bg-white dark:bg-[#262626] text-[#2563eb] dark:text-[#60a5fa] font-bold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                title="Eraser (E)"
                onClick={() => setActiveTool('eraser')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === 'eraser'
                    ? 'bg-white dark:bg-[#262626] text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            {/* Inline settings when Pen is active */}
            {activeTool === 'pen' && (
              <div className="bg-slate-50 dark:bg-[#171717] rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                {/* Centered Ink Colors without text */}
                <div className="flex items-center justify-center gap-2.5">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      title={c.name}
                      onClick={() => setPenColor(c.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        penColor === c.hex
                          ? 'scale-115 border-slate-900 dark:border-white ring-2 ring-[#2563eb]'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {/* Stroke Width Slider: circle in the bar matches the selected pen color */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    id="stroke-width-slider"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    aria-label="Stroke width"
                    aria-valuetext={`${penWidth} pixels`}
                    style={{
                      accentColor: penColor,
                      '--slider-thumb-color': penColor,
                    } as React.CSSProperties}
                    className="custom-slider flex-1"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-200 w-7 text-right select-none">
                    {penWidth}px
                  </span>
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div
                      className="rounded-full transition-all shrink-0 shadow-2xs"
                      style={{
                        width: `${Math.max(3, Math.min(14, penWidth * 1.5))}px`,
                        height: `${Math.max(3, Math.min(14, penWidth * 1.5))}px`,
                        backgroundColor: penColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inline settings when Highlighter is active */}
            {activeTool === 'highlighter' && (
              <div className="bg-slate-50 dark:bg-[#171717] rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                {/* Centered Highlighter Colors */}
                <div className="flex items-center justify-center gap-2.5">
                  {HIGHLIGHTER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      title={c.name}
                      onClick={() => setHighlighterColor(c.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        highlighterColor === c.hex
                          ? 'scale-115 border-slate-900 dark:border-white ring-2 ring-amber-400'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {/* Highlighter Width Slider: circle in the bar matches the selected highlighter color */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    id="highlighter-width-slider"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={highlighterWidth}
                    onChange={(e) => setHighlighterWidth(Number(e.target.value))}
                    aria-label="Highlighter stroke width"
                    aria-valuetext={`${highlighterWidth} pixels`}
                    style={{
                      accentColor: highlighterColor,
                      '--slider-thumb-color': highlighterColor,
                    } as React.CSSProperties}
                    className="custom-slider flex-1"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-200 w-7 text-right select-none">
                    {highlighterWidth}px
                  </span>
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div
                      className="rounded-full transition-all shrink-0 shadow-2xs"
                      style={{
                        width: `${Math.max(4, Math.min(16, highlighterWidth * 1.6))}px`,
                        height: `${Math.max(4, Math.min(16, highlighterWidth * 1.6))}px`,
                        backgroundColor: highlighterColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inline settings when Comment is active */}
            {activeTool === 'text' && setCommentFontSize && (
              <div className="bg-slate-50 dark:bg-[#171717] rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800">
                {/* Comment Font Size Slider */}
                <div className="flex items-center gap-2">
                  <input
                    id="comment-font-size-slider"
                    type="range"
                    min="10"
                    max="28"
                    step="1"
                    value={commentFontSize}
                    onChange={(e) => setCommentFontSize(Number(e.target.value))}
                    aria-label="Comment font size"
                    aria-valuetext={`${commentFontSize} pixels`}
                    style={{
                      accentColor: '#2563eb',
                      '--slider-thumb-color': '#2563eb',
                    } as React.CSSProperties}
                    className="custom-slider flex-1"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-200 w-7 text-right select-none">
                    {commentFontSize}px
                  </span>
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <span
                      className="font-bold text-[#2563eb] dark:text-[#60a5fa] select-none leading-none"
                      style={{
                        fontSize: `${Math.max(10, Math.min(18, commentFontSize * 0.75))}px`,
                      }}
                    >
                      A
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Inline settings when Eraser is active */}
            {activeTool === 'eraser' && (
              <div className="bg-slate-50 dark:bg-[#171717] rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800">
                {/* Eraser Size Slider */}
                <div className="flex items-center gap-2">
                  <input
                    id="eraser-size-slider"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                    aria-label="Eraser size"
                    aria-valuetext={`${eraserSize} pixels`}
                    style={{
                      accentColor: '#f43f5e',
                      '--slider-thumb-color': '#f43f5e',
                    } as React.CSSProperties}
                    className="custom-slider flex-1"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-200 w-7 text-right select-none">
                    {eraserSize}px
                  </span>
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div
                      className="rounded-full transition-all shrink-0 border-2 border-rose-500 bg-rose-100 dark:bg-rose-950/60"
                      style={{
                        width: `${Math.max(4, Math.min(16, eraserSize * 1.6))}px`,
                        height: `${Math.max(4, Math.min(16, eraserSize * 1.6))}px`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 7: Total Score & Save PDF (at the bottom) */}
        {currentPaper && (
          <div className="mt-auto pt-2 space-y-2">
            <div className="bg-slate-50 dark:bg-[#171717] rounded-xl p-2.5 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Total Score: {totalScore} pts</span>
              </div>

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={onExportCurrent}
                  disabled={isExporting}
                  title="Download Current Graded PDF"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isExporting && exportStatus === '1/1'
                      ? 'Saving...'
                      : 'Save PDF'}
                  </span>
                </button>

                {papers.length > 1 && onExportAllSeparate && (
                  <button
                    onClick={onExportAllSeparate}
                    disabled={isExporting}
                    title="Download All Graded PDFs individually (without zipping)"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Files className="w-3.5 h-3.5" />
                    <span>
                      {isExporting && exportStatus && exportStatus !== '1/1' && exportStatus !== 'Zipping...'
                        ? `Saving (${exportStatus})...`
                        : 'Save All'}
                    </span>
                  </button>
                )}

                {papers.length > 1 && onExportAllZip && (
                  <button
                    onClick={onExportAllZip}
                    disabled={isExporting}
                    title="Download All Papers as ZIP Archive"
                    className="p-2 rounded-lg text-xs font-medium bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
                  >
                    <FolderArchive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Footer */}
      <div className="h-11 shrink-0 px-3 border-t border-[#e2e8f0] dark:border-[#262626] flex items-center justify-between">
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <Keyboard className="w-4 h-4" />
          <span>Shortcuts</span>
        </button>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">100% Private</span>
      </div>

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">

              <div className="flex justify-between">
                <span>Grading Pen</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono font-bold">P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Highlighter</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono font-bold">H</kbd>
              </div>
              <div className="flex justify-between">
                <span>Comment</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono font-bold">T</kbd>
              </div>
              <div className="flex justify-between">
                <span>Eraser</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono font-bold">E</kbd>
              </div>
              <div className="flex justify-between">
                <span>Undo / Redo</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono font-bold">Ctrl+Z / Ctrl+Y</kbd>
              </div>
              <div className="flex justify-between">
                <span>Next / Prev Student</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono font-bold">Alt + ] / [</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
