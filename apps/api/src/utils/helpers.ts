import { v4 as uuidv4 } from 'uuid';

export function generateQRCode(): string {
  return `CUPID-${uuidv4().split('-').slice(0, 2).join('')}`.toUpperCase();
}

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function chatExpiresAt(): string {
  const expires = new Date();
  expires.setHours(expires.getHours() + 48);
  return expires.toISOString();
}

export function chatExtendedExpiresAt(currentExpiry: string): string {
  const expires = new Date(currentExpiry);
  expires.setHours(expires.getHours() + 24);
  return expires.toISOString();
}
