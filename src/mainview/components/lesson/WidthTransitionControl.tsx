import { useTranslation } from 'react-i18next';

import type { ContentWidth, TransitionStyle } from '../../stores/settingsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../ui/Button';

function WidthTransitionControl() {
  const { t } = useTranslation();
  const contentWidth = useSettingsStore((s) => s.contentWidth);
  const setContentWidth = useSettingsStore((s) => s.setContentWidth);
  const transitionStyle = useSettingsStore((s) => s.transitionStyle);
  const setTransitionStyle = useSettingsStore((s) => s.setTransitionStyle);

  const cycleTransition = () => {
    const order: TransitionStyle[] = ['none', 'flip', 'slide', 'fade'];
    const next = order[(order.indexOf(transitionStyle) + 1) % order.length];
    setTransitionStyle(next);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          const order: ContentWidth[] = ['narrow', 'standard', 'wide', 'full'];
          const next = order[(order.indexOf(contentWidth) + 1) % order.length];
          setContentWidth(next);
        }}
        title={t('lesson.toggleWideMode')}
      >
        {contentWidth === 'narrow'
          ? t('lesson.narrow')
          : contentWidth === 'standard'
            ? t('lesson.standard')
            : contentWidth === 'wide'
              ? t('lesson.wide')
              : t('lesson.full')}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={cycleTransition}
        title={`${t('settings.pageTransition')}: ${t(`settings.transition${transitionStyle.charAt(0).toUpperCase() + transitionStyle.slice(1)}`)}`}
      >
        {transitionStyle === 'none'
          ? t('settings.transitionNone')
          : transitionStyle === 'flip'
            ? `↻ ${t('settings.transitionFlip')}`
            : transitionStyle === 'slide'
              ? `→ ${t('settings.transitionSlide')}`
              : `◦ ${t('settings.transitionFade')}`}
      </Button>
    </>
  );
}

export default WidthTransitionControl;
