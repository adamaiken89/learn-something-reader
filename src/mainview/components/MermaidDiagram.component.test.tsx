import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { mermaidMockImpl } from '../../testFsShared';
import { setupRPC } from '../testUtils';
import MermaidDiagram from './MermaidDiagram';
import { computeHome, computeWidthHome, INLINE_MAX_ZOOM, parseMinFontSize } from './MermaidOverlay';

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

    fireEvent.click(utils.getByTestId('mermaid-zoom-in'));

    const pct = parseInt(utils.getByTestId('mermaid-zoom-pct').textContent || '');
    expect(pct).toBeGreaterThan(100);
  });

  test('inline zoom out button decreases zoom', async () => {
    const utils = renderDiagram();
    await waitForSvg(utils);

    fireEvent.click(utils.getByTestId('mermaid-zoom-in'));
    fireEvent.click(utils.getByTestId('mermaid-zoom-out'));

    const pct = parseInt(utils.getByTestId('mermaid-zoom-pct').textContent || '');
    expect(pct).toBe(100);
  });

  test('inline reset returns to 1x zoom', async () => {
    const utils = renderDiagram();
    await waitForSvg(utils);

    fireEvent.click(utils.getByTestId('mermaid-zoom-in'));
    fireEvent.click(utils.getByTestId('mermaid-reset'));

    const pct = parseInt(utils.getByTestId('mermaid-zoom-pct').textContent || '');
    expect(pct).toBe(100);
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

  test('parseMinFontSize detects smallest text size', () => {
    const svg =
      '<svg><text style="font-size: 16px">A</text><text font-size="12">B</text><text style="font-size: 14px">C</text></svg>';
    expect(parseMinFontSize(svg)).toBe(12);
    expect(parseMinFontSize('<svg><text>A</text></svg>')).toBeNull();
  });

  test('home zoom boosts when fit makes text too small', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 2000, h: 1600 }, 10);
    expect(home.zoom).toBeCloseTo(1.2);
  });

  test('home zoom keeps fit when text already legible', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 2000, h: 1600 }, 16);
    expect(home.zoom).toBeCloseTo(0.75);
  });

  test('home zoom stays 1 for small diagrams', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 400, h: 300 }, 16);
    expect(home.zoom).toBe(1);
  });

  test('home zoom caps at MAX_LEGIBLE_ZOOM', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 2000, h: 1600 }, 5);
    expect(home.zoom).toBe(2);
  });

  test('computeHome with bbox centers content midpoint', () => {
    const home = computeHome({ w: 1000, h: 800 }, { w: 1200, h: 600 }, null, {
      x: 100,
      y: 50,
      w: 800,
      h: 400,
    });
    expect(home.zoom).toBe(1);
    expect(home.pan.x).toBeCloseTo(-24);
    expect(home.pan.y).toBeCloseTo(126);
  });

  test('computeWidthHome fills container width', () => {
    const home = computeWidthHome(1000, { x: 0, y: 0, w: 900, h: 300 });
    expect(home.zoom).toBeCloseTo(952 / 900);
    expect(home.pan.x).toBeCloseTo(24);
    expect(home.pan.y).toBe(0);
  });

  test('computeWidthHome boosts zoom for tiny text', () => {
    const home = computeWidthHome(1000, { x: 0, y: 0, w: 2000, h: 400 }, 5);
    expect(home.zoom).toBeCloseTo(12 / 5);
  });

  test('computeWidthHome caps at INLINE_MAX_ZOOM', () => {
    const home = computeWidthHome(1000, { x: 0, y: 0, w: 100, h: 50 });
    expect(home.zoom).toBe(INLINE_MAX_ZOOM);
  });

  test('computeWidthHome guards zero-width viewport', () => {
    const home = computeWidthHome(0, { x: 0, y: 0, w: 900, h: 300 });
    expect(home.zoom).toBe(1);
    expect(home.pan).toEqual({ x: 0, y: 0 });
  });

  test('computeWidthHome offsets pan by content y', () => {
    const home = computeWidthHome(1000, { x: 0, y: 50, w: 950, h: 300 });
    expect(home.pan.y).toBeCloseTo(-50 * home.zoom);
  });
});
