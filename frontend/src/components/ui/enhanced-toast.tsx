import { toast, type ToastT } from 'sonner';
import { playToastSound } from '@/lib/sounds';

// Types for our enhanced toast options
export interface EnhancedToastOptions extends Partial<ToastT> {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Main toast types and their configurations
export const toastTypes = {
  success: {
    icon: '✅',
    className: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  },
  error: {
    icon: '❌',
    className: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
  warning: {
    icon: '⚠️',
    className: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  },
  info: {
    icon: 'ℹ️',
    className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  },
} as const;

// Enhanced toast functions with sound effects
export const enhancedToast = {
  /**
   * Show a success toast notification
   * @param options Toast configuration options
   */
  success: (options: EnhancedToastOptions) => {
    playToastSound('success');
    return toast.success(options.title, {
      description: options.description,
      duration: options.duration ?? 4000,
      action: options.action,
      ...options,
    });
  },

  /**
   * Show an error toast notification
   * @param options Toast configuration options
   */
  error: (options: EnhancedToastOptions) => {
    playToastSound('error');
    return toast.error(options.title, {
      description: options.description,
      duration: options.duration ?? 5000, // Errors shown longer by default
      action: options.action,
      ...options,
    });
  },

  /**
   * Show a warning toast notification
   * @param options Toast configuration options
   */
  warning: (options: EnhancedToastOptions) => {
    playToastSound('warning');
    return toast.warning(options.title, {
      description: options.description,
      duration: options.duration ?? 4000,
      action: options.action,
      ...options,
    });
  },

  /**
   * Show an info toast notification
   * @param options Toast configuration options
   */
  info: (options: EnhancedToastOptions) => {
    playToastSound('info');
    return toast.info(options.title, {
      description: options.description,
      duration: options.duration ?? 3000,
      action: options.action,
      ...options,
    });
  },

  /**
   * Dismiss all currently visible toasts
   */
  dismiss: () => toast.dismiss(),

  /**
   * Show a promise-based toast that updates based on the promise state
   * @param promise Promise to track
   * @param messages Messages for different promise states
   * @param options Additional toast options
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: EnhancedToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: (data) => {
        const message = typeof messages.success === 'function' 
          ? messages.success(data)
          : messages.success;
        return message;
      },
      error: (error) => {
        const message = typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
        return message;
      },
      ...options,
    });
  },
}; 