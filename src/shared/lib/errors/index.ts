import type { AppError, AppErrorCode, ErrorPresentation } from './types';

type AppErrorShape = Partial<AppError> & {
  error?: string;
  message?: string;
};

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  unknown: 'Алдаа гарлаа. Дахин оролдоно уу.',
  network: 'Серверт холбогдоход алдаа гарлаа.',
  auth: 'Нэвтрэх эрхийн алдаа гарлаа.',
  validation: 'Оруулсан мэдээллээ шалгана уу.',
  payment_required: 'Төлбөртэй багц шаардлагатай.',
  not_found: 'Хайсан мэдээлэл олдсонгүй.',
  storage: 'Төхөөрөмжийн мэдээлэл боловсруулахад алдаа гарлаа.',
};

const hasMessage = (value: unknown): value is { message: string } =>
  typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';

const hasError = (value: unknown): value is { error: string } =>
  typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string';

export const createAppError = (
  code: AppErrorCode,
  message?: string,
  presentation: ErrorPresentation = 'inline',
  cause?: unknown,
): AppError => ({
  code,
  message: message || DEFAULT_MESSAGES[code],
  presentation,
  cause,
});

export const toAppError = (
  error: unknown,
  fallback = DEFAULT_MESSAGES.unknown,
  presentation: ErrorPresentation = 'inline',
): AppError => {
  if (!error) {
    return createAppError('unknown', fallback, presentation);
  }

  if (typeof error === 'string') {
    return createAppError('unknown', error, presentation, error);
  }

  if (hasError(error)) {
    const appError = error as AppErrorShape;

    return {
      code: appError.code || 'unknown',
      message: appError.error || fallback,
      presentation: appError.presentation || presentation,
      cause: error,
    };
  }

  if (hasMessage(error)) {
    const appError = error as AppErrorShape;

    return {
      code: appError.code || 'unknown',
      message: appError.message || fallback,
      presentation: appError.presentation || presentation,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return createAppError('unknown', error.message || fallback, presentation, error);
  }

  return createAppError('unknown', fallback, presentation, error);
};

export const getErrorMessage = (
  error: unknown,
  fallback = DEFAULT_MESSAGES.unknown,
): string => toAppError(error, fallback).message;

export const logError = (context: string, error: unknown) => {
  console.error(`${context}:`, error);
};

export type { AppError, AppErrorCode, ErrorPresentation } from './types';
