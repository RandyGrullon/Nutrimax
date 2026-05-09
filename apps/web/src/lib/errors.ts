'use client';

import { toast } from 'sonner';
import { parseApiErrorMessage } from '@/lib/api-error-message';

export { parseApiErrorMessage as parseApiError };

export function showErrorToast(message: string): void {
  toast.error(message);
}

export function showSuccessToast(message: string): void {
  toast.success(message);
}

export function showInfoToast(message: string): void {
  toast.message(message);
}
