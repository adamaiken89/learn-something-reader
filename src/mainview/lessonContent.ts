export const PERPLEXITY_PLACEHOLDER = '%%PERPLEXITY%%:';

function matchSectionUntilEnd(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const middle = content.match(new RegExp(`^## ${escaped}[\\s\\S]*?(?=\\n## )`, 'm'));
  if (middle) return middle[0];
  const last = content.match(new RegExp(`^## ${escaped}[\\s\\S]*$`, 'm'));
  return last?.[0] ?? '';
}

export function extractSkillSection(content: string, label: string): string | undefined {
  const section = matchSectionUntilEnd(content, label);
  if (!section) return undefined;
  return section.replace(`## ${label}`, '').trim();
}

function removeSection(content: string, heading: string): string {
  let r = content.replace(new RegExp(`^## ${heading}[\\s\\S]*?(?=\\n## )`, 'm'), '');
  r = r.replace(new RegExp(`^## ${heading}[\\s\\S]*$`, 'm'), '');
  return r;
}

function replaceSectionWithPlaceholder(
  content: string,
  heading: string,
  placeholder: string,
): string {
  const section = matchSectionUntilEnd(content, heading);
  if (!section) return content;
  return content.replace(section, section.trimEnd() + '\n\n' + placeholder + '\n');
}

export function processLessonContent(content: string): string {
  let result = removeSection(content, 'Drill');
  result = replaceSectionWithPlaceholder(
    result,
    'Feynman Explain',
    PERPLEXITY_PLACEHOLDER + 'feynman',
  );
  result = replaceSectionWithPlaceholder(result, 'Reframe', PERPLEXITY_PLACEHOLDER + 'reframe');
  return result;
}
