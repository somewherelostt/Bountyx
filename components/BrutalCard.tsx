import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";

type MotionDivProps = ComponentPropsWithoutRef<typeof motion.div>;

interface BrutalCardProps extends MotionDivProps {
  variant?: "default" | "green" | "pink" | "yellow" | "dark";
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      hover = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      border-4 border-brutal-black
      shadow-brutal
    `;

    const variants = {
      default: "bg-brutal-white",
      green: "bg-brutal-green",
      pink: "bg-brutal-pink",
      yellow: "bg-brutal-yellow",
      dark: "bg-brutal-black text-brutal-white border-brutal-white",
    };

    const paddings = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <motion.div
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${paddings[padding]}
          ${hover ? "cursor-pointer" : ""}
          ${className}
        `}
        whileHover={
          hover
            ? {
                x: -2,
                y: -2,
                boxShadow: "6px 6px 0px 0px #000000",
              }
            : undefined
        }
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

BrutalCard.displayName = "BrutalCard";
