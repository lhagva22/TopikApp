export type AppErrorCode =
  | 'unknown'
  | 'network'
  | 'auth'
  | 'validation'
  | 'payment_required'
  | 'not_found'
  | 'storage';

export type ErrorPresentation = 'inline' | 'modal' | 'alert' | 'screen';

export interface AppError {
  code: AppErrorCode;
  message: string;
  presentation?: ErrorPresentation;
  cause?: unknown;
}
