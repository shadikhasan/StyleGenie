import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-transparent.png";

type LogoMarkProps = ComponentPropsWithoutRef<"img">;

export const LogoMark = ({ className, alt = "StyleGenie logo", ...props }: LogoMarkProps) => (
  <img
    src={logo}
    alt={alt}
    className={cn("inline-block object-contain", className)}
    {...props}
  />
);
