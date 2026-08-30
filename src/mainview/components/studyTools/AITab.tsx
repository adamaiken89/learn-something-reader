import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { textareaVariants } from '@/lib/textarea-styles';

import { askPrompt } from '../../ai/skills';
import { copyPrompt, logAiSkillUsage, stripContentForAI } from '../../ai/utils';
import { useLessonViewStore } from '../../stores/lessonViewStore';

export default function AITab() {
  const { t } = useTranslation();
  const content = useLessonViewStore((s) => s.content);
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const [question, setQuestion] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;
    const prompt = askPrompt(question.trim(), content ? stripContentForAI(content) : '');
    if (courseId && moduleId) logAiSkillUsage(courseId, moduleId);
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
