"use client";

import React, { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "outline-dark"
  | "outline-light"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonAlign = "left" | "center" | "right";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: ButtonAlign;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
};

type AsLinkProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type AsButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type ButtonProps = AsLinkProps | AsButtonProps;

export default function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  align,
  icon,
  iconPosition = "right",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const defaultAlign = align || (variant === "ghost" ? "left" : "center");

  const alignClasses: Record<ButtonAlign, string> = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  const baseClasses = `
    group
    relative
    inline-flex
    items-center
    font-sans
    font-normal
    uppercase
    tracking-nav
    transition-all
    duration-500
    ease-out
    select-none
    rounded-3xs
    active:scale-[0.98]
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:pointer-events-none
    disabled:hover:scale-100
    ${alignClasses[defaultAlign]}
    ${fullWidth ? "w-full" : "w-full sm:w-auto"}
  `.trim();

  const sizeClasses = {
    sm:
      variant === "ghost"
        ? "py-1 text-maya-label"
        : "px-4 py-2 text-maya-label",
    md:
      variant === "ghost"
        ? "py-1 text-maya-small"
        : "px-6 py-2.5 text-maya-small",
    lg:
      variant === "ghost"
        ? "py-1 text-maya-body"
        : "px-8 py-3.5 text-maya-body",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: `
      bg-gray-warm
      text-black-neutral
      border
      border-border-light
      hover:bg-accent-soft
      hover:text-black-neutral
      hover:border-accent
    `,
    secondary: `
      bg-transparent
      text-gray-warm
      border
      border-gray-warm/30
      hover:border-gray-warm
      hover:bg-gray-warm/10
    `,
    dark: `
      bg-black-neutral
      text-gray-warm
      border
      border-black-neutral
      hover:bg-black-pure
      hover:border-black-pure
      hover:text-white
    `,
    "outline-dark": `
      bg-transparent
      text-black-neutral
      border
      border-border-light
      hover:border-black-neutral
      hover:bg-accent-soft/30
    `,
    "outline-light": `
      bg-transparent
      text-gray-warm
      border
      border-gray-warm/30
      hover:border-gray-warm
      hover:bg-gray-warm/10
    `,
    ghost: `
      bg-transparent
      text-current
      p-0
      w-auto
      hover:opacity-75
    `,
  };

  const content = (
    <>
      {icon && iconPosition === "left" && (
        <span className="mr-2 inline-block transition-transform duration-300 group-hover:-translate-x-1">
          {icon}
        </span>
      )}

      <span className="relative z-10">{children}</span>

      {variant === "ghost" && (
        <span className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
      )}

      {icon && iconPosition === "right" && (
        <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1 text-accent-ink">
          {icon}
        </span>
      )}
    </>
  );

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${
    variantClasses[variant]
  } ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClasses}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={combinedClasses}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
