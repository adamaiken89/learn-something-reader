import { useTranslation } from 'react-i18next';

import type { Section } from '../../../bun/types';
import {
  BOOKMARK_AMBER,
  SECTION_ACTIVE_BG,
  SECTION_ACTIVE_TEXT,
  SECTION_HOVER_BG,
  SECTION_INACTIVE_BOOKMARK,
  SECTION_LEVEL_COLORS,
} from '../../colors';

interface SectionRowProps {
  section: Section;
  isActive: boolean;
  isBookmarked: boolean;
  onScrollTo: () => void;
  onToggleBookmark: () => void;
}

export default function SectionRow({
  section,
  isActive,
  isBookmarked,
  onScrollTo,
  onToggleBookmark,
}: SectionRowProps) {
  const { t } = useTranslation();
  const levelColor = SECTION_LEVEL_COLORS[Math.min(section.level - 1, 5)];

  return (
    <button
      data-section-id={section.id}
      onClick={onScrollTo}
      className="w-full text-left px-2.5 py-0.5 text-xs transition-colors"
      style={Object.assign(
        { paddingLeft: `${(section.level - 1) * 16 + 10}px` },
        isActive
          ? { backgroundColor: SECTION_ACTIVE_BG, color: SECTION_ACTIVE_TEXT }
          : { backgroundColor: 'transparent', color: levelColor },
      )}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = SECTION_HOVER_BG;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex items-start gap-0.5" style={{ paddingRight: '2px' }}>
        <span className="flex-1 whitespace-normal break-words min-w-0">{section.heading}</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark();
          }}
          className="shrink-0 cursor-pointer"
          style={{
            color: isBookmarked
              ? BOOKMARK_AMBER
              : isActive
                ? SECTION_ACTIVE_TEXT
                : SECTION_INACTIVE_BOOKMARK,
          }}
          title={isBookmarked ? t('lesson.removeBookmark') : t('lesson.bookmarkSection')}
        >
          {isBookmarked ? t('icons.starFilled') : t('icons.starEmpty')}
        </span>
      </div>
    </button>
  );
}
