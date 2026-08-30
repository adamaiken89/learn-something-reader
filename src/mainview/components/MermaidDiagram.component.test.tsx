import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, spyOn, test } from 'bun:test';

import { mermaidMockImpl } from '../../testFsShared';
import { setupRPC } from '../testUtils';
import MermaidDiagram from './MermaidDiagram';
import {
  computeFitHome,
  computeHome,
  computeWidthHome,
  FIT_VIEW_RATIO,
  parseSvgSize,
} from './MermaidOverlay';

setupRPC();

function renderDiagram() {
  const utils = render(<MermaidDiagram code="graph TD; A-->B;" />);
  return utils;
}

async function waitForSvg(utils: ReturnType<typeof renderDiagram>) {
  await waitFor(async () => {
    expect(await utils.findByTestId('mermaid-diagram')).toBeInTheDocument();
  });
}

async function openOverlay(utils: ReturnType<typeof renderDiagram>) {
  await waitForSvg(utils);
  fireEvent.click(utils.getByTestId('mermaid-fullscreen'));
  await waitFor(() => {
    expect(utils.getByTestId('mermaid-overlay-svg')).toBeInTheDocument();
  });
}

function enableControls(utils: ReturnType<typeof renderDiagram>) {
  fireEvent.click(utils.getByTestId('mermaid-controls-toggle'));
}

