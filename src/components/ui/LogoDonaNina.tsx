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
      <circle cx="60" cy="60" r="58" fill="#F8F7F4" />

      <circle
        cx="60" cy="60" r="58"
        stroke="#7C1D2E" strokeWidth="3.5" fill="none"
        strokeLinecap="round"
      />
      <circle
        cx="60" cy="60" r="53.5"
        stroke="#7C1D2E" strokeWidth="1.2" fill="none"
        strokeLinecap="round"
      />

      <g stroke="#7C1D2E" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <g transform="translate(60,60) rotate(-24) translate(-60,-60)">
          <path d="M60 66 C56 80 50 92 46 98" strokeWidth="5" />
          <path d="M44 56 C40 44 36 34 34 27" strokeWidth="2.5" />
          <path d="M50 55 C46 44 43 34 41 27" strokeWidth="2.5" />
          <path d="M56 54 C53 44 50 34 48 27" strokeWidth="2.5" />
          <path d="M60 54 C58 44 56 34 54 27" strokeWidth="2.5" />
          <path d="M44 56 C50 62 56 64 60 66" strokeWidth="2.5" />
          <path d="M60 54 C62 60 63 63 60 66" strokeWidth="2.5" />
        </g>

        <g transform="translate(60,60) rotate(24) translate(-60,-60)">
          <path d="M60 66 C56 76 52 86 50 94" strokeWidth="4.5" />
          <path d="M52 58 C48 46 46 36 46 27" strokeWidth="2.2" />
          <path d="M64 58 C68 46 72 36 74 27" strokeWidth="2.8" />
          <path d="M46 27 C52 24 66 24 74 27" strokeWidth="2" />
          <path d="M52 58 C56 60 62 60 64 58" strokeWidth="2.5" />
        </g>
      </g>

      <path
        d="M60 48 C57 45 55 43 53 44 C50 46 52 50 60 54 C68 50 70 46 67 44 C65 43 63 45 60 48 Z"
        fill="#7C1D2E"
        stroke="none"
      />

      <g stroke="#7C1D2E" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="10" y1="53" x2="10" y2="58" />
        <line x1="10" y1="62" x2="10" y2="67" />
        <line x1="110" y1="53" x2="110" y2="58" />
        <line x1="110" y1="62" x2="110" y2="67" />
      </g>
    </svg>
  )
}
