"use client";

interface Props {
  label: string;
}

export default function CookieReopenButton({ label }: Props) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("maya_open_cookie_banner"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-black-neutral text-gray-warm hover:bg-black-neutral/85 font-mono text-maya-label uppercase tracking-data rounded-3xs transition-colors cursor-pointer"
    >
      <span>⚙</span>
      <span>{label}</span>
    </button>
  );
}
