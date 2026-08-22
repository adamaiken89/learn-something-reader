import { Maximize2, Scan, ZoomIn } from 'lucide-react';
import mermaid from 'mermaid';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MermaidOverlay, {
  computeFitHome,
  computeWidthHome,
  parseMinFontSize,
  parseSvgSize,
} from './MermaidOverlay';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

let counter = 0;

interface Props {
  code: string;
  isDark?: boolean;
}

const TOOLBAR_BTN =
  'px-1.5 py-0.5 rounded text-xs bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white cursor-pointer transition-colors';

const INLINE_MAX_BOX_H = 520;

function getSvgEl(container: HTMLDivElement): SVGSVGElement | null {
  return container.querySelector('svg') as SVGSVGElement | null;
}

function getContentBbox(svgEl: SVGSVGElement) {
  try {
    const bbox = svgEl.getBBox();
    if (bbox.width > 0 && bbox.height > 0) {
      return { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
    }
  } catch {
    return null;
  }
  return null;
}

export default function MermaidDiagram({ code, isDark }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [boxH, setBoxH] = useState<number | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number; offX: number; offY: number } | null>(
    null,
  );
  const [controlsOn, setControlsOn] = useState(false);
  const homeRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  const contentHRef = useRef<number | null>(null);
  const lastContentRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const lastRoWRef = useRef(0);

  const applyView = (nextZoom: number, nextPan: { x: number; y: number }) => {
    setZoom(nextZoom);
    setPan(nextPan);
    if (contentHRef.current != null) {
      setBoxH(Math.min(Math.round(contentHRef.current * nextZoom), INLINE_MAX_BOX_H));
    }
  };

  const rehome = useEffectEvent(() => {
    const container = containerRef.current;
    if (!svg || !container) return;
    const svgEl = getSvgEl(container);
    const vbRect = parseSvgSize(svg);
    if (!svgEl || !vbRect) return;

    const bbox = getContentBbox(svgEl);
    const rect = container.getBoundingClientRect();
    const content = bbox ?? vbRect;
    lastContentRef.current = content;
    lastRoWRef.current = rect.width;
    setDims({
      w: Math.round(vbRect.w),
      h: Math.round(vbRect.h),
      offX: bbox ? vbRect.x - bbox.x : 0,
      offY: bbox ? vbRect.y - bbox.y : 0,
    });
    const home = computeWidthHome(rect.width, content, INLINE_MAX_BOX_H, parseMinFontSize(svg));
    contentHRef.current = vbRect.h;
    homeRef.current = home;
    applyView(home.zoom, home.pan);
  });

  useEffect(() => {
    rehome();
  }, [svg]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (Math.abs(entry.contentRect.width - lastRoWRef.current) < 1) continue;
        rehome();
        break;
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

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

  const applyZoom = (newZoom: number) => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 0;
    const cy = rect ? rect.height / 2 : 0;
    applyView(newZoom, {
      x: cx - (cx - pan.x) * (newZoom / zoom),
      y: cy - (cy - pan.y) * (newZoom / zoom),
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!controlsOn) return;
    e.preventDefault();
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const newZoom = Math.max(0.5, Math.min(5, zoom * Math.exp(-e.deltaY * 0.002)));
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    applyView(newZoom, {
      x: mx - (mx - pan.x) * (newZoom / zoom),
      y: my - (my - pan.y) * (newZoom / zoom),
    });
  };

  const handleReset = () => {
    applyView(homeRef.current.zoom, homeRef.current.pan);
  };

  const handleFit = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const content = lastContentRef.current;
    if (!rect || !content) return;
    const fit = computeFitHome(
      { w: rect.width, h: Math.min(rect.height, INLINE_MAX_BOX_H) },
      content,
    );
    applyView(fit.zoom, fit.pan);
  };

  if (error)
    return (
      <pre className="mermaid-error" data-testid="mermaid-error">
        {error}
      </pre>
    );
  if (!svg)
    return (
      <div className="mermaid-loading" data-testid="mermaid-loading">
        {t('mermaid.loading')}
      </div>
    );

  return (
    <>
      <div className="relative group">
        <div
          ref={containerRef}
          className="mermaid-diagram mermaid-inline overflow-x-auto"
          data-testid="mermaid-diagram"
          style={{ height: boxH != null ? `${boxH}px` : undefined }}
          onWheel={handleWheel}
        >
          <div
            data-testid="mermaid-inline-svg"
            style={{
              position: 'relative',
              width: dims ? `${dims.w}px` : undefined,
              height: dims ? `${dims.h}px` : undefined,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: dims ? `${dims.offX}px` : 0,
                top: dims ? `${dims.offY}px` : 0,
                width: dims ? `${dims.w}px` : '100%',
                height: dims ? `${dims.h}px` : 'auto',
                lineHeight: 0,
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {controlsOn && (
            <>
              <button
                onClick={() => applyZoom(Math.min(5, zoom * 1.25))}
                className={TOOLBAR_BTN}
                title={t('mermaid.zoomIn')}
                data-testid="mermaid-zoom-in"
              >
                +
              </button>
              <span
                className="text-xs text-gray-400 w-10 text-center"
                data-testid="mermaid-zoom-pct"
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => applyZoom(Math.max(0.5, zoom / 1.25))}
                className={TOOLBAR_BTN}
                title={t('mermaid.zoomOut')}
                data-testid="mermaid-zoom-out"
              >
                −
              </button>
              <button
                onClick={handleReset}
                className={TOOLBAR_BTN}
                title="1:1"
                data-testid="mermaid-reset"
              >
                1:1
              </button>
              <button
                onClick={handleFit}
                className={TOOLBAR_BTN}
                title={t('mermaid.fit')}
                data-testid="mermaid-fit"
              >
                <Scan size={12} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowOverlay(true)}
            className={TOOLBAR_BTN}
            title={t('mermaid.fullscreen')}
            data-testid="mermaid-fullscreen"
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={() => setControlsOn((v) => !v)}
            aria-pressed={controlsOn}
            className={`${TOOLBAR_BTN} ${controlsOn ? 'text-indigo-300' : ''}`}
            title={t('mermaid.zoomToggle')}
            data-testid="mermaid-controls-toggle"
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>
      {showOverlay && <MermaidOverlay svg={svg} onClose={() => setShowOverlay(false)} />}
    </>
  );
}
