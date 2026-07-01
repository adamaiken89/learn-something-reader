import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ModuleMeta } from '../../bun/types';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';

interface Props {
  modules: ModuleMeta[];
  currentModuleId: string;
  onSelect: (mod: ModuleMeta) => void;
}

export default function ModuleSwitcher({ modules, currentModuleId, onSelect }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentIdx = modules.findIndex((m) => m.id === currentModuleId);
  const current = modules[currentIdx];
  const showDropdown = useDelayedUnmount(open, 150);

  return (
    <div
      ref={ref}
      className="relative"
      data-testid="module-switcher"
      data-current-module-id={currentModuleId}
    >
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[460px]"
      >
        <span className="truncate">
          {current ? `${String(current.id)} ${current.name}` : t('common.modules')}
        </span>
        <span className={`text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {showDropdown && (
        <div
          className={`absolute top-full left-0 mt-1 min-w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-[60vh] overflow-y-auto p-2 space-y-1.5 ${open ? 'anim-dropdown-in' : 'anim-dropdown-out'}`}
        >
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onSelect(m);
                setOpen(false);
              }}
              className={`w-full text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl p-3 transition-colors group cursor-pointer ${
                m.id === currentModuleId ? 'ring-1 ring-indigo-500/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-900/50 text-indigo-400 text-sm font-bold">
                  {String(m.id)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors break-words">
                    {m.name}
                  </div>
                  {m.timeHours > 0 && <p className="text-xs text-gray-500 mt-1">{m.timeHours}h</p>}
                  {m.topics && m.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.topics.slice(0, 3).map((t, ti) => (
                        <span
                          key={ti}
                          className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-600 group-hover:text-indigo-400 shrink-0 mt-2">→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
