import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4bd68]/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#d9ae4d] text-[#0b101b] shadow-[0_8px_28px_rgb(217_174_77_/_18%)] hover:-translate-y-0.5 hover:bg-[#efc970] hover:shadow-[0_12px_32px_rgb(217_174_77_/_28%)]",
        outline:
          "border border-[#d9ae4d]/55 bg-[#d9ae4d]/5 text-[#f7e9c5] hover:border-[#d9ae4d] hover:bg-[#d9ae4d]/10",
        ghost: "text-[#c8d0de] hover:bg-white/5 hover:text-white",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
