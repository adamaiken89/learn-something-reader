import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { headingId } from '../../bun/lessonMarkdown';
import MermaidDiagram from '../components/MermaidDiagram';
import { useSettingsStore } from '../stores/settingsStore';
import { isThemeDark } from '../themes';

function MermaidCode({ children }: { children?: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const code = typeof children === 'string' ? children : String(children);
  return <MermaidDiagram code={code.replace(/\n$/, '')} isDark={isThemeDark(theme)} />;
}

function CodeBlockWithCopy({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = extractText(children);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group">
      <pre>{children}</pre>
      <button
        onClick={() => void handleCopy()}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-800/80 border border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        {copied ? t('selection.copied') : t('lesson.copy')}
      </button>
    </div>
  );
}

function extractText(children: React.ReactNode): string {
  let text = '';
  const walk = (node: React.ReactNode) => {
    if (typeof node === 'string') text += node;
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object' && 'props' in node) {
      walk((node as { props: { children: React.ReactNode } }).props.children);
    }
  };
  walk(children);
  return text;
}

const headingRenderer = (level: number) =>
  function Heading({ children }: { children?: React.ReactNode }) {
    const text = extractText(children);
    const id = headingId(text);
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
    return <Tag id={id}>{children}</Tag>;
  };

export const components = {
  h1: headingRenderer(1),
  h2: headingRenderer(2),
  h3: headingRenderer(3),
  h4: headingRenderer(4),
  h5: headingRenderer(5),
  h6: headingRenderer(6),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="table-wrapper">
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <CodeBlockWithCopy>{children}</CodeBlockWithCopy>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    if (className?.includes('language-mermaid')) {
      return <MermaidCode>{children}</MermaidCode>;
    }
    return <code className={className}>{children}</code>;
  },
};

export function getTextOffset(
  container: Node,
  range: Range,
): { start: number; end: number } | null {
  try {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let pos = 0;
    let start = -1;
    let end = -1;

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const len = node.length;
      if (node === range.startContainer) start = pos + range.startOffset;
      if (node === range.endContainer) end = pos + range.endOffset;
      pos += len;
      if (start >= 0 && end >= 0) break;
    }

    if (start < 0 || end < 0) return null;
    return { start: Math.min(start, end), end: Math.max(start, end) };
  } catch {
    return null;
  }
}
