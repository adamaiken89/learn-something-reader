import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, mock, test } from 'bun:test';

import type { UseLessonSearchReturn } from '../../hooks/useLessonSearch';
import ViewerSearch from './ViewerSearch';

const mockSearch = (overrides?: Partial<UseLessonSearchReturn>): UseLessonSearchReturn => ({
  searchActive: false,
  searchQuery: '',
  totalMatches: 0,
  currentMatchIndex: 0,
  setSearchActive: () => {},
  handleSearchQueryChange: () => {},
  handleSearchPrev: () => {},
  handleSearchNext: () => {},
  handleSearchClose: () => {},
  ...overrides,
});

describe('ViewerSearch', () => {
  const user = userEvent.setup();

  test('renders search input', () => {
    const { getByTestId } = render(<ViewerSearch search={mockSearch()} />);
    expect(getByTestId('viewer-search')).toBeInTheDocument();
  });

  test('typing calls handleSearchQueryChange', async () => {
    const handleSearchQueryChange = mock(() => {});
    const { container } = render(<ViewerSearch search={mockSearch({ handleSearchQueryChange })} />);
    const input = container.querySelector('input')!;
    await user.type(input, 'keyword');
    expect(handleSearchQueryChange).toHaveBeenCalled();
  });

  test('shows match count when query present and total matches >0', () => {
    const { getByText } = render(
      <ViewerSearch
        search={mockSearch({ searchQuery: 'keyword', totalMatches: 5, currentMatchIndex: 0 })}
      />,
    );
    expect(getByText('1 of 5')).toBeInTheDocument();
  });

  test('shows no matches when query present and total matches =0', () => {
    const { getByText } = render(
      <ViewerSearch
        search={mockSearch({ searchQuery: 'keyword', totalMatches: 0, currentMatchIndex: 0 })}
      />,
    );
    expect(getByText('No matches')).toBeInTheDocument();
  });

  test('Enter key calls handleSearchNext', async () => {
    const handleSearchNext = mock(() => {});
    const { container } = render(
      <ViewerSearch search={mockSearch({ searchQuery: 'k', totalMatches: 3, handleSearchNext })} />,
    );
    const input = container.querySelector('input')!;
    await user.type(input, '{Enter}');
    expect(handleSearchNext).toHaveBeenCalledTimes(1);
  });

  test('Shift+Enter calls handleSearchPrev', async () => {
    const handleSearchPrev = mock(() => {});
    const { container } = render(
      <ViewerSearch search={mockSearch({ searchQuery: 'k', totalMatches: 3, handleSearchPrev })} />,
    );
    const input = container.querySelector('input')!;
    await user.type(input, '{Shift>}{Enter}');
    expect(handleSearchPrev).toHaveBeenCalledTimes(1);
  });

  test('Escape key calls handleSearchClose', async () => {
    const handleSearchClose = mock(() => {});
    const { container } = render(<ViewerSearch search={mockSearch({ handleSearchClose })} />);
    const input = container.querySelector('input')!;
    await user.type(input, '{Escape}');
    expect(handleSearchClose).toHaveBeenCalledTimes(1);
  });

  test('renders next/prev buttons when matches exist', () => {
    const { getByText } = render(
      <ViewerSearch search={mockSearch({ searchQuery: 'k', totalMatches: 3 })} />,
    );
    expect(getByText('↑')).toBeInTheDocument();
    expect(getByText('↓')).toBeInTheDocument();
  });

  test('clicking next calls handleSearchNext', async () => {
    const handleSearchNext = mock(() => {});
    const { getByText } = render(
      <ViewerSearch search={mockSearch({ searchQuery: 'k', totalMatches: 3, handleSearchNext })} />,
    );
    await user.click(getByText('↓'));
    expect(handleSearchNext).toHaveBeenCalledTimes(1);
  });

  test('clicking prev calls handleSearchPrev', async () => {
    const handleSearchPrev = mock(() => {});
    const { getByText } = render(
      <ViewerSearch search={mockSearch({ searchQuery: 'k', totalMatches: 3, handleSearchPrev })} />,
    );
    await user.click(getByText('↑'));
    expect(handleSearchPrev).toHaveBeenCalledTimes(1);
  });

  test('close button calls handleSearchClose', async () => {
    const handleSearchClose = mock(() => {});
    const { getByText } = render(<ViewerSearch search={mockSearch({ handleSearchClose })} />);
    await user.click(getByText('✕'));
    expect(handleSearchClose).toHaveBeenCalledTimes(1);
  });
});
