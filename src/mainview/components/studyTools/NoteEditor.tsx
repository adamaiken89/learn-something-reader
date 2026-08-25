import { useTranslation } from 'react-i18next';

import { textareaVariants } from '@/lib/textarea-styles';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void | Promise<void>;
  placeholder?: string;
}

export default function NoteEditor({ value, onChange, onSave, placeholder }: NoteEditorProps) {
  const { t } = useTranslation();

  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('studyTools.addNote')}
        className={textareaVariants({ bg: '800', height: 'md' })}
      />
      <button
        onClick={() => void onSave()}
        disabled={!value.trim()}
        className="w-full py-1 text-xs bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40"
      >
        {t('studyTools.saveNote')}
      </button>
    </>
  );
}
