import Link from "next/link";
import React from "react";
import type { Locale } from "@/lib/i18n/routes";

interface FormattedLegalTextProps {
  content: string;
  lang?: Locale;
}

export default function FormattedLegalText({
  content,
}: FormattedLegalTextProps) {
  // Regex para capturar sintaxis [Texto](URL)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      elements.push(content.slice(lastIndex, match.index));
    }

    const linkText = match[1];
    const linkUrl = match[2];
    const isExternal = linkUrl.startsWith("http");

    elements.push(
      <Link
        key={match.index}
        href={linkUrl}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-accent-ink underline underline-offset-2 hover:text-black-neutral transition-colors font-medium cursor-pointer"
      >
        {linkText}
      </Link>,
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    elements.push(content.slice(lastIndex));
  }

  return <span className="whitespace-pre-line">{elements}</span>;
}
