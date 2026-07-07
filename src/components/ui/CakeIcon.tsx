interface CakeIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function CakeIcon({ size = 22, className = "text-[#B8837E]", strokeWidth = 2 }: CakeIconProps) {
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
      <path d="M3 21h18" />
      <rect x="4" y="13" width="16" height="8" rx="1.5" />
      <rect x="6" y="8" width="12" height="6" rx="1.5" />
      <circle cx="12" cy="7" r="2" fill="#B8837E" stroke="none" />
      <path d="M12 5v-1" />
    </svg>
  );
}
