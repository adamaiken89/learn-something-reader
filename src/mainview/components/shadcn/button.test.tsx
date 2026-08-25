import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, mock, test } from 'bun:test';

import { Button } from './button';

describe('Button', () => {
  const user = userEvent.setup();

  test('renders children', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  test('default variant applies secondary classes', () => {
    const { container } = render(<Button>Btn</Button>);
    expect(container.querySelector('button')!.className).toContain('bg-gray-700');
  });

  test('primary variant', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.querySelector('button')!.className).toContain('bg-indigo-600');
  });

  test('danger variant', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container.querySelector('button')!.className).toContain('bg-red-700');
  });

  test('ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.querySelector('button')!.className).toContain('text-gray-400');
  });

  test('toggleActive variant', () => {
    const { container } = render(<Button variant="toggleActive">Active</Button>);
    expect(container.querySelector('button')!.className).toContain('bg-indigo-600');
  });

  test('sm size', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.querySelector('button')!.className).toContain('px-2');
  });

  test('lg size', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.querySelector('button')!.className).toContain('px-4');
  });

  test('loading shows spinner and disables', () => {
    const { container } = render(<Button loading>Loading</Button>);
    const btn = container.querySelector('button')!;
    expect(btn.disabled).toBe(true);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  test('disabled prop disables button', () => {
    const { container } = render(<Button disabled>Off</Button>);
    expect(container.querySelector('button')!.disabled).toBe(true);
  });

  test('calls onClick on click', async () => {
    const onClick = mock(() => {});
    const { getByText } = render(<Button onClick={onClick}>Hit</Button>);
    await user.click(getByText('Hit'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('merges custom className', () => {
    const { container } = render(<Button className="my-class">Btn</Button>);
    expect(container.querySelector('button')!.className).toContain('my-class');
  });
});
