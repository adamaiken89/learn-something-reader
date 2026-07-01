import { useTranslation } from 'react-i18next';

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
        className="w-full bg-gray-800 border border-gray-600 rounded text-xs p-2 text-gray-200 placeholder-gray-500 resize-none h-20 focus:outline-none focus:border-indigo-500"
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
