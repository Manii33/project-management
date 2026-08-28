const TOAST_EVENT = 'app:toast';
let toastId = 0;

export type ToastType = 'error' | 'success';

export function showToast(type: ToastType, message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { type, message, id: ++toastId } })
  );
}

export function showErrorToast(message: string) {
  showToast('error', message);
}

export interface ToastPayload {
  type: ToastType;
  message: string;
  id: number;
}

export const TOAST_EVENT_NAME = TOAST_EVENT;
