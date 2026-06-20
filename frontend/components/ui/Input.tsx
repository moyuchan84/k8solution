import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[14px] font-semibold text-[#333d4b]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-[14px] border px-4 py-[14px] text-[17px] text-[#333d4b] placeholder:text-[#b0b8c1]",
            "bg-[rgba(0,23,51,0.02)] border-[rgba(2,32,71,0.05)]",
            "transition-colors duration-150",
            "focus:border-[#3182f6] focus:bg-white",
            error && "border-[#f04452] focus:border-[#f04452]",
            className
          )}
          {...props}
        />
        {error && <p className="text-[13px] text-[#f04452]">{error}</p>}
        {hint && !error && <p className="text-[13px] text-[#8b95a1]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
