import { describe, expect, spyOn, test, afterEach } from 'bun:test';

const logger = await import('./src/bun/logger');

test('spyOn logger.info', () => {
  const spy = spyOn(logger.logger, 'info');
  spy.mockImplementation(() => {});
  logger.logger.info('test message');
  expect(spy).toHaveBeenCalledWith('test message');
  spy.mockRestore();
});

test('logger.info restored', () => {
  expect(typeof logger.logger.info).toBe('function');
});
