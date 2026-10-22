import { useState, useEffect, useCallback, useMemo } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { get, set, del } from 'idb-keyval';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import { pdfjsLib } from './utils/pdfWorker';
import { exportGradedPdf } from './utils/pdfExport';
import { createSampleExamPdf } from './utils/samplePdf';
import type { StudentPaper, Annotation, ToolType, StampType } from './types';
import { Sidebar } from './components/Sidebar';
import { PdfPageView } from './components/PdfPageView';
import { EmptyState } from './components/EmptyState';
import { ConfirmModal } from './components/ConfirmModal';
import { ImagesToPdfModal } from './components/ImagesToPdfModal';

export function App() {
  const [papers, setPapers] = useState<StudentPaper[]>([]);
  const [activePaperIndex, setActivePaperIndex] = useState<number>(0);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

  // Tools & Viewport State
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [penColor, setPenColor] = useState<string>('#dc2626'); // Teacher red
  const [penWidth, setPenWidth] = useState<number>(2);
  const [activeStamp, setActiveStamp] = useState<StampType>('check');
  const [activeScore, setActiveScore] = useState<number>(2);
  const [highlighterColor, setHighlighterColor] = useState<string>('#facc15');
  const [highlighterWidth, setHighlighterWidth] = useState<number>(3);
  const [eraserSize, setEraserSize] = useState<number>(3);
  const [commentFontSize, setCommentFontSize] = useState<number>(14);

  const [scale, setScale] = useState<number>(1.25);
  const [paperInverted, setPaperInverted] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('futuremark-theme') || localStorage.getItem('openmark-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const [imagesToPdfModal, setImagesToPdfModal] = useState<{
    isOpen: boolean;
    initialFiles: File[];
  }>({
    isOpen: false,
    initialFiles: [],
  });

  // Restore session from IndexedDB on initial load
  useEffect(() => {
    get<StudentPaper[]>('futuremark-saved-papers')
      .then((saved) => {
        if (saved && Array.isArray(saved) && saved.length > 0) {
          setPapers(saved);
          setActivePaperIndex(0);
        } else {
          // Check fallback legacy key
          get<StudentPaper[]>('openmark-saved-papers').then((legacySaved) => {
            if (legacySaved && Array.isArray(legacySaved) && legacySaved.length > 0) {
              setPapers(legacySaved);
              setActivePaperIndex(0);
            }
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // Autosave papers and annotations to IndexedDB
  useEffect(() => {
    if (papers.length > 0) {
      set('futuremark-saved-papers', papers).catch(() => {});
    } else {
      del('futuremark-saved-papers').catch(() => {});
      del('openmark-saved-papers').catch(() => {});
    }
  }, [papers]);

  // Synchronize documentElement class and meta color-scheme whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute('content', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('futuremark-theme', next);
      } catch {}
      return next;
    });
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Active Paper
  const activePaper = papers[activePaperIndex] || null;

  // Load PDF Document with PDF.js whenever activePaper changes
  useEffect(() => {
    let isCancelled = false;
    if (!activePaper || !activePaper.fileBuffer) {
      setPdfDoc(null);
      return;
    }

    const loadDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: activePaper.fileBuffer.slice(0),
        });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
        }
      } catch (err) {
        console.error('Failed to load PDF in PDF.js:', err);
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
    };
  }, [activePaper?.fileBuffer, activePaper?.id]);

  // Total calculated score across all pages for the current paper
  const totalScore = useMemo(() => {
    if (!activePaper) return 0;
    const raw = activePaper.annotations
      .filter((a): a is Annotation & { type: 'score' } => a.type === 'score')
      .reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(raw * 100) / 100;
  }, [activePaper]);

  // Undo / Redo checks
  const canUndo = (activePaper?.undoStack.length || 0) > 0;
  const canRedo = (activePaper?.redoStack.length || 0) > 0;

  // Annotation Mutations
  const updateCurrentPaperAnnotations = useCallback(
    (newAnnotations: Annotation[], isUndoRedoAction = false) => {
      setPapers((prev) => {
        const copy = [...prev];
        const paper = copy[activePaperIndex];
        if (!paper) return prev;

        const currentAnnotations = paper.annotations;

        copy[activePaperIndex] = {
          ...paper,
          annotations: newAnnotations,
          undoStack: isUndoRedoAction
            ? paper.undoStack
            : [...paper.undoStack, currentAnnotations],
          redoStack: isUndoRedoAction ? paper.redoStack : [],
        };
        return copy;
      });
    },
    [activePaperIndex]
  );

  const handleAddAnnotation = useCallback(
    (ann: Annotation) => {
      if (!activePaper) return;
      updateCurrentPaperAnnotations([...activePaper.annotations, ann]);
    },
    [activePaper, updateCurrentPaperAnnotations]
  );

  const handleDeleteAnnotation = useCallback(
    (id: string) => {
      if (!activePaper) return;
      updateCurrentPaperAnnotations(activePaper.annotations.filter((a) => a.id !== id));
    },
    [activePaper, updateCurrentPaperAnnotations]
  );

  const handleUpdateAnnotation = useCallback(
    (updated: Annotation) => {
      if (!activePaper) return;
      updateCurrentPaperAnnotations(
        activePaper.annotations.map((a) => (a.id === updated.id ? updated : a))
      );
    },
    [activePaper, updateCurrentPaperAnnotations]
  );

  const handleUndo = useCallback(() => {
    if (!activePaper || activePaper.undoStack.length === 0) return;
    const prevSnapshot = activePaper.undoStack[activePaper.undoStack.length - 1];
    const newUndoStack = activePaper.undoStack.slice(0, -1);
    const newRedoStack = [...activePaper.redoStack, activePaper.annotations];

    setPapers((prev) => {
      const copy = [...prev];
      copy[activePaperIndex] = {
        ...copy[activePaperIndex],
        annotations: prevSnapshot,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      };
      return copy;
    });
  }, [activePaper, activePaperIndex]);

  const handleRedo = useCallback(() => {
    if (!activePaper || activePaper.redoStack.length === 0) return;
    const nextSnapshot = activePaper.redoStack[activePaper.redoStack.length - 1];
    const newRedoStack = activePaper.redoStack.slice(0, -1);
    const newUndoStack = [...activePaper.undoStack, activePaper.annotations];

    setPapers((prev) => {
      const copy = [...prev];
      copy[activePaperIndex] = {
        ...copy[activePaperIndex],
        annotations: nextSnapshot,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      };
      return copy;
    });
  }, [activePaper, activePaperIndex]);

  const handleClearPage = useCallback(() => {
    if (!activePaper) return;
    if (activePaper.annotations.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Clear Markings',
      message: `Are you sure you want to clear all markings on "${activePaper.name}"? This action cannot be undone.`,
      confirmLabel: 'Clear All Marks',
      variant: 'danger',
      onConfirm: () => {
        updateCurrentPaperAnnotations([]);
      },
    });
  }, [activePaper, updateCurrentPaperAnnotations]);

  const handleDeletePaper = useCallback((index: number) => {
    const paperToDelete = papers[index];
    if (!paperToDelete) return;

    const hasAnnotations = paperToDelete.annotations.length > 0;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Document',
      message: hasAnnotations
        ? `Are you sure you want to delete "${paperToDelete.name}"? All grading marks on this paper will be permanently lost.`
        : `Are you sure you want to remove "${paperToDelete.name}" from your papers?`,
      confirmLabel: 'Delete PDF',
      variant: 'danger',
      onConfirm: () => {
        setPapers((prev) => {
          const next = prev.filter((_, idx) => idx !== index);
          if (next.length === 0) {
            setActivePaperIndex(0);
            setPdfDoc(null);
            del('futuremark-saved-papers').catch(() => {});
            del('openmark-saved-papers').catch(() => {});
          } else {
            setActivePaperIndex((curr) => {
              if (curr >= next.length) {
                return next.length - 1;
              }
              if (index < curr) {
                return curr - 1;
              }
              return curr;
            });
          }
          return next;
        });
      },
    });
  }, [papers]);

  const handleClearAllPapers = useCallback(() => {
    if (papers.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete All PDFs',
      message: `Are you sure you want to delete all ${papers.length} PDF papers? All grading progress across all submissions will be cleared.`,
      confirmLabel: 'Delete All',
      variant: 'danger',
      onConfirm: () => {
        setPapers([]);
        setActivePaperIndex(0);
        setPdfDoc(null);
        del('futuremark-saved-papers').catch(() => {});
        del('openmark-saved-papers').catch(() => {});
      },
    });
  }, [papers.length]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a textarea or input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (key === 'p') {
        setActiveTool('pen');
      } else if (key === 'h') {
        setActiveTool('highlighter');
      } else if (key === 'e') {
        setActiveTool('eraser');
      } else if (key === 't') {
        setActiveTool('text');
      }

      // Alt + ] / [ for student navigation
      if (e.altKey && e.key === ']') {
        setActivePaperIndex((idx) => Math.min(papers.length - 1, idx + 1));
      } else if (e.altKey && e.key === '[') {
        setActivePaperIndex((idx) => Math.max(0, idx - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, papers.length]);

  // Upload Files Handler (PDFs and/or Images)
  const handleUploadPapers = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const pdfFiles = fileArray.filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    const imageFiles = fileArray.filter(
      (file) =>
        file.type.startsWith('image/') ||
        /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name)
    );

    // Process PDF files
    if (pdfFiles.length > 0) {
      const newPapers: StudentPaper[] = [];
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const buffer = await file.arrayBuffer();
        try {
          const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
          newPapers.push({
            id: `paper_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name.replace(/\.pdf$/i, ''),
            fileBuffer: buffer,
            pageCount: doc.numPages,
            annotations: [],
            undoStack: [],
            redoStack: [],
            status: 'grading',
          });
        } catch (err) {
          console.error('Error reading PDF page count:', err);
        }
      }

      if (newPapers.length > 0) {
        setPapers((prev) => [...prev, ...newPapers]);
        if (papers.length === 0) {
          setActivePaperIndex(0);
        }
      }
    }

    // Process image files: open Images to PDF modal with these files preloaded
    if (imageFiles.length > 0) {
      setImagesToPdfModal({
        isOpen: true,
        initialFiles: imageFiles,
      });
    }
  };

  // Add Paper Generated from Images
  const handleAddPaperFromImages = (newPaperData: {
    name: string;
    buffer: ArrayBuffer;
    pageCount: number;
  }) => {
    const newPaper: StudentPaper = {
      id: `paper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newPaperData.name,
      fileBuffer: newPaperData.buffer,
      pageCount: newPaperData.pageCount,
      annotations: [],
      undoStack: [],
      redoStack: [],
      status: 'grading',
    };

    setPapers((prev) => {
      const updated = [...prev, newPaper];
      setActivePaperIndex(updated.length - 1);
      return updated;
    });
  };

  // Load Demo Sample Exam
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const buffer = await createSampleExamPdf();
      const samplePaper: StudentPaper = {
        id: `sample_exam_${Date.now()}`,
        name: 'Alex_Morgan_Midterm_Exam',
        fileBuffer: buffer,
        pageCount: 2,
        annotations: [],
        undoStack: [],
        redoStack: [],
        status: 'grading',
      };
      setPapers([samplePaper]);
      setActivePaperIndex(0);
    } catch (err) {
      console.error('Failed to create sample PDF:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Export Current Graded PDF
  const handleExportCurrent = async () => {
    if (!activePaper) return;
    setIsExporting(true);
    setExportStatus('1/1');
    try {
      const pdfBytes = await exportGradedPdf(activePaper);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      saveAs(blob, `${activePaper.name}_Graded.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export graded PDF. Please check console for details.');
    } finally {
      setIsExporting(false);
      setExportStatus(null);
    }
  };

  // Export / Download All Graded PDFs individually (without zipping)
  const handleExportAllSeparate = async () => {
    if (papers.length === 0) return;
    setIsExporting(true);
    try {
      for (let i = 0; i < papers.length; i++) {
        setExportStatus(`${i + 1}/${papers.length}`);
        const p = papers[i];
        const bytes = await exportGradedPdf(p);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        saveAs(blob, `${p.name}_Graded.pdf`);
        // Small delay between downloads so the browser doesn't block concurrent downloads
        if (i < papers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    } catch (err) {
      console.error('Failed to export all PDFs:', err);
      alert('Failed to download all PDFs. Please check console for details.');
    } finally {
      setIsExporting(false);
      setExportStatus(null);
    }
  };

  // Export All Graded PDFs in a ZIP archive
  const handleExportAllZip = async () => {
    if (papers.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < papers.length; i++) {
        setExportStatus(`${i + 1}/${papers.length}`);
        const p = papers[i];
        const bytes = await exportGradedPdf(p);
        zip.file(`${p.name}_Graded.pdf`, bytes);
      }
      setExportStatus('Zipping...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'All_Graded_Student_Papers.zip');
    } catch (err) {
      console.error('Failed to export ZIP:', err);
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsExporting(false);
      setExportStatus(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0a0a0a] text-[#0f172a] dark:text-[#f3f4f6] font-sans">
      {/* Left Side Menu (Uncollapsed by default, contains all controls) */}
      <Sidebar
        papers={papers}
        activePaperIndex={activePaperIndex}
        onSelectPaper={setActivePaperIndex}
        onUploadPapers={handleUploadPapers}
        scale={scale}
        setScale={setScale}
        paperInverted={paperInverted}
        setPaperInverted={setPaperInverted}
        theme={theme}
        onToggleTheme={toggleTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onExportCurrent={handleExportCurrent}
        onExportAllZip={handleExportAllZip}
        onExportAllSeparate={handleExportAllSeparate}
        exportStatus={exportStatus}
        totalScore={totalScore}
        isExporting={isExporting}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        penColor={penColor}
        setPenColor={setPenColor}
        penWidth={penWidth}
        setPenWidth={setPenWidth}
        highlighterWidth={highlighterWidth}
        setHighlighterWidth={setHighlighterWidth}
        eraserSize={eraserSize}
        setEraserSize={setEraserSize}
        activeStamp={activeStamp}
        setActiveStamp={setActiveStamp}
        activeScore={activeScore}
        setActiveScore={setActiveScore}
        highlighterColor={highlighterColor}
        setHighlighterColor={setHighlighterColor}
        commentFontSize={commentFontSize}
        setCommentFontSize={setCommentFontSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearPage={handleClearPage}
        onDeletePaper={handleDeletePaper}
        onClearAllPapers={handleClearAllPapers}
        onOpenImagesToPdf={() => setImagesToPdfModal({ isOpen: true, initialFiles: [] })}
      />

      {/* Right Viewport (PDF Pages or Welcome Screen) */}
      <main className="flex-1 overflow-auto bg-[#f1f5f9] dark:bg-[#0a0a0a] p-6 flex flex-col items-center relative">
        {!activePaper ? (
          <EmptyState
            onUpload={handleUploadPapers}
            onLoadSample={handleLoadSample}
            isLoadingSample={isLoadingSample}
            onOpenImagesToPdf={() => setImagesToPdfModal({ isOpen: true, initialFiles: [] })}
          />
        ) : (
          <div className="flex flex-col items-center min-w-full pb-16">
            {pdfDoc &&
              Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfPageView
                  key={`${activePaper.id}_p${pageNum}`}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  scale={scale}
                  paperInverted={paperInverted}
                  annotations={activePaper.annotations}
                  activeTool={activeTool}
                  penColor={penColor}
                  penWidth={penWidth}
                  highlighterWidth={highlighterWidth}
                  eraserSize={eraserSize}
                  commentFontSize={commentFontSize}
                  activeStamp={activeStamp}
                  activeScore={activeScore}
                  highlighterColor={highlighterColor}
                  onAddAnnotation={handleAddAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                />
              ))}
          </div>
        )}
      </main>

      {/* Modern Custom Confirmation Modal for Clear and Delete actions */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Convert Images to Multi-page PDF Modal */}
      {imagesToPdfModal.isOpen && (
        <ImagesToPdfModal
          isOpen={imagesToPdfModal.isOpen}
          initialFiles={imagesToPdfModal.initialFiles}
          onClose={() => setImagesToPdfModal({ isOpen: false, initialFiles: [] })}
          onAddPaper={handleAddPaperFromImages}
        />
      )}
    </div>
  );
}

export default App;