describe('MermaidDiagram', () => {
  beforeEach(() => {
    mermaidMockImpl.render = (..._args: unknown[]) =>
      Promise.resolve({ svg: '<svg width="800" height="600">mock</svg>' });
  });

  test('renders loading state', () => {
    mermaidMockImpl.render = () => new Promise(() => {});
    const { getByTestId } = render(<MermaidDiagram code="graph TD; A-->B;" />);
    expect(getByTestId('mermaid-loading')).toBeInTheDocument();
  });

  test('renders SVG on success', async () => {
    const { findByTestId } = render(<MermaidDiagram code="graph TD; A-->B;" />);
    await waitFor(async () => {
      expect(await findByTestId('mermaid-diagram')).toBeInTheDocument();
    });
  });

  test('attaches width-gated ResizeObserver once the svg renders', async () => {
    // Regression: RO used to attach in a []-deps effect that ran while
    // containerRef was still null (loading branch), so rehome on width change
    // (e.g. content-width setting switch) never fired and pan.x kept the old
    // centering gap.
    const observeSpy = spyOn(
      (globalThis as { ResizeObserver: new (cb: unknown) => { observe: unknown } }).ResizeObserver
        .prototype,
      'observe',
    );
    try {
      const utils = renderDiagram();
      await waitForSvg(utils);
      expect(observeSpy).toHaveBeenCalledWith(utils.getByTestId('mermaid-diagram'));
    } finally {
      observeSpy.mockRestore();
    }
  });

  test('renders error on failure', async () => {
    mermaidMockImpl.render = () => Promise.reject(new Error('Parse error'));
    const { findByTestId } = render(<MermaidDiagram code="invalid" />);
    await waitFor(async () => {
      expect(await findByTestId('mermaid-error')).toBeInTheDocument();
    });
  });

  test('inline zoom in button increases zoom', async () => {
    const utils = renderDiagram();
    await waitForSvg(utils);
    enableControls(utils);

    fireEvent.click(utils.getByTestId('mermaid-zoom-in'));

    const pct = parseInt(utils.getByTestId('mermaid-zoom-pct').textContent || '');
    expect(pct).toBeGreaterThan(100);
  });

  test('inline zoom out button decreases zoom', async () => {
    const utils = renderDiagram();
    await waitForSvg(utils);
    enableControls(utils);

    fireEvent.click(utils.getByTestId('mermaid-zoom-in'));
    fireEvent.click(utils.getByTestId('mermaid-zoom-out'));

    const pct = parseInt(utils.getByTestId('mermaid-zoom-pct').textContent || '');
    expect(pct).toBe(100);
  });

  test('inline reset returns to 1x zoom', async () => {
    const utils = renderDiagram();
    await waitForSvg(utils);
    enableControls(utils);

    fireEvent.click(utils.getByTestId('mermaid-zoom-in'));
    fireEvent.click(utils.getByTestId('mermaid-reset'));

    const pct = parseInt(utils.getByTestId('mermaid-zoom-pct').textContent || '');
    expect(pct).toBe(100);
  });

  test('zoom controls hidden until toggled on', async () => {
    const utils = renderDiagram();
    await waitForSvg(utils);
    expect(utils.queryByTestId('mermaid-zoom-in')).toBeNull();
    enableControls(utils);
    expect(utils.getByTestId('mermaid-zoom-in')).toBeInTheDocument();
    enableControls(utils);
    expect(utils.queryByTestId('mermaid-zoom-in')).toBeNull();
  });

  test('opens overlay on expand button click', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);
    expect(utils.getByTestId('mermaid-overlay-svg')).toBeInTheDocument();
  });

  test('overlay zoom in button increases zoom', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);

    fireEvent.click(utils.getByTestId('mermaid-overlay-zoom-in'));

    const pct = parseInt(utils.getByTestId('mermaid-overlay-zoom-pct').textContent || '');
    expect(pct).toBeGreaterThan(100);
  });

  test('overlay zoom out button decreases zoom', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);

    fireEvent.click(utils.getByTestId('mermaid-overlay-zoom-in'));
    fireEvent.click(utils.getByTestId('mermaid-overlay-zoom-out'));

    const pct = parseInt(utils.getByTestId('mermaid-overlay-zoom-pct').textContent || '');
    expect(pct).toBe(100);
  });

  test('overlay reset returns to 1x zoom', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);

    fireEvent.click(utils.getByTestId('mermaid-overlay-zoom-in'));
    fireEvent.click(utils.getByTestId('mermaid-overlay-reset'));

    const pct = parseInt(utils.getByTestId('mermaid-overlay-zoom-pct').textContent || '');
    expect(pct).toBe(100);
  });

  test('backdrop click closes overlay', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);
    fireEvent.click(utils.getByTestId('mermaid-overlay-backdrop'));
    expect(utils.queryByTestId('mermaid-overlay-svg')).toBeNull();
  });

  test('home zoom shrinks to fit oversized diagram', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 1600, h: 1400 });
    expect(home.zoom).toBeCloseTo(752 / 1400);
  });

  test('home zoom stays 1 for small diagrams (never magnifies)', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 400, h: 300 });
    expect(home.zoom).toBe(1);
  });

  test('home zoom floors at 0.5 for extremely large diagrams', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 4000, h: 3200 });
    expect(home.zoom).toBe(0.5);
  });

  test('computeHome with bbox centers content midpoint', () => {
    const home = computeHome(
      { w: 1000, h: 800 },
      { w: 1200, h: 600 },
      {
        x: 100,
        y: 50,
        w: 800,
        h: 400,
      },
    );
    expect(home.zoom).toBe(1);
    expect(home.pan.x).toBeCloseTo(-24);
    expect(home.pan.y).toBeCloseTo(126);
  });

  test('computeWidthHome homes at 100% when diagram fits the column', () => {
    const home = computeWidthHome(1000, { x: 0, y: 0, w: 846, h: 440 });
    expect(home.zoom).toBe(1);
    expect(home.pan.x).toBeCloseTo((952 - 846) / 2);
    expect(home.pan.y).toBe(0);
  });

  test('computeWidthHome never magnifies small diagrams (100% default)', () => {
    const home = computeWidthHome(1000, { x: 0, y: 0, w: 100, h: 50 });
    expect(home.zoom).toBe(1);
    expect(home.pan.x).toBeCloseTo((952 - 100) / 2);
  });

  test('computeWidthHome shrinks wide diagram to fit width', () => {
    const home = computeWidthHome(1000, { x: 0, y: 0, w: 2000, h: 400 });
    expect(home.zoom).toBeCloseTo(952 / 2000);
    expect(home.pan.x).toBe(0);
    expect(home.pan.y).toBe(0);
  });

  test('computeWidthHome guards zero-width viewport', () => {
    const home = computeWidthHome(0, { x: 0, y: 0, w: 900, h: 300 });
    expect(home.zoom).toBe(1);
    expect(home.pan).toEqual({ x: 0, y: 0 });
  });

  test('computeWidthHome ignores height (tall diagram keeps 100% if width fits)', () => {
    const home = computeWidthHome(1000, { x: -450, y: -350, w: 900, h: 2000 });
    expect(home.zoom).toBe(1);
    expect(home.pan.x).toBeCloseTo((952 - 900) / 2);
    expect(home.pan.y).toBe(0);
  });

  test('computeFitHome shrinks oversized diagram to ratio of viewport', () => {
    const home = computeFitHome({ w: 1000, h: 600 }, { x: 0, y: 0, w: 2000, h: 1200 });
    expect(home.zoom).toBeCloseTo((552 / 1200) * FIT_VIEW_RATIO);
    expect(home.pan.x + (0 + 1000) * home.zoom).toBeCloseTo(500);
    expect(home.pan.y + (0 + 600) * home.zoom).toBeCloseTo(300);
  });

  test('computeFitHome centers content with negative origin', () => {
    const home = computeFitHome({ w: 1000, h: 800 }, { x: -450, y: -350, w: 900, h: 700 });
    expect(home.zoom).toBeCloseTo((952 / 900) * FIT_VIEW_RATIO);
    expect(home.pan.x + 0 * home.zoom).toBeCloseTo(500);
    expect(home.pan.y + 0 * home.zoom).toBeCloseTo(400);
  });

  test('computeFitHome guards zero viewport', () => {
    const home = computeFitHome({ w: 0, h: 0 }, { x: 0, y: 0, w: 400, h: 300 });
    expect(home).toEqual({ zoom: 1, pan: { x: 0, y: 0 } });
  });

  test('tall diagram container height tracks diagram height', async () => {
    mermaidMockImpl.render = (..._args: unknown[]) =>
      Promise.resolve({ svg: '<svg viewBox="0 0 400 2000">mock</svg>' });
    const utils = renderDiagram();
    await waitForSvg(utils);

    const container = utils.getByTestId('mermaid-diagram');
    await waitFor(() => {
      expect(container.style.height).toBe('2000px');
    });
  });

  test('overlay re-fits when its box resizes while open', async () => {
    // Regression: overlay computed home once on mount; resizing the modal box
    // (window resize) kept stale zoom/pan — diagram sat off-center with gaps.
    let roCallback: ((entries: unknown[], obs: unknown) => void) | null = null;
    class FakeRO {
      constructor(cb: (entries: unknown[], obs: unknown) => void) {
        roCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    const OrigRO = (globalThis as { ResizeObserver: unknown }).ResizeObserver;
    (globalThis as { ResizeObserver: unknown }).ResizeObserver = FakeRO;
    try {
      const utils = renderDiagram();
      await waitForSvg(utils);
      fireEvent.click(utils.getByTestId('mermaid-fullscreen'));
      await waitFor(() => {
        expect(utils.getByTestId('mermaid-overlay-svg')).toBeInTheDocument();
      });
      const svgWrapper = utils.getByTestId('mermaid-overlay-svg');
      const before = svgWrapper.style.transform;
      expect(before).toContain('scale(');

      // Simulate the modal box growing (window resize while open)
      const content = utils.getByTestId('mermaid-overlay-content');
      const rectSpy = spyOn(content, 'getBoundingClientRect').mockReturnValue({
        width: 2000,
        height: 1200,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 2000,
        bottom: 1200,
        toJSON: () => '',
      } as DOMRect);
      expect(roCallback).toBeTruthy();
      act(() => {
        roCallback!([], null);
      });
      rectSpy.mockRestore();

      const after = svgWrapper.style.transform;
      // Fresh home for a much larger box: still 100% (fit capped at 1), but
      // re-centered for the new width
      expect(after).not.toBe(before);
      expect(after).toContain('scale(1)');
    } finally {
      (globalThis as { ResizeObserver: unknown }).ResizeObserver = OrigRO;
    }
  });

  test('parseSvgSize returns viewBox rect incl origin', () => {
    expect(parseSvgSize('<svg viewBox="-100 -50 400 300">')).toEqual({
      x: -100,
      y: -50,
      w: 400,
      h: 300,
    });
  });

  test('parseSvgSize falls back to width/height attrs at origin 0,0', () => {
    expect(parseSvgSize('<svg width="800" height="600">')).toEqual({
      x: 0,
      y: 0,
      w: 800,
      h: 600,
    });
    expect(parseSvgSize('<svg>no size</svg>')).toBeNull();
  });

  test('negative viewBox origin normalized via margins + wrapper dims', async () => {
    mermaidMockImpl.render = (..._args: unknown[]) =>
      Promise.resolve({ svg: '<svg viewBox="-100 -50 400 300">mock</svg>' });
    const utils = renderDiagram();
    await waitForSvg(utils);

    const wrapper = utils.getByTestId('mermaid-inline-svg');
    await waitFor(() => {
      expect(wrapper.style.width).toBe('400px');
      expect(wrapper.style.height).toBe('300px');
    });
    const frame = wrapper.firstElementChild as HTMLElement;
    expect(frame.style.position).toBe('absolute');
    expect(frame.style.left).toBe('0px');
    expect(frame.style.top).toBe('0px');
    expect(frame.style.width).toBe('400px');
    expect(frame.style.height).toBe('300px');
  });

  test('width/height-attr svg (no viewBox) normalizes at origin 0,0', async () => {
    mermaidMockImpl.render = (..._args: unknown[]) =>
      Promise.resolve({ svg: '<svg width="800" height="600">mock</svg>' });
    const utils = renderDiagram();
    await waitForSvg(utils);

    const wrapper = utils.getByTestId('mermaid-inline-svg');
    await waitFor(() => {
      expect(wrapper.style.width).toBe('800px');
      expect(wrapper.style.height).toBe('600px');
    });
    const frame = wrapper.firstElementChild as HTMLElement;
    expect(frame.style.left).toBe('0px');
    expect(frame.style.top).toBe('0px');
    expect(frame.style.width).toBe('800px');
    expect(frame.style.height).toBe('600px');
  });
});
