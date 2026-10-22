import React, { useRef } from 'react';
import { Upload, FileText, ShieldCheck, Zap, FileCheck, Images } from 'lucide-react';

interface EmptyStateProps {
  onUpload: (files: FileList) => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
  onOpenImagesToPdf?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUpload,
  onLoadSample,
  isLoadingSample,
  onOpenImagesToPdf,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
          }
        }}
      />

      <div className="max-w-lg w-full bg-white dark:bg-[#121212] border border-[#e2e8f0] dark:border-[#262626] rounded-2xl p-8 shadow-xl flex flex-col items-center">
        {/* Logo / Badge */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563eb] dark:bg-blue-950/40 dark:text-[#3b82f6] flex items-center justify-center mb-4 shadow-xs">
          <FileText className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f3f4f6] tracking-tight mb-2">
          Future Mark
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#9ca3af] mb-6 leading-relaxed">
          Ultra-minimalist, distraction-free paper marking for teachers. Grade student PDF submissions and image sets directly in your browser with zero latency.
        </p>

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#e2e8f0] dark:border-[#262626] hover:border-[#2563eb] dark:hover:border-[#3b82f6] rounded-xl p-6 cursor-pointer bg-[#f8fafc] dark:bg-[#171717] hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center gap-2 mb-3 group"
        >
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#2563eb] dark:group-hover:text-[#3b82f6] transition-colors" />
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Click to upload student PDFs or images, or drop files here
          </span>
          <span className="text-[11px] text-slate-400">
            Supports single/multiple PDFs & image collections (converted to PDF)
          </span>
        </div>

        {/* Convert Images Shortcut */}
        {onOpenImagesToPdf && (
          <button
            type="button"
            onClick={onOpenImagesToPdf}
            className="flex items-center gap-1.5 text-xs text-[#2563eb] dark:text-[#60a5fa] hover:underline font-semibold mb-4 cursor-pointer"
          >
            <Images className="w-3.5 h-3.5" />
            <span>Convert and combine images to PDF</span>
          </button>
        )}

        {/* Try Sample Button */}
        <button
          onClick={onLoadSample}
          disabled={isLoadingSample}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 mb-6"
        >
          <FileCheck className="w-4 h-4" />
        </button>

        {/* Privacy & Zero-Cost Badges */}
        <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-left">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">100% Private</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Papers never leave your device. No cloud database.</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">Zero Cost</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Free & open source forever. No accounts needed.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
