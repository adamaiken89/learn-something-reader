import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta } from '../../bun/types';
import LessonToolbar from '../components/lesson/LessonToolbar';
import SearchOverlay from '../components/SearchOverlay';
import { useLastSession } from '../hooks/useLastSession';
import { useLessonToolbarShortcuts } from '../hooks/useLessonToolbarShortcuts';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import LessonSection from '../sections/LessonSection';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useSettingsStore } from '../stores/settingsStore';

interface LessonFeatureProps {
  course: Course;
  module: ModuleMeta;
  initialSectionID?: string;
  onBack: () => void;
}

export default function LessonPage({
  course,
  module,
  initialSectionID,
  onBack,
}: LessonFeatureProps) {
  const { t } = useTranslation();
  const searchCourseOpen = useLessonUIStore((s) => s.searchCourseOpen);
  const setSearchCourseOpen = useLessonUIStore((s) => s.setSearchCourseOpen);
  const transitionStyle = useSettingsStore((s) => s.transitionStyle);

  useLessonToolbarShortcuts(course, module);
  useLastSession(course, module);

  const [animClass, setAnimClass] = useState('');
  const [contentKey, setContentKey] = useState(0);
  const prevModuleRef = useRef(module);

  const moduleIndex = course.modules.findIndex((m) => m.id === module.id);
  const moduleBadge = `M${moduleIndex + 1}/${course.modules.length}`;

  useEffect(() => {
    const prev = prevModuleRef.current;
    prevModuleRef.current = module;
    if (transitionStyle === 'none' || !prev || prev.id === module.id) return;

    const prevIdx = course.modules.findIndex((m) => m.id === prev.id);
    const currIdx = course.modules.findIndex((m) => m.id === module.id);
    const direction = prevIdx === -1 || currIdx >= prevIdx ? 'forward' : 'back';

    const classMap: Record<string, { forward: string; back: string }> = {
      fade: { forward: 'anim-fade', back: 'anim-fade' },
      slide: { forward: 'anim-slide-right', back: 'anim-slide-left' },
      flip: { forward: 'anim-flip', back: 'anim-flip' },
    };

    const cls = classMap[transitionStyle]?.[direction] ?? '';
    if (!cls) return;

    setContentKey((k) => k + 1);
    setAnimClass(cls);
    const timer = setTimeout(() => setAnimClass(''), 500);
    return () => clearTimeout(timer);
  }, [module, course.modules, transitionStyle]);

  return (
    <PageLayout>
      <PageHeader
        onBack={onBack}
        center={
          <span className="text-sm font-semibold text-gray-300 tabular-nums whitespace-nowrap">
            {t('lesson.moduleBadge', {
              current: moduleIndex + 1,
              total: course.modules.length,
              defaultValue: moduleBadge,
            })}
          </span>
        }
        toolbar={<LessonToolbar />}
      />
      <PageContent className="px-0 py-0">
        <div key={contentKey} className={`flex flex-col flex-1 min-h-0 ${animClass || ''}`}>
          <LessonSection course={course} module={module} initialSectionID={initialSectionID} />
        </div>
      </PageContent>
      {searchCourseOpen && (
        <SearchOverlay initialCourseIDs={[course.id]} onClose={() => setSearchCourseOpen(false)} />
      )}
    </PageLayout>
  );
}
