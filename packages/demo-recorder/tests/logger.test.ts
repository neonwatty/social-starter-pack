import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../src/utils/logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DEBUG;
  });

  describe('info', () => {
    it('should log message with [INFO] prefix', () => {
      logger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] test message');
    });

    it('should pass additional arguments', () => {
      logger.info('message', 'arg1', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] message', 'arg1', { key: 'value' });
    });
  });

  describe('warn', () => {
    it('should log message with [WARN] prefix', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warning message');
    });

    it('should pass additional arguments', () => {
      logger.warn('message', 123, true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] message', 123, true);
    });
  });

  describe('error', () => {
    it('should log message with [ERROR] prefix', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message');
    });

    it('should pass additional arguments', () => {
      const error = new Error('test');
      logger.error('failed', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] failed', error);
    });
  });

  describe('debug', () => {
    it('should not log when DEBUG env is not set', () => {
      delete process.env.DEBUG;
      logger.debug('debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log message with [DEBUG] prefix when DEBUG env is set', () => {
      process.env.DEBUG = 'true';
      logger.debug('debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] debug message');
    });

    it('should pass additional arguments when DEBUG env is set', () => {
      process.env.DEBUG = '1';
      logger.debug('debug', { data: 'test' });
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] debug', { data: 'test' });
    });
  });
});
