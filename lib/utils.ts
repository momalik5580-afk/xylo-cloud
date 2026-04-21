// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ... your existing functions ...

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function:
export function generateAvatarFallback(name: string): string {
  if (!name) return "U"
  
  const parts = name.trim().split(" ")
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}