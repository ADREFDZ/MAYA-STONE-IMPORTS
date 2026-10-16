"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label: string;
  fallbackHref?: string;
  className?: string;
}

export default function BackButton({
  label,
  fallbackHref = "/",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`font-mono text-maya-label uppercase tracking-data text-black-neutral/60 hover:text-black-neutral transition-colors inline-flex items-center gap-1.5 cursor-pointer ${className}`}
    >
      <span>←</span>
      <span>{label}</span>
    </button>
  );
}
