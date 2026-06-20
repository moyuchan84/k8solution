import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:   "bg-[#3182f6] text-white hover:bg-[#2272eb]",
        dark:      "bg-[#4e5968] text-white hover:bg-[#333d4b]",
        danger:    "bg-[#f04452] text-white hover:bg-[#e42939]",
        secondary: "bg-[rgba(100,168,255,0.15)] text-[#2272eb] hover:bg-[rgba(100,168,255,0.25)]",
        ghost:     "bg-[rgba(2,32,71,0.05)] text-[#4e5968] hover:bg-[rgba(2,32,71,0.1)]",
        outline:   "border border-[#e5e8eb] bg-white text-[#333d4b] hover:bg-[#f2f4f6]",
      },
      size: {
        sm:  "h-8  rounded-lg  px-3  text-[13px]",
        md:  "h-10 rounded-[10px] px-4  text-[15px]",
        lg:  "h-12 rounded-[14px] px-5  text-[17px]",
        xl:  "h-14 rounded-[16px] px-5  text-[17px]",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, fullWidth, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";
