import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Images,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  FileText,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { convertImagesToPdf } from '../utils/imageToPdf';

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export interface ImagesToPdfModalProps {
  isOpen: boolean;
  initialFiles?: File[];
  onClose: () => void;
  onAddPaper: (paper: { name: string; buffer: ArrayBuffer; pageCount: number }) => Promise<void> | void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ImagesToPdfModal: React.FC<ImagesToPdfModalProps> = ({
  isOpen,
  initialFiles = [],
  onClose,
  onAddPaper,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [documentName, setDocumentName] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize modal state when opened
  useEffect(() => {
    if (!isOpen) {
      // Clean up object URLs when modal closes
      setImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        return [];
      });
      setIsConverting(false);
      setProgressText('');
      setDocumentName('');
      return;
    }

    if (initialFiles.length > 0) {
      const items: ImageItem[] = initialFiles.map((file, idx) => ({
        id: `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      }));
      setImages(items);

      // Default document name from the first image without extension
      const defaultName = initialFiles[0].name.replace(/\.[^/.]+$/, '').trim();
      setDocumentName(defaultName || `Submission_${new Date().toISOString().slice(0, 10)}`);
    } else {
      setDocumentName(`Submission_${new Date().toISOString().slice(0, 10)}`);
    }
  }, [isOpen, initialFiles]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConverting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConverting, onClose]);

  const handleAddMoreFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: ImageItem[] = Array.from(files)
      .filter((file) => file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name))
      .map((file, idx) => ({
        id: `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      }));

    setImages((prev) => [...prev, ...newItems]);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index >= images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Drag and drop handlers for manual reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setImages((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, movedItem);
      return updated;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCreatePdf = async () => {
    if (images.length === 0 || !documentName.trim() || isConverting) return;

    setIsConverting(true);
    setProgressText(`Preparing 1 of ${images.length}...`);

    try {
      const filesToConvert = images.map((item) => item.file);
      const pdfBuffer = await convertImagesToPdf(filesToConvert, (curr, total) => {
        setProgressText(`Converting page ${curr} of ${total}...`);
      });

      const cleanName = documentName.trim().replace(/\.pdf$/i, '');
      await onAddPaper({
        name: cleanName,
        buffer: pdfBuffer,
        pageCount: images.length,
      });

      onClose();
    } catch (err) {
      console.error('Failed to convert images to PDF:', err);
      alert('Failed to generate PDF from images. Please ensure files are valid image formats.');
    } finally {
      setIsConverting(false);
      setProgressText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isConverting) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Adding More Images */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleAddMoreFiles(e.target.files);
            if (e.target) e.target.value = '';
          }}
        />

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
              <Images className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                Create PDF from Images
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Arrange images in page order, set a name, and combine into a PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isConverting}
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Document Name & Scrollable Image List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Document Name Field */}
          <div>
            <label
              htmlFor="document-name-input"
              className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1"
            >
              Document Name
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent px-3 py-1.5 transition-all">
              <FileText className="w-4 h-4 text-slate-400 dark:text-zinc-500 mr-2 shrink-0" />
              <input
                id="document-name-input"
                type="text"
                disabled={isConverting}
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g. Student_Exam_Submission"
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
              <span className="text-xs font-mono font-medium text-slate-400 dark:text-zinc-500 select-none">
                .pdf
              </span>
            </div>
          </div>

          {/* Ordered Images List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                Pages ({images.length})
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Drag or use arrows to rearrange
              </span>
            </div>

            {images.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/20 transition-all flex flex-col items-center gap-2"
              >
                <Images className="w-8 h-8 text-slate-400 dark:text-zinc-600" />
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  No images selected
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Click here to select images from your computer
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {images.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={!isConverting}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 rounded-xl border bg-white dark:bg-zinc-800/90 transition-all ${
                      draggedIndex === index
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Drag Handle */}
                    <div
                      title="Drag to reorder"
                      className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 shrink-0"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Page Badge */}
                    <span className="w-6 text-center font-mono text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0 select-none">
                      P.{index + 1}
                    </span>

                    {/* Image Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 shrink-0 flex items-center justify-center">
                      <img
                        src={item.previewUrl}
                        alt={`Page ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Image Name & Size */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        {formatBytes(item.size)}
                      </p>
                    </div>

                    {/* Order Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        title="Move Up"
                        disabled={index === 0 || isConverting}
                        onClick={() => moveUp(index)}
                        className="p-1 rounded text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Move Down"
                        disabled={index === images.length - 1 || isConverting}
                        onClick={() => moveDown(index)}
                        className="p-1 rounded text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Remove Image"
                        disabled={isConverting}
                        onClick={() => removeImage(index)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ml-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add More Images Button */}
            <button
              type="button"
              disabled={isConverting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Images</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {isConverting ? (
              <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{progressText}</span>
              </span>
            ) : (
              <span>
                {images.length} {images.length === 1 ? 'page' : 'pages'} total
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isConverting}
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={images.length === 0 || !documentName.trim() || isConverting}
              onClick={handleCreatePdf}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Create PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
