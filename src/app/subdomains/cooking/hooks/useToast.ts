'use client';

import { useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function useToast() {
  const showToast = useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      const id = Math.random().toString(36).substring(7);
      const toast: ToastMessage = {
        id,
        type,
        message,
        duration,
      };

      // Dispatch custom event
      const event = new CustomEvent('show-toast', { detail: toast });
      window.dispatchEvent(event);
    },
    []
  );

  const toast = {
    success: (message: string, duration?: number) =>
      showToast('success', message, duration),
    error: (message: string, duration?: number) =>
      showToast('error', message, duration),
    info: (message: string, duration?: number) =>
      showToast('info', message, duration),
    warning: (message: string, duration?: number) =>
      showToast('warning', message, duration),
  };

  return toast;
}
