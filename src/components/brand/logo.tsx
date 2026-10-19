import { cn } from "@/lib/utils";

/**
 * Halden wordmark. Letterforms are drawn as geometric strokes so the mark renders
 * identically everywhere, with no font dependency. The "horizon" mark — a sun half
 * below the line — is the brand's symbol for the in-between hours.
 */
export function Logo({ className, withMark = true }: { className?: string; withMark?: boolean }) {
  return (
    <svg
      viewBox={withMark ? "-2 -2 151 24" : "-2 -2 119 24"}
      className={cn("h-5 w-auto", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role="img"
      aria-label="Halden"
    >
      <title>Halden</title>
      {withMark && <LogoMark />}
      <g transform={withMark ? "translate(32 0)" : undefined}>
        <path d="M0 0V20M12 0V20M0 10H12" />
        <path d="M20 20L27 0L34 20M23.2 13H30.8" />
        <path d="M42 0V20H53" />
        <path d="M61 0H66C72 0 75 4.5 75 10C75 15.5 72 20 66 20H61Z" />
        <path d="M94 0H83V20H94M83 10H92" />
        <path d="M102 20V0L115 20V0" />
      </g>
    </svg>
  );
}

function LogoMark() {
  return (
    <g>
      <circle cx="10" cy="10" r="9" />
      <path d="M10 10m-9 0a9 9 0 0 0 18 0Z" fill="currentColor" stroke="none" />
      <path d="M-1 10H21" />
    </g>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="-2 -2 24 24" className={cn("size-6", className)} fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <LogoMark />
    </svg>
  );
}
