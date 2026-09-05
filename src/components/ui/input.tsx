import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-sm border border-white/10 bg-[#070c15]/75 px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#748094] focus:border-[#d9ae4d]/80 focus:ring-2 focus:ring-[#d9ae4d]/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
