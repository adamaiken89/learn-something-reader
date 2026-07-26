import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { mermaidMockImpl } from '../../testFsShared';
import { setupRPC } from '../testUtils';
import MermaidDiagram from './MermaidDiagram';

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
  fireEvent.click(utils.getByTestId('mermaid-diagram'));
  await waitFor(() => {
    expect(utils.getByText((c) => c.includes('%'))).toBeInTheDocument();
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

  test('opens overlay on diagram click', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);
    expect(utils.getByTestId('mermaid-overlay-svg')).toBeInTheDocument();
  });

  test('zoom in button increases zoom', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);

    const zoomInBtn = Array.from(utils.container.querySelectorAll('button')).find(
      (b) => b.textContent === '+',
    );
    expect(zoomInBtn).toBeTruthy();
    fireEvent.click(zoomInBtn!);

    const zoomText = utils.getByText((c) => c.includes('%'));
    const pct = parseInt(zoomText.textContent || '');
    expect(pct).toBeGreaterThan(100);
  });

  test('zoom out button decreases zoom', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);

    const zoomInBtn = Array.from(utils.container.querySelectorAll('button')).find(
      (b) => b.textContent === '+',
    );
    fireEvent.click(zoomInBtn!);

    const zoomOutBtn = Array.from(utils.container.querySelectorAll('button')).find(
      (b) => b.textContent === '−',
    );
    expect(zoomOutBtn).toBeTruthy();
    fireEvent.click(zoomOutBtn!);

    const zoomText = utils.getByText((c) => c.includes('%'));
    const pct = parseInt(zoomText.textContent || '');
    expect(pct).toBe(150);
  });

  test('reset returns to 1x zoom', async () => {
    const utils = renderDiagram();
    await openOverlay(utils);

    const zoomInBtn = Array.from(utils.container.querySelectorAll('button')).find(
      (b) => b.textContent === '+',
    );
    fireEvent.click(zoomInBtn!);

    const resetBtn = Array.from(utils.container.querySelectorAll('button')).find(
      (b) => b.textContent?.toLowerCase() === 'reset',
    );
    expect(resetBtn).toBeTruthy();
    fireEvent.click(resetBtn!);

    const zoomText = utils.getByText((c) => c.includes('%'));
    const pct = parseInt(zoomText.textContent || '');
    expect(pct).toBe(100);
  });
});
