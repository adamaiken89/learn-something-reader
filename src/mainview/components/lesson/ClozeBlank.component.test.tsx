import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'bun:test';

import ClozeBlank from './ClozeBlank';

describe('ClozeBlank', () => {
  const user = userEvent.setup();

  test('renders black block initially, answer hidden', () => {
    const { getByRole, queryByText } = render(<ClozeBlank answer="sensory memory" />);
    const blank = getByRole('button');
    expect(blank).toHaveClass('cloze-blank-hidden');
    expect(queryByText('sensory memory')).toBeNull();
  });

  test('click reveals the answer', async () => {
    const { getByRole, getByText } = render(<ClozeBlank answer="sensory memory" />);
    const blank = getByRole('button');
    await user.click(blank);
    expect(blank).toHaveClass('revealed');
    expect(getByText('sensory memory')).toBeVisible();
  });

  test('keyboard Enter reveals the answer', async () => {
    const { getByRole, getByText } = render(<ClozeBlank answer="working memory" />);
    const blank = getByRole('button');
    blank.focus();
    await user.keyboard('{Enter}');
    expect(getByText('working memory')).toBeVisible();
  });

  test('keyboard Space reveals the answer', async () => {
    const { getByRole, getByText } = render(<ClozeBlank answer="attend to" />);
    const blank = getByRole('button');
    blank.focus();
    await user.keyboard(' ');
    expect(getByText('attend to')).toBeVisible();
  });
});
