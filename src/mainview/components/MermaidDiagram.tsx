import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

let counter = 0;

interface Props {
  code: string;
  isDark?: boolean;
  bg?: string;
}

export default function MermaidDiagram({ code, isDark, bg }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const id = `mermaid-${++counter}`;
    let cancelled = false;
    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [code, isDark]);

  if (error)
    return (
      <pre className="mermaid-error" data-testid="mermaid-error">
        {error}
      </pre>
    );
  if (!svg)
    return (
      <div className="mermaid-loading" data-testid="mermaid-loading">
        Loading diagram...
      </div>
    );
  return (
    <>
      <div
        ref={ref}
        className="mermaid-diagram"
        data-testid="mermaid-diagram"
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={() => setShowOverlay(true)}
      />
      {showOverlay && <MermaidOverlay svg={svg} bg={bg} onClose={() => setShowOverlay(false)} />}
    </>
  );
}

function MermaidOverlay({ svg, bg, onClose }: { svg: string; bg?: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Auto-fit: measure SVG natural width vs container, set zoom to fit
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const match = svg.match(/width="([^"]+)"/);
    if (!match) return;

    const raw = match[1];
    let svgWidth: number;
    if (raw.endsWith('px')) {
      svgWidth = parseFloat(raw);
    } else if (raw.endsWith('em') || raw.endsWith('rem')) {
      svgWidth = parseFloat(raw) * 16;
    } else {
      svgWidth = parseFloat(raw);
    }

    if (isNaN(svgWidth) || svgWidth <= 0) return;

    requestAnimationFrame(() => {
      const containerWidth = container.clientWidth - 48; // minus padding
      if (containerWidth > 0) {
        const fit = containerWidth / svgWidth;
        setZoom(Math.max(0.25, Math.min(3, fit)));
      }
    });
  }, [svg]);

  const handleDownload = async () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth * 2;
      canvas.height = img.naturalHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = bg || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'mermaid-diagram.png';
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300 shrink-0">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
          >
            −
          </button>
          <span className="w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
          >
            Reset
          </button>
          <div className="flex-1" />
          <button
            onClick={() => void handleDownload()}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
          >
            PNG
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div
          ref={contentRef}
          className="overflow-auto flex-1 bg-gray-900 flex items-center justify-center p-10"
        >
          <div
            className="mermaid-diagram"
            style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    </div>
  );
}
