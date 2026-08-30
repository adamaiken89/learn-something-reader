import { api } from '../api';
import { logger } from '../logger';
import { showToast } from '../toast';

const AI_MODE_URL = 'https://www.perplexity.ai/search';

/** Fire-and-forget study-session log for AI skill usage (type 'ai_skill'). */
export function logAiSkillUsage(courseID: string, moduleID: string): void {
  api.stats
    .logSession({
      courseID,
      moduleID,
      durationMinutes: 1,
      type: 'ai_skill',
    })
    .catch((err) => {
      logger.warn({ err }, 'Failed to log AI skill session');
    });
}

export async function copyPrompt(prompt: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    showToast.error('toast.clipboardFailed');
    return;
  }
  const url = new URL(AI_MODE_URL);
  const chars = Array.from(prompt).slice(0, 6000).join('');
  url.searchParams.set('q', chars);
  try {
    await api.shell.openExternal(url.toString());
  } catch {
    // browser open failed — prompt still copied
  }
  showToast.success('studyTools.promptCopied');
}

export function stripContentForAI(content: string): string {
  return content
    .replace(/```mermaid[\s\S]*?```/g, '')
    .replace(/^## Drill\s*[\s\S]*?(?=\n## |$)/m, '')
    .replace(/^## (Feynman Explain|Reframe)\s*[\s\S]*?(?=\n## |$)/m, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
