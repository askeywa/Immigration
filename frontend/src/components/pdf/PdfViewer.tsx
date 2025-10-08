// PDF viewer component (loaded on-demand)
import React, { useEffect, useRef, useState } from 'react';

interface PdfViewerProps {
  file: File | string;
  onLoad?: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, onLoad }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker?url');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

        let pdf;
        if (typeof file === 'string') {
          // URL
          pdf = await pdfjsLib.getDocument(file).promise;
        } else {
          // File object
          const arrayBuffer = await file.arrayBuffer();
          pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        }

        // Render first page
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        setLoading(false);
        onLoad?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdf();
  }, [file, onLoad]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load PDF</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-auto border rounded-lg" />
    </div>
  );
};

export default PdfViewer;
