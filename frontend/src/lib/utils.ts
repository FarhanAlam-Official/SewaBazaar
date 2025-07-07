import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPrice(
  price: number | string,
  options: {
    currency?: "USD" | "EUR" | "GBP" | "NPR"
    notation?: Intl.NumberFormatOptions["notation"]
  } = {}
) {
  const { currency = "NPR", notation = "compact" } = options;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation,
  }).format(Number(price));
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

// Slugify a string
export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Truncate a string to a specified length
export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

// Check if string is valid URL
export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Generate random string
export function generateRandomString(length: number) {
  return Math.random().toString(36).substring(2, length + 2);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Deep merge objects
export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const output = { ...target };
  
  if (target && source && typeof target === 'object' && typeof source === 'object') {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === 'object') {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
} 