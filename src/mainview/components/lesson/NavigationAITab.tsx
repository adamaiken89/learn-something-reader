import { ClipboardPaste, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AI_SKILLS,
  type AISkillId,
  askPrompt,
  drillToYaml,
  parseDrillOutput,
} from '../../ai/skills';
import { copyPrompt, logAiSkillUsage, stripContentForAI } from '../../ai/utils';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { showToast } from '../../toast';

function extractSkillSection(content: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^## ${escaped}\\s*[\\s\\S]*?(?=^## |\\z)`, 'm');
  const match = content.match(regex);
  if (!match) return undefined;
  return match[0].replace(`## ${label}`, '').trim();
}

export default function NavigationAITab() {
  const { t } = useTranslation();
  const content = useLessonViewStore((s) => s.content);
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const [question, setQuestion] = useState('');
  const [feynmanInput, setFeynmanInput] = useState('');
  const [activeInput, setActiveInput] = useState<'feynman' | 'import' | null>(null);
  const [drillPaste, setDrillPaste] = useState('');

  const handleAISkill = async (skill: AISkillId, userExplanation?: string) => {
    const info = AI_SKILLS.find((s) => s.id === skill);
    if (!info) return;
    const hint = content ? extractSkillSection(content, info.label) : undefined;
    const cleaned = content ? stripContentForAI(content) : '';
    const prompt = info.buildPrompt(cleaned, hint, userExplanation);
    if (courseId && moduleId) logAiSkillUsage(courseId, moduleId);
    void copyPrompt(prompt);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const cleaned = content ? stripContentForAI(content) : '';
    const prompt = askPrompt(question.trim(), cleaned);
    if (courseId && moduleId) logAiSkillUsage(courseId, moduleId);
    void copyPrompt(prompt);
    setQuestion('');
  };

  const parsedDrill = drillPaste.trim() ? parseDrillOutput(drillPaste) : null;

  const handleCopyYaml = () => {
    if (!parsedDrill || parsedDrill.questions.length === 0) return;
    void navigator.clipboard
      .writeText(drillToYaml(parsedDrill.questions))
      .then(() => showToast.success('studyTools.yamlCopied'))
      .catch(() => showToast.error('toast.clipboardFailed'));
  };

  const handleFeynmanSend = () => {
    void handleAISkill('feynman', feynmanInput);
    setFeynmanInput('');
    setActiveInput(null);
  };

  return (
    <div className="overflow-y-auto flex-1 p-2.5">
      {activeInput === 'feynman' ? (
        <>
          <div className="mb-2">
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
              {t('studyTools.aiPowerups')} — Feynman Explain
            </span>
          </div>
          <textarea
            value={feynmanInput}
            onChange={(e) => setFeynmanInput(e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-600/50 rounded p-2 text-xs text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500"
            rows={5}
            placeholder="Type your explanation of the key concept in simple terms..."
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={() => setActiveInput(null)}
              className="flex-1 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFeynmanSend}
              disabled={!feynmanInput.trim()}
              className="flex-1 py-1 text-[10px] bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40 transition-colors"
            >
              Send to Perplexity
            </button>
          </div>
        </>
      ) : activeInput === 'import' ? (
        <>
          <div className="mb-2">
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
              {t('studyTools.importQuiz')}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2">{t('studyTools.importQuizHint')}</p>
          <textarea
            value={drillPaste}
            onChange={(e) => setDrillPaste(e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-600/50 rounded p-2 text-xs text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500"
            rows={8}
            placeholder={t('studyTools.importQuizPlaceholder')}
          />
          {parsedDrill && (
            <p className="text-[10px] mt-1.5 text-gray-500">
              {t('studyTools.importQuizPreview', {
                valid: parsedDrill.questions.length,
                invalid: parsedDrill.invalid,
              })}
            </p>
          )}
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={() => {
                setActiveInput(null);
                setDrillPaste('');
              }}
              className="flex-1 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCopyYaml}
              disabled={!parsedDrill || parsedDrill.questions.length === 0}
              className="flex-1 py-1 text-[10px] bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40 transition-colors"
            >
              {t('studyTools.copyYaml')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-3">
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
              {t('studyTools.aiPowerups')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {AI_SKILLS.filter((s) => s.id !== 'drill').map((skill) => (
              <button
                key={skill.id}
                onClick={() => {
                  if (skill.id === 'feynman') {
                    setActiveInput('feynman');
                  } else {
                    void handleAISkill(skill.id);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-full border transition-colors bg-gray-800/60 border-gray-600/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              >
                {skill.label}
                <ExternalLink size={10} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveInput('import')}
            className="w-full mb-3 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] rounded-full border transition-colors bg-gray-800/60 border-gray-600/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            <ClipboardPaste size={10} />
            {t('studyTools.importQuiz')}
          </button>
          <div className="mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {t('studyTools.askAnything')}
            </span>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-600/50 rounded p-2 text-xs text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500"
            rows={3}
            placeholder={t('studyTools.askQuestion')}
          />
          <button
            onClick={() => void handleAsk()}
            disabled={!question.trim()}
            className="mt-1.5 w-full py-1 text-[10px] bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40 transition-colors"
          >
            {t('studyTools.ask')}
          </button>
        </>
      )}
    </div>
  );
}
