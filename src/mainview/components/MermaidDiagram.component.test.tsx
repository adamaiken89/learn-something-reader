import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { mermaidMockImpl } from '../../testFsShared';
import MermaidDiagram from './MermaidDiagram';

describe('MermaidDiagram', () => {
  beforeEach(() => {
    mermaidMockImpl.render = (..._args: unknown[]) => Promise.resolve({ svg: '<svg>mock</svg>' });
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
});
