import type { SVGProps } from "react";

type PulseoddMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/** The Pulseodd mark: a bold P on a lime field with a subtle OD pattern. */
export function PulseoddMark({ title, ...props }: PulseoddMarkProps) {
  return (
    <svg viewBox="0 0 100 100" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <rect width="100" height="100" rx="3" fill="currentColor" />
      <g opacity="0.14" fill="#081119">
        <text x="-9" y="21" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 10 16)">OD</text>
        <text x="36" y="18" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 55 13)">OD</text>
        <text x="75" y="30" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 84 24)">OD</text>
        <text x="5" y="48" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 22 42)">OD</text>
        <text x="48" y="52" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 64 46)">OD</text>
        <text x="-7" y="78" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 12 72)">OD</text>
        <text x="40" y="83" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 58 77)">OD</text>
        <text x="76" y="82" fontFamily="Arial Black, Inter, sans-serif" fontSize="16" fontWeight="900" transform="rotate(-18 91 76)">OD</text>
      </g>
      <path d="M33 78V22h28c16 0 27 10 27 25S77 71 61 71H50v7H33Zm17-23h10c7 0 11-3 11-9s-4-9-11-9H50v18Z" fill="#081119" />
    </svg>
  );
}
