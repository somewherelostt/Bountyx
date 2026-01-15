import { ButtonHTMLAttributes, forwardRef } from "react";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-black uppercase tracking-tight
      border-4 border-brutal-black
      transition-all duration-100 ease-in-out
      cursor-pointer select-none
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

    const variants = {
      primary: `
        bg-brutal-green text-brutal-black
        shadow-brutal
        hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5
        active:shadow-brutal-active active:translate-x-1 active:translate-y-1
        font-black text-opacity-100
      `,
      secondary: `
        bg-brutal-white text-brutal-black
        shadow-brutal
        hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5
        active:shadow-brutal-active active:translate-x-1 active:translate-y-1
      `,
      danger: `
        bg-brutal-pink text-brutal-black
        shadow-brutal
        hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5
        active:shadow-brutal-active active:translate-x-1 active:translate-y-1
      `,
      success: `
        bg-brutal-yellow text-brutal-black
        shadow-brutal
        hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5
        active:shadow-brutal-active active:translate-x-1 active:translate-y-1
      `,
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${widthClass}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BrutalButton.displayName = "BrutalButton";
