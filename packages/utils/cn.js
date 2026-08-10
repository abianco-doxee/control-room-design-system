// cn() — merge conditional class lists and de-conflict Tailwind utilities.
// The Control Room component classes (.cr-*) compose with Tailwind utilities;
// cn() lets a consumer override a utility safely (last-wins on conflicts) instead
// of shipping two competing classes. Standard clsx + tailwind-merge helper.
//
//   import { cn } from "@abianco-doxee/cr-design-system/cn";
//   cn("cr-btn", isPrimary && "cr-btn--accent", "px-4", className)
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
