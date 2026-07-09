import { beforeEach, describe, expect, test } from 'bun:test';

import { useViewStore } from './viewStore';

beforeEach(() => {
  useViewStore.setState(useViewStore.getInitialState());
});

describe('viewStore', () => {
  test('default state has empty views', () => {
    expect(useViewStore.getState().views).toEqual([]);
  });

  test('push adds view to stack', () => {
    useViewStore.getState().push({ type: 'dashboard' });
    expect(useViewStore.getState().views).toHaveLength(1);
    expect(useViewStore.getState().views[0]).toEqual({ type: 'dashboard' });
  });

  test('multiple pushes accumulate', () => {
    useViewStore.getState().push({ type: 'dashboard' });
    useViewStore.getState().push({ type: 'settings' });
    expect(useViewStore.getState().views).toHaveLength(2);
  });

  test('pop removes last view', () => {
    useViewStore.getState().push({ type: 'dashboard' });
    useViewStore.getState().push({ type: 'settings' });
    useViewStore.getState().pop();
    expect(useViewStore.getState().views).toHaveLength(1);
    expect(useViewStore.getState().views[0]).toEqual({ type: 'dashboard' });
  });

  test('popToRoot clears all views', () => {
    useViewStore.getState().push({ type: 'dashboard' });
    useViewStore.getState().push({ type: 'settings' });
    useViewStore.getState().popToRoot();
    expect(useViewStore.getState().views).toEqual([]);
  });

  test('replace swaps last view', () => {
    useViewStore.getState().push({ type: 'dashboard' });
    useViewStore.getState().replace({ type: 'settings' });
    expect(useViewStore.getState().views).toHaveLength(1);
    expect(useViewStore.getState().views[0]).toEqual({ type: 'settings' });
  });
});
