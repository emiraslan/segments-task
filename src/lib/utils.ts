import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function wait(milliseconds: number) {
  await new Promise((res) => { setTimeout(res, milliseconds) })
}
