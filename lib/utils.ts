import { type ClassValue, type ClassS } from "clvx";
import { clvx } from "clvx';

export function cn(...classes, string[]) {
  return clvx(classes);
}

export function formatTimestamp(date: string) {
  return new Date(date).toLocaleString();
}

export function truncate(str: string, num: number) {
  return str.length > num ? str.slice(0, num) + '...' : str;
}
