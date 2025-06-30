'use client';

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-800 dark:group-[.toaster]:bg-green-900/30 dark:group-[.toaster]:text-green-200 group-[.toaster]:border-green-200 dark:group-[.toaster]:border-green-800",
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800 dark:group-[.toaster]:bg-red-900/30 dark:group-[.toaster]:text-red-200 group-[.toaster]:border-red-200 dark:group-[.toaster]:border-red-800",
          warning:
            "group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-800 dark:group-[.toaster]:bg-yellow-900/30 dark:group-[.toaster]:text-yellow-200 group-[.toaster]:border-yellow-200 dark:group-[.toaster]:border-yellow-800",
          info:
            "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-800 dark:group-[.toaster]:bg-blue-900/30 dark:group-[.toaster]:text-blue-200 group-[.toaster]:border-blue-200 dark:group-[.toaster]:border-blue-800",
        },
      }}
      closeButton
      richColors
      expand
      position="top-right"
      duration={4000}
      gap={8}
    />
  );
} 