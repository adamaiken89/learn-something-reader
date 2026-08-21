export type TextFont = 'georgia' | 'charter' | 'iowan' | 'palatino' | 'serif-system' | 'sans';

export type CodeFont = 'sfmono' | 'jetbrains' | 'fira' | 'cascadia' | 'menlo' | 'mono-system';

export const TEXT_FONTS: { id: TextFont; label: string; stack: string }[] = [
  {
    id: 'georgia',
    label: 'Georgia',
    stack: "Georgia, 'Palatino Linotype', 'Book Antiqua', serif",
  },
  {
    id: 'charter',
    label: 'Charter',
    stack: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, serif",
  },
  {
    id: 'iowan',
    label: 'Iowan Old Style',
    stack: "'Iowan Old Style', Palatino, Georgia, serif",
  },
  {
    id: 'palatino',
    label: 'Palatino',
    stack: "Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  },
  {
    id: 'serif-system',
    label: 'System Serif',
    stack: "ui-serif, 'New York', Georgia, serif",
  },
  {
    id: 'sans',
    label: 'Sans',
    stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
];

export const CODE_FONTS: { id: CodeFont; label: string; stack: string }[] = [
  {
    id: 'sfmono',
    label: 'SF Mono',
    stack: "'SF Mono', Menlo, Consolas, monospace",
  },
  {
    id: 'jetbrains',
    label: 'JetBrains Mono',
    stack: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  },
  {
    id: 'fira',
    label: 'Fira Code',
    stack: "'Fira Code', 'Fira Mono', Menlo, monospace",
  },
  {
    id: 'cascadia',
    label: 'Cascadia Code',
    stack: "'Cascadia Code', Consolas, Menlo, monospace",
  },
  {
    id: 'menlo',
    label: 'Menlo',
    stack: "Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  },
  {
    id: 'mono-system',
    label: 'System Mono',
    stack: 'ui-monospace, monospace',
  },
];

const TEXT_STACKS = new Map(TEXT_FONTS.map((f) => [f.id, f.stack]));
const CODE_STACKS = new Map(CODE_FONTS.map((f) => [f.id, f.stack]));

export function isTextFont(v: unknown): v is TextFont {
  return typeof v === 'string' && TEXT_STACKS.has(v as TextFont);
}

export function isCodeFont(v: unknown): v is CodeFont {
  return typeof v === 'string' && CODE_STACKS.has(v as CodeFont);
}

export function textFontStack(id: TextFont): string {
  return TEXT_STACKS.get(id) ?? TEXT_FONTS[0].stack;
}

export function codeFontStack(id: CodeFont): string {
  return CODE_STACKS.get(id) ?? CODE_FONTS[0].stack;
}

export function fontToCSSVars(text: TextFont, code: CodeFont): Record<string, string> {
  return {
    '--book-font-text': textFontStack(text),
    '--book-font-code': codeFontStack(code),
  };
}
