import { toast, type ToastT } from 'sonner';
import { playToastSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';

// Types for toast options
export interface ToastOptions extends Partial<ToastT> {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast types and their configurations
const toastStyles = {
  success: {
    icon: (
      <div className="rounded-full bg-gradient-to-br from-green-400 to-green-600 p-2 shadow-lg shadow-green-500/30">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    className: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800',
    progressBarClass: 'bg-gradient-to-r from-green-400 to-emerald-500',
    shadowClass: 'shadow-green-500/30',
  },
  error: {
    icon: (
      <div className="rounded-full bg-gradient-to-br from-red-400 to-red-600 p-2 shadow-lg shadow-red-500/30">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    className: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-800',
    progressBarClass: 'bg-gradient-to-r from-red-400 to-rose-500',
    shadowClass: 'shadow-red-500/30',
  },
  warning: {
    icon: (
      <div className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 p-2 shadow-lg shadow-yellow-500/30">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    className: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-100 dark:border-yellow-800',
    progressBarClass: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    shadowClass: 'shadow-yellow-500/30',
  },
  info: {
    icon: (
      <div className="rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-2 shadow-lg shadow-blue-500/30">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    className: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800',
    progressBarClass: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    shadowClass: 'shadow-blue-500/30',
  },
} as const;

// Custom toast component with progress bar
const ToastMessage = ({ 
  title, 
  description, 
  type = 'info',
  duration = 4000,
  onAutoClose 
}: { 
  title: string; 
  description?: string; 
  type: keyof typeof toastStyles;
  duration: number;
  onAutoClose?: () => void;
}) => {
  const style = toastStyles[type];

  return (
    <div className={cn(
      "relative flex w-full items-start gap-4 overflow-hidden rounded-xl p-4",
      "border border-opacity-50 backdrop-blur-sm",
      "shadow-lg transition-all duration-300 hover:shadow-xl",
      "animate-in slide-in-from-top-2 fade-in-0 zoom-in-95",
      style.className,
      style.shadowClass
    )}>
      {/* Icon with animated gradient background */}
      <div className="flex-shrink-0 animate-in zoom-in-50 duration-300">
        {style.icon}
      </div>

      {/* Content with animated entrance */}
      <div className="flex-1 min-w-0 animate-in slide-in-from-right-1 duration-300">
        <h3 className="font-semibold leading-5 tracking-tight mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm opacity-90 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Animated progress bar */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 h-1",
          style.progressBarClass,
          "transition-all ease-in-out"
        )}
        style={{
          width: '100%',
          animation: `shrink ${duration}ms linear forwards`,
        }}
        onAnimationEnd={onAutoClose}
      />
    </div>
  );
};

// Add keyframes for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }

  .animate-in {
    animation-duration: 300ms;
    --tw-enter-opacity: initial;
    --tw-enter-scale: initial;
    --tw-enter-rotate: initial;
    --tw-enter-translate-x: initial;
    --tw-enter-translate-y: initial;
  }

  .slide-in-from-top-2 {
    --tw-enter-translate-y: -0.5rem;
  }

  .slide-in-from-right-1 {
    --tw-enter-translate-x: 0.25rem;
  }

  .fade-in-0 {
    --tw-enter-opacity: 0;
  }

  .zoom-in-95 {
    --tw-enter-scale: .95;
  }

  .zoom-in-50 {
    --tw-enter-scale: .5;
  }

  [data-sonner-toast] {
    --y: -100%;
  }
`;
document.head.appendChild(style);

// Main toast functions
export const showToast = {
  /**
   * Show a success toast notification
   */
  success: (options: ToastOptions) => {
    playToastSound('success');
    return toast.custom((t) => (
      <ToastMessage
        type="success"
        title={options.title || 'Success'}
        description={options.description}
        duration={options.duration || 4000}
        onAutoClose={() => toast.dismiss(t)}
      />
    ), {
      duration: options.duration || 4000,
      ...options,
    });
  },

  /**
   * Show an error toast notification
   */
  error: (options: ToastOptions) => {
    playToastSound('error');
    return toast.custom((t) => (
      <ToastMessage
        type="error"
        title={options.title || 'Error'}
        description={options.description}
        duration={options.duration || 5000}
        onAutoClose={() => toast.dismiss(t)}
      />
    ), {
      duration: options.duration || 5000,
      ...options,
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (options: ToastOptions) => {
    playToastSound('warning');
    return toast.custom((t) => (
      <ToastMessage
        type="warning"
        title={options.title || 'Warning'}
        description={options.description}
        duration={options.duration || 4000}
        onAutoClose={() => toast.dismiss(t)}
      />
    ), {
      duration: options.duration || 4000,
      ...options,
    });
  },

  /**
   * Show an info toast notification
   */
  info: (options: ToastOptions) => {
    playToastSound('info');
    return toast.custom((t) => (
      <ToastMessage
        type="info"
        title={options.title || 'Info'}
        description={options.description}
        duration={options.duration || 3000}
        onAutoClose={() => toast.dismiss(t)}
      />
    ), {
      duration: options.duration || 3000,
      ...options,
    });
  },

  /**
   * Dismiss all currently visible toasts
   */
  dismiss: () => toast.dismiss(),

  /**
   * Show a promise-based toast that updates based on the promise state
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) => {
    const loadingToast = (
      <ToastMessage
        type="info"
        title="Loading"
        description={messages.loading}
        duration={options?.duration || 3000}
      />
    );

    return toast.promise(promise, {
      loading: loadingToast,
      success: (data) => (
        <ToastMessage
          type="success"
          title="Success"
          description={typeof messages.success === 'function' 
            ? messages.success(data)
            : messages.success}
          duration={options?.duration || 4000}
        />
      ),
      error: (error) => (
        <ToastMessage
          type="error"
          title="Error"
          description={typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error}
          duration={options?.duration || 5000}
        />
      ),
    });
  },
}; 