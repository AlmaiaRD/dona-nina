interface LogoDonaNinaProps {
  size?: number
  className?: string
}

export default function LogoDonaNina({ size = 48, className }: LogoDonaNinaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="logoClip">
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="58" fill="#F8F7F4" />

      <circle
        cx="60" cy="60" r="58"
        stroke="#7C1D2E" strokeWidth="3.5" fill="none"
        strokeLinecap="round"
      />
      <circle
        cx="60" cy="60" r="55"
        stroke="#7C1D2E" strokeWidth="1.2" fill="none"
        strokeLinecap="round"
      />

      <g clipPath="url(#logoClip)" stroke="#7C1D2E" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <g transform="translate(60,60) rotate(-24) translate(-60,-60)">
          <path d="M57 65 C52 78 45 92 40 99" strokeWidth="3.2" />
          <path d="M63 65 C68 78 75 92 80 99" strokeWidth="3.2" />
          <path d="M40 99 C45 102 52 102 60 102 C68 102 75 102 80 99" strokeWidth="2.8" />
          <path d="M46 58 C41 47 36 38 32 30" strokeWidth="2.5" />
          <path d="M51 57 C47 47 43 38 40 29" strokeWidth="2.5" />
          <path d="M56 56 C53 46 50 37 48 28" strokeWidth="2.5" />
          <path d="M60 56 C58 46 56 37 55 28" strokeWidth="2.5" />
          <path d="M46 58 C51 62 55 63 57 65" strokeWidth="2.5" />
          <path d="M60 56 C62 60 63 62 63 65" strokeWidth="2.5" />
        </g>

        <g transform="translate(60,60) rotate(24) translate(-60,-60)">
          <path d="M57 65 C52 78 47 92 44 99" strokeWidth="3.2" />
          <path d="M63 65 C63 78 63 92 63 99" strokeWidth="2.2" />
          <path d="M44 99 C48 102 55 102 60 102 C65 102 72 102 63 99" strokeWidth="2.8" />
          <path d="M52 58 C47 48 44 38 46 30" strokeWidth="2.2" />
          <path d="M64 58 C68 48 72 38 74 30" strokeWidth="2.8" />
          <path d="M46 30 C52 27 64 27 74 30" strokeWidth="2.2" />
          <path d="M52 58 C56 60 60 60 64 58" strokeWidth="2.5" />
        </g>
      </g>

      <path
        d="M60 47 C57 43 54 40 52 42 C48 46 52 50 60 56 C68 50 72 46 68 42 C66 40 63 43 60 47 Z"
        fill="#7C1D2E"
        stroke="none"
      />

      <g stroke="#7C1D2E" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <line x1="30" y1="54" x2="30" y2="59" />
        <line x1="30" y1="62" x2="30" y2="67" />
        <line x1="90" y1="54" x2="90" y2="59" />
        <line x1="90" y1="62" x2="90" y2="67" />
      </g>
    </svg>
  )
}
