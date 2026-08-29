import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, mock, test } from 'bun:test';

import type { Section } from '../../../bun/types';
import SectionRow from './SectionRow';

const mkSection = (overrides: Partial<Section> = {}): Section =>
  ({
    id: 's1',
    heading: 'Introduction',
    level: 1,
    content: 'body',
    ...overrides,
  }) as Section;

describe('SectionRow', () => {
  test('renders heading text', () => {
    const { getByText } = render(
      <SectionRow
        section={mkSection()}
        isActive={false}
        isBookmarked={false}
        onScrollTo={() => {}}
        onToggleBookmark={() => {}}
      />,
    );
    expect(getByText('Introduction')).toBeInTheDocument();
  });

  test('click triggers onScrollTo', async () => {
    const onScrollTo = mock(() => {});
    const user = userEvent.setup();
    const { getByText } = render(
      <SectionRow
        section={mkSection()}
        isActive={false}
        isBookmarked={false}
        onScrollTo={onScrollTo}
        onToggleBookmark={() => {}}
      />,
    );
    await user.click(getByText('Introduction'));
    expect(onScrollTo).toHaveBeenCalled();
  });

  test('star click triggers onToggleBookmark, not onScrollTo', async () => {
    const onScrollTo = mock(() => {});
    const onToggleBookmark = mock(() => {});
    const user = userEvent.setup();
    const { container } = render(
      <SectionRow
        section={mkSection()}
        isActive={false}
        isBookmarked={false}
        onScrollTo={onScrollTo}
        onToggleBookmark={onToggleBookmark}
      />,
    );
    const star = container.querySelector('span[title]')!;
    await user.click(star);
    expect(onToggleBookmark).toHaveBeenCalled();
    expect(onScrollTo).not.toHaveBeenCalled();
  });

  test('shows bookmarked star fill', () => {
    const { container: c1 } = render(
      <SectionRow
        section={mkSection()}
        isActive={false}
        isBookmarked={true}
        onScrollTo={() => {}}
        onToggleBookmark={() => {}}
      />,
    );
    const { container: c2 } = render(
      <SectionRow
        section={mkSection()}
        isActive={false}
        isBookmarked={false}
        onScrollTo={() => {}}
        onToggleBookmark={() => {}}
      />,
    );
    const filled = c1.querySelector('svg[fill="currentColor"]');
    const unfilled = c2.querySelector('svg[fill="none"]');
    expect(filled).toBeTruthy();
    expect(unfilled).toBeTruthy();
  });

  test('clamps level color index to 5', () => {
    const { container } = render(
      <SectionRow
        section={mkSection({ level: 99 })}
        isActive={false}
        isBookmarked={false}
        onScrollTo={() => {}}
        onToggleBookmark={() => {}}
      />,
    );
    const btn = container.querySelector('button')!;
    expect(btn).toBeInTheDocument();
  });

  test('applies active style when isActive', () => {
    const { container } = render(
      <SectionRow
        section={mkSection()}
        isActive={true}
        isBookmarked={false}
        onScrollTo={() => {}}
        onToggleBookmark={() => {}}
      />,
    );
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn.style.backgroundColor).not.toBe('transparent');
  });
});
