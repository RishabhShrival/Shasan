import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-sm border border-white/[0.09] bg-[#101827]/80 shadow-card-lift backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
