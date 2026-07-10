interface CakeIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function CakeIcon({ size = 22, className = "text-[#7C1D2E]", strokeWidth = 1.8 }: CakeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <g transform="translate(12,12) rotate(-25) translate(-12,-12)">
        <path d="M12 4v14" />
        <path d="M8 4v3" />
        <path d="M10 4v6" />
        <path d="M14 4v6" />
        <path d="M16 4v3" />
        <path d="M12 18v2" />
      </g>
      <g transform="translate(12,12) rotate(25) translate(-12,-12)">
        <path d="M18 4v16" />
        <path d="M18 4c-2.5 0-4 2-4 4.5" />
      </g>
    </svg>
  );
}
