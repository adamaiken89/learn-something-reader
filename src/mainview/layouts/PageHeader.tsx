import { Bookmark, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';

interface PageHeaderProps {
  onBack?: () => void;
  backLabel?: string;
  title?: string;
  center?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  toolbar?: ReactNode;
  hideHeaderActions?: boolean;
}

export default function PageHeader({
  onBack,
  backLabel,
  title,
  center,
  actions,
  children,
  toolbar,
  hideHeaderActions,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const focusMode = useSettingsStore((s) => s.focusMode);

  return (
    <header className="relative z-40 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/60 shrink-0 min-h-[28px] flex flex-col">
      {!focusMode && (
        <div className="px-3 py-1.5 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <>
                <button
                  onClick={onBack}
                  className="text-gray-400 hover:text-white transition-colors text-xs shrink-0"
                  data-testid="header-back"
                >
                  {backLabel ?? t('common.back')}
                </button>
                <div className="h-3 w-px bg-gray-600" />
              </>
            )}
            {title && <span className="text-xs font-medium text-gray-200 truncate">{title}</span>}
          </div>

          {children}

          {center && <div className="absolute left-1/2 -translate-x-1/2 z-50">{center}</div>}

          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}

          {!hideHeaderActions && !actions && (
            <div className="ml-auto flex items-center gap-0.5">
              <button
                onClick={() => push({ type: 'bookmarks' })}
                title={t('common.bookmarks')}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 rounded-md transition-colors"
              >
                <Bookmark size={14} />
              </button>
              <button
                onClick={() => push({ type: 'settings' })}
                title={t('common.settings')}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 rounded-md transition-colors"
              >
                <Settings size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      {toolbar && <div>{toolbar}</div>}
    </header>
  );
}
