'use client';

export default function Home() {
  if (typeof window !== 'undefined') {
    window.location.href = '/enroll';
  }
  return null;
}
