import { X } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TOOLBAR_BTN = 'px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer';
const PAD = 48;
const LEGIBLE_PX = 12;
const MAX_LEGIBLE_ZOOM = 2;

interface Home {
  zoom: number;
  pan: { x: number; y: number };
}

export function parseSvgSize(svg: string): { w: number; h: number } | null {
  const vb = svg.match(/viewBox="([^"]+)"/);
  if (vb) {
    const parts = vb[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { w: parts[2], h: parts[3] };
    }
  }
  const w = svg.match(/width="([\d.]+)"/);
  const h = svg.match(/height="([\d.]+)"/);
  if (w && h) return { w: parseFloat(w[1]), h: parseFloat(h[1]) };
  return null;
}

export function parseMinFontSize(svg: string): number | null {
  const sizes: number[] = [];
  const re = /font-size\s*:\s*([\d.]+)px|font-size="([\d.]+)"/g;
  for (const m of svg.matchAll(re)) {
    const v = parseFloat(m[1] ?? m[2]);
    if (v > 0) sizes.push(v);
  }
  return sizes.length > 0 ? Math.min(...sizes) : null;
}

interface ContentBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function computeHome(
  viewport: { w: number; h: number },
  size: { w: number; h: number },
  minFontSize?: number | null,
  bbox?: ContentBox | null,
): Home {
  const availW = viewport.w - PAD;
  const availH = viewport.h - PAD;
  if (availW <= 0 || availH <= 0) return { zoom: 1, pan: { x: 0, y: 0 } };
  const content = bbox ?? { x: 0, y: 0, w: size.w, h: size.h };
  const fit = Math.min(1, availW / content.w, availH / content.h);
  let zoom = fit;
  if (minFontSize && minFontSize > 0) {
    zoom = Math.max(fit, LEGIBLE_PX / minFontSize);
  }
  zoom = Math.max(0.5, Math.min(MAX_LEGIBLE_ZOOM, zoom));
  return {
    zoom,
    pan: {
      x: availW / 2 - (content.x + content.w / 2) * zoom,
      y: availH / 2 - (content.y + content.h / 2) * zoom,
    },
  };
}

export const INLINE_MAX_ZOOM = 3;

export function computeWidthHome(
  viewportW: number,
  content: ContentBox,
  minFontSize?: number | null,
): Home {
  const availW = viewportW - PAD;
  if (availW <= 0 || content.w <= 0 || content.h <= 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  }
  let zoom = availW / content.w;
  if (minFontSize && minFontSize > 0) {
    zoom = Math.max(zoom, LEGIBLE_PX / minFontSize);
  }
  zoom = Math.max(0.5, Math.min(INLINE_MAX_ZOOM, zoom));
  return {
    zoom,
    pan: {
      x: viewportW / 2 - (content.x + content.w / 2) * zoom,
      y: -(content.y * zoom) || 0,
    },
  };
}

interface Props {
  svg: string;
  onClose: () => void;
}

export default function MermaidOverlay({ svg, onClose }: Props) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStart = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const homeRef = useRef<Home>({ zoom: 1, pan: { x: 0, y: 0 } });

  const onEscape = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  });

  useEffect(() => {
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    const rect = contentRef.current?.getBoundingClientRect();
    const size = parseSvgSize(svg);
    if (!rect || !size) {
      const home = { zoom: 1, pan: { x: 0, y: 0 } };
      homeRef.current = home;
      setZoom(home.zoom);
      setPan(home.pan);
      return;
    }
    const svgEl = contentRef.current?.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) {
      svgEl.setAttribute('width', String(size.w));
      svgEl.style.maxWidth = 'none';
    }
    let contentBbox: ContentBox | null = null;
    if (svgEl && typeof svgEl.getBBox === 'function') {
      try {
        const bbox = svgEl.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          contentBbox = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
        }
      } catch {
        contentBbox = null;
      }
    }
    const home = computeHome(
      { w: rect.width, h: rect.height },
      size,
      parseMinFontSize(svg),
      contentBbox,
    );
    homeRef.current = home;
    setZoom(home.zoom);
    setPan(home.pan);
  }, [svg]);

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      setPan({
        x: dragStart.current.panX + (e.clientX - dragStart.current.startX),
        y: dragStart.current.panY + (e.clientY - dragStart.current.startY),
      });
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning]);

  const applyZoomWithCenterAnchor = (newZoom: number) => {
    const rect = contentRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.height / 2 : window.innerHeight / 2;
    setPan({
      x: cx - (cx - pan.x) * (newZoom / zoom),
      y: cy - (cy - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsPanning(true);
    dragStart.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(5, zoom * Math.exp(-e.deltaY * 0.002)));
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setPan({
      x: mx - (mx - pan.x) * (newZoom / zoom),
      y: my - (my - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  const handleReset = () => {
    setZoom(homeRef.current.zoom);
    setPan(homeRef.current.pan);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0 bg-black/60"
        data-testid="mermaid-overlay-backdrop"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300 shrink-0">
          <button
            onClick={() => applyZoomWithCenterAnchor(Math.min(5, zoom * 1.25))}
            className={TOOLBAR_BTN}
            title={t('mermaid.zoomIn')}
            data-testid="mermaid-overlay-zoom-in"
          >
            +
          </button>
          <span className="w-16 text-center" data-testid="mermaid-overlay-zoom-pct">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => applyZoomWithCenterAnchor(Math.max(0.5, zoom / 1.25))}
            className={TOOLBAR_BTN}
            title={t('mermaid.zoomOut')}
            data-testid="mermaid-overlay-zoom-out"
          >
            −
          </button>
          <button onClick={handleReset} className={TOOLBAR_BTN} data-testid="mermaid-overlay-reset">
            {t('mermaid.reset')}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className={TOOLBAR_BTN} data-testid="mermaid-overlay-close">
            <X size={16} />
          </button>
        </div>
        <div
          ref={contentRef}
          className="overflow-hidden flex-1 bg-gray-900"
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          <div
            className="mermaid-diagram"
            data-testid="mermaid-overlay-svg"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    </div>
  );
}
