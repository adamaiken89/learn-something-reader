import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, mock, test } from 'bun:test';

import SelectionToolbar from './SelectionToolbar';

const defaultProps = {
  x: 200,
  y: 300,
  selectionTop: 280,
  selectedText: 'selected text',
  onSelectColor: () => {},
  onOpenNote: () => {},
  onCreateCard: () => {},
  onCopy: () => {},
};

describe('SelectionToolbar', () => {
  const user = userEvent.setup();
  test('renders all action buttons', () => {
    const { getByText } = render(<SelectionToolbar {...defaultProps} />);
    expect(getByText('Add Note')).toBeInTheDocument();
    expect(getByText('Create Card')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
  });

  test('clicking note button calls onOpenNote', async () => {
    const onOpenNote = mock(() => {});
    const { getByText } = render(<SelectionToolbar {...defaultProps} onOpenNote={onOpenNote} />);
    await user.click(getByText('Add Note'));
    expect(onOpenNote).toHaveBeenCalledTimes(1);
  });

  test('clicking create card calls onCreateCard', async () => {
    const onCreateCard = mock(() => {});
    const { getByText } = render(
      <SelectionToolbar {...defaultProps} onCreateCard={onCreateCard} />,
    );
    await user.click(getByText('Create Card'));
    expect(onCreateCard).toHaveBeenCalledTimes(1);
  });

  test('clicking copy calls onCopy with selected text', async () => {
    const onCopy = mock(() => {});
    const { getByText } = render(<SelectionToolbar {...defaultProps} onCopy={onCopy} />);
    await user.click(getByText('Copy'));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith('selected text');
  });

  test('copy button shows copied state via prop', () => {
    const { getByText } = render(<SelectionToolbar {...defaultProps} copied={true} />);
    expect(getByText('Copied!')).toBeInTheDocument();
  });

  test('copy button calls onCopiedChange on click', async () => {
    const onCopiedChange = mock(() => {});
    const { getByText } = render(
      <SelectionToolbar {...defaultProps} onCopiedChange={onCopiedChange} />,
    );
    await user.click(getByText('Copy'));
    expect(onCopiedChange).toHaveBeenCalledWith(true);
  });

  test('copy button does nothing without selectedText', async () => {
    const onCopy = mock(() => {});
    const { getByText } = render(
      <SelectionToolbar {...defaultProps} selectedText={undefined} onCopy={onCopy} />,
    );
    await user.click(getByText('Copy'));
    expect(onCopy).not.toHaveBeenCalled();
  });

  test('clicking inactive color calls onSelectColor', async () => {
    const onSelectColor = mock(() => {});
    const { container } = render(
      <SelectionToolbar {...defaultProps} onSelectColor={onSelectColor} />,
    );
    const yellowBtn = container.querySelector('button[title="yellow"]');
    expect(yellowBtn).toBeTruthy();
    await user.click(yellowBtn!);
    expect(onSelectColor).toHaveBeenCalledWith('yellow');
  });

  test('clicking active color calls onDeleteHighlight', async () => {
    const onDeleteHighlight = mock(() => {});
    const onSelectColor = mock(() => {});
    const { container } = render(
      <SelectionToolbar
        {...defaultProps}
        onDeleteHighlight={onDeleteHighlight}
        onSelectColor={onSelectColor}
        activeHighlightColor="yellow"
      />,
    );
    const yellowBtn = container.querySelector('button[title="yellow"]');
    expect(yellowBtn).toBeTruthy();
    await user.click(yellowBtn!);
    expect(onDeleteHighlight).toHaveBeenCalledTimes(1);
    expect(onSelectColor).not.toHaveBeenCalled();
  });
});
