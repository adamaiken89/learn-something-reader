import { beforeEach, describe, expect, test } from 'bun:test';

import { toastCallState } from '../testFsShared';

beforeEach(() => {
  toastCallState.method = '';
  toastCallState.args = [];
});

describe('showToast', () => {
  test('success calls sonnerToast.success with translated key', async () => {
    const { showToast } = await import('./toast');
    const result = showToast.success('common.back');
    expect(result).toBe('toast-id');
    expect(toastCallState.method).toBe('success');
    expect(toastCallState.args).toEqual(['← Back', undefined]);
  });

  test('success passes opts through', async () => {
    const { showToast } = await import('./toast');
    showToast.success('common.back', { duration: 5000 });
    expect(toastCallState.args).toEqual(['← Back', { duration: 5000 }]);
  });

  test('error calls sonnerToast.error with fallback key and default duration', async () => {
    const { showToast } = await import('./toast');
    showToast.error('common.error');
    expect(toastCallState.args).toEqual(['common.error', { duration: 6000 }]);
  });

  test('error merges custom duration with default', async () => {
    const { showToast } = await import('./toast');
    showToast.error('common.error', { duration: 3000 });
    expect(toastCallState.args).toEqual(['common.error', { duration: 3000 }]);
  });

  test('info passes through', async () => {
    const { showToast } = await import('./toast');
    showToast.info('common.info');
    expect(toastCallState.args).toEqual(['common.info', undefined]);
  });

  test('warning passes through', async () => {
    const { showToast } = await import('./toast');
    showToast.warning('common.warning');
    expect(toastCallState.args).toEqual(['common.warning', undefined]);
  });

  test('promise calls sonnerToast.promise with translated messages', async () => {
    const { showToast } = await import('./toast');
    const promise = Promise.resolve('done');
    showToast.promise(promise, {
      loading: 'common.loading',
      success: 'common.success',
      error: 'common.error',
    });
    expect(toastCallState.method).toBe('promise');
    const msgs = toastCallState.args[0] as {
      loading: string;
      success: string;
      error: string | (() => string);
    };
    expect(msgs.loading).toBe('Loading...');
    expect(msgs.success).toBe('common.success');
    const errorFn = msgs.error as () => string;
    expect(typeof errorFn).toBe('function');
    expect(errorFn()).toBe('common.error');
  });

  test('promise with values translates with interpolation', async () => {
    const { showToast } = await import('./toast');
    showToast.success('common.back', { values: { name: 'test' } });
    expect(toastCallState.args).toEqual(['← Back', { values: { name: 'test' } }]);
  });
});
