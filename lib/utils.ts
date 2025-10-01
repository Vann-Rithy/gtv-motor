import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Number formatting utilities
export function formatNumber(n: number | string | undefined | null): string {
  if (n === null || n === undefined || n === '') return "N/A"
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return "N/A"
  return num.toLocaleString()
}

export function formatKM(n: number | string | undefined | null): string {
  if (n === null || n === undefined || n === '') return "N/A"
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return "N/A"
  return `${num.toLocaleString()} KM`
}

export function formatCurrency(n: number | string | undefined | null): string {
  if (n === null || n === undefined || n === '') return "N/A"
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return "N/A"
  try {
    return num.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    })
  } catch {
    return `$${num.toFixed(2)}`
  }
}