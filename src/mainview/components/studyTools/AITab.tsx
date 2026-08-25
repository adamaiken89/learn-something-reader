import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { textareaVariants } from '@/lib/textarea-styles';

import { copyPrompt } from '../../ai/utils';
import { useLessonViewStore } from '../../stores/lessonViewStore';

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

export default function AITab() {
  const { t } = useTranslation();
  const content = useLessonViewStore((s) => s.content);
  const [question, setQuestion] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;
    const prompt = ASK_PROMPT(question.trim(), content);
    void copyPrompt(prompt);
    setQuestion('');
  };

  return (
    <div className="space-y-3">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t('studyTools.askQuestion')}
        className={textareaVariants({ bg: '800', height: 'md' })}
      />
      <button
        onClick={() => {
          void handleAsk();
        }}
        disabled={!question.trim()}
        className="w-full py-1 text-xs bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40"
      >
        {t('studyTools.ask')}
      </button>
    </div>
  );
}
