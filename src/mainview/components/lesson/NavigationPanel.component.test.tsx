import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { ModuleMeta, Section } from '../../../bun/types';
import i18n from '../../i18n';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useCompletionStore } from '../../stores/completionStore';
import NavigationPanel from './NavigationPanel';

function makeSection(id: string, heading: string, level: number): Section {
  return { id, heading, level, parentID: 'root' };
}

const defaultSections: Section[] = [
  makeSection('intro', 'Introduction', 1),
  makeSection('body', 'Body Content', 2),
  makeSection('conclusion', 'Conclusion', 1),
];

const defaultModules: ModuleMeta[] = [
  { id: 'mod-01', name: 'Module 1', timeHours: 10, prerequisites: [], topics: [] },
  { id: 'mod-02', name: 'Module 2', timeHours: 8, prerequisites: [], topics: [] },
];

const defaultCourseId = 'c1';
const defaultModuleId = 'mod-01';

beforeEach(() => {
  void i18n.changeLanguage('en-US');
  useBookmarksStore.setState({ byModule: {}, loading: {} });
  useCompletionStore.setState({ completed: {}, totalModules: {} });
});

describe('NavigationPanel', () => {
  const user = userEvent.setup();

  test('renders tab buttons', () => {
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(getByText('Sections')).toBeInTheDocument();
    expect(getByText('Modules')).toBeInTheDocument();
  });

  test('renders section headings on Sections tab', () => {
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(getByText('Introduction')).toBeInTheDocument();
    expect(getByText('Body Content')).toBeInTheDocument();
    expect(getByText('Conclusion')).toBeInTheDocument();
  });

  test('clicking section calls scrollToSection', async () => {
    const scrollToSection = mock(() => {});
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={scrollToSection}
        onModuleSelect={() => {}}
        onClose={() => {}}
      />,
    );
    await user.click(getByText('Introduction'));
    expect(scrollToSection).toHaveBeenCalledTimes(1);
    expect(scrollToSection).toHaveBeenCalledWith('intro');
  });

  test('switches to Modules tab and renders modules', async () => {
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={() => {}}
        onClose={() => {}}
      />,
    );
    await user.click(getByText('Modules'));
    expect(getByText('Module 1')).toBeInTheDocument();
    expect(getByText('Module 2')).toBeInTheDocument();
  });

  test('highlight current module in Modules tab', async () => {
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={() => {}}
        onClose={() => {}}
      />,
    );
    await user.click(getByText('Modules'));
    expect(getByText('Module 1').closest('button')?.className).toContain('indigo');
  });

  test('clicking module calls onModuleSelect', async () => {
    const onModuleSelect = mock(() => {});
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={onModuleSelect}
        onClose={() => {}}
      />,
    );
    await user.click(getByText('Modules'));
    await user.click(getByText('Module 2'));
    expect(onModuleSelect).toHaveBeenCalledTimes(1);
    expect(onModuleSelect).toHaveBeenCalledWith(defaultModules[1]);
  });

  test('clicking close calls onClose', async () => {
    const onClose = mock(() => {});
    const { getByText } = render(
      <NavigationPanel
        sections={defaultSections}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={() => {}}
        onClose={onClose}
      />,
    );
    await user.click(getByText('→'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('shows empty state when no sections', () => {
    const { getByText } = render(
      <NavigationPanel
        sections={[]}
        courseId={defaultCourseId}
        moduleId={defaultModuleId}
        moduleName="Test Module"
        modules={defaultModules}
        currentModuleId={defaultModuleId}
        hasPrev={false}
        hasNext={false}
        onGoPrev={() => {}}
        onGoNext={() => {}}
        onScrollToSection={() => {}}
        onModuleSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(getByText('No sections in this module.')).toBeInTheDocument();
  });
});
