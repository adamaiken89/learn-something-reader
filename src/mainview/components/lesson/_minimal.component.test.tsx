import { render } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';

import { setupRPC } from '../../testUtils';

setupRPC();

function Hello() {
  return <div>Hello World</div>;
}

describe('minimal', () => {
  test('renders', () => {
    const { getByText } = render(<Hello />);
    expect(getByText('Hello World')).toBeInTheDocument();
  });
});
