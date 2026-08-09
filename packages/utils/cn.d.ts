import type { ClassValue } from "clsx";

/** Merge conditional class lists and de-conflict Tailwind utilities (last wins). */
export declare function cn(...inputs: ClassValue[]): string;
export default cn;
