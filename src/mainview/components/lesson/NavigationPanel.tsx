import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { toggleVariants } from '@/lib/toggle-styles';

import type { ModuleMeta } from '../../../bun/types';
import { useSettingsStore } from '../../stores/settingsStore';
import NotesHighlightsTab from '../studyTools/NotesHighlightsTab';
import NavigationAITab from './NavigationAITab';
import NavigationSectionsTab from './NavigationSectionsTab';

interface NavigationPanelProps {
  courseId: string;
  moduleId: string;
  moduleName: string;
  modules: ModuleMeta[];
  onScrollToSection: (sectionId: string) => void;
  onModuleSelect: (mod: ModuleMeta, sectionID?: string) => void;
}

export default function NavigationPanel({
  courseId,
  moduleId,
  moduleName,
  modules,
  onScrollToSection,
  onModuleSelect,
}: NavigationPanelProps) {
  const { t } = useTranslation();
  const rightPanel = useSettingsStore((s) => s.rightPanel);
  const setRightPanel = useSettingsStore((s) => s.setRightPanel);

  return (
    <div data-testid="navigation-panel" className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="shrink-0 flex items-stretch border-b border-gray-700 min-h-0">
        {(['sections', 'ai', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setRightPanel(tab)}
            className={`flex-1 text-[11px] font-medium py-1 px-2 transition-colors ${
              rightPanel === tab
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-900/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            {tab === 'sections' && t('lesson.sections')}
            {tab === 'ai' && 'AI+Ask'}
            {tab === 'notes' && 'Notes'}
          </button>
        ))}
        <button
          onClick={() => setRightPanel(false)}
          className={`px-2 ${toggleVariants({ active: true })}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Sections Tab */}
      {rightPanel === 'sections' && (
        <NavigationSectionsTab
          courseId={courseId}
          moduleId={moduleId}
          moduleName={moduleName}
          modules={modules}
          onScrollToSection={onScrollToSection}
          onModuleSelect={onModuleSelect}
        />
      )}

      {/* AI+Ask Tab */}
      {rightPanel === 'ai' && <NavigationAITab />}

      {/* Notes Tab */}
      {rightPanel === 'notes' && (
        <div className="overflow-y-auto flex-1">
          <NotesHighlightsTab />
        </div>
      )}
    </div>
  );
}
