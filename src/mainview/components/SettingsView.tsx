import { useState, useEffect } from "react";
import { api } from "../api";
import { useSettingsStore } from "../stores/settingsStore";

interface Props {
  onBack: () => void;
}

export default function SettingsView({ onBack }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const hasApiKey = useSettingsStore((s) => s.hasApiKey);
  const setHasApiKey = useSettingsStore((s) => s.setHasApiKey);

  useEffect(() => {
    api.gemini.hasKey().then((r) => {
      setHasApiKey(r.hasKey);
    });
  }, [setHasApiKey]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    await api.gemini.setKey(apiKey.trim());
    setHasApiKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">← Back</button>
        <h2 className="text-sm font-medium">Settings</h2>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <section className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gemini API Key</h3>
          <p className="text-sm text-gray-400 mb-4">
            Required for the Ask AI feature. Get a free key at{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" className="text-indigo-400 hover:underline" rel="noreferrer">
              Google AI Studio
            </a>
            .
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? "API key set (enter new key to change)" : "Enter your Gemini API key"}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500"
            />
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
          {hasApiKey && !saved && (
            <p className="text-xs text-emerald-400 mt-2">✓ API key is configured</p>
          )}
        </section>

        <section className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">About</h3>
          <p className="text-sm text-gray-400">CourseReader v1.0</p>
          <p className="text-sm text-gray-400">macOS desktop study app with spaced repetition.</p>
        </section>
      </main>
    </div>
  );
}
