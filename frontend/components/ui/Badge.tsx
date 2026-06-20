import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center font-bold",
  {
    variants: {
      variant: {
        blue:     "bg-[#3182f6] text-white",
        green:    "bg-[#03b26c] text-white",
        red:      "bg-[#f04452] text-white",
        yellow:   "bg-[#fe9800] text-white",
        "blue-weak":  "bg-[rgba(100,168,255,0.15)] text-[#2272eb]",
        "green-weak": "bg-[rgba(3,178,108,0.15)] text-[#03b26c]",
        "red-weak":   "bg-[rgba(240,68,82,0.15)] text-[#e42939]",
        neutral:  "bg-[rgba(2,32,71,0.05)] text-[#4e5968]",
      },
      size: {
        sm: "h-[21px] rounded-[9px] px-[7px] text-[10px]",
        md: "h-[26px] rounded-[12px] px-[7px] text-[13px]",
        lg: "h-[29px] rounded-[13px] px-[8px] text-[14px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
