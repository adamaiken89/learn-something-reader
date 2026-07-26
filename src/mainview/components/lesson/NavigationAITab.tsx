import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AI_SKILLS, type AISkillId } from '../../ai/skills';
import { copyPrompt, stripContentForAI } from '../../ai/utils';
import { useLessonViewStore } from '../../stores/lessonViewStore';

function extractSkillSection(content: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^## ${escaped}\\s*[\\s\\S]*?(?=^## |\\z)`, 'm');
  const match = content.match(regex);
  if (!match) return undefined;
  return match[0].replace(`## ${label}`, '').trim();
}

const ASK_PROMPT = (question: string, context: string) =>
  [
    'You are a helpful tutor. Answer the question based on the lesson content provided.',
    '',
    'Lesson content:',
    context,
    '',
    'Question:',
    question,
  ].join('\n');

export default function NavigationAITab() {
  const { t } = useTranslation();
  const content = useLessonViewStore((s) => s.content);
  const [question, setQuestion] = useState('');
  const [feynmanInput, setFeynmanInput] = useState('');
  const [activeInput, setActiveInput] = useState<'feynman' | null>(null);

  const handleAISkill = async (skill: AISkillId, userExplanation?: string) => {
    const info = AI_SKILLS.find((s) => s.id === skill);
    if (!info) return;
    const hint = content ? extractSkillSection(content, info.label) : undefined;
    const cleaned = content ? stripContentForAI(content) : '';
    const prompt = info.buildPrompt(cleaned, hint, userExplanation);
    void copyPrompt(prompt);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const cleaned = content ? stripContentForAI(content) : '';
    const prompt = ASK_PROMPT(question.trim(), cleaned);
    void copyPrompt(prompt);
    setQuestion('');
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
