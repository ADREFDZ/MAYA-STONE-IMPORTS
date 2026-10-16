"use client";

import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      type = "text",
      className = "",
      id: customId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold cursor-pointer"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-accent-ink pointer-events-none z-10 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            {...props}
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`w-full bg-accent-soft border border-accent/25 text-maya-body font-sans text-black-neutral px-3.5 py-2.5 rounded-3xs transition-colors duration-200 focus:outline-none focus:border-accent placeholder:text-black-neutral/35 ${
              leftIcon ? "pl-10" : ""
            } ${
              error ? "border-red-500/80 focus:border-red-500" : ""
            } ${className}`}
          />
        </div>

        {error ? (
          <p
            id={errorId}
            className="font-mono text-maya-label text-red-600 px-0.5"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="font-mono text-maya-label text-black-neutral/50 px-0.5"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
