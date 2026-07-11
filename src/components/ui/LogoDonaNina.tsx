interface LogoDonaNinaProps {
  size?: number
  className?: string
}

export default function LogoDonaNina({ size = 48, className }: LogoDonaNinaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="500" height="500" fill="#F8F7F4" rx="250" />

      <circle cx="250" cy="250" r="242" stroke="#7C1D2E" strokeWidth="6" fill="none" />
      <circle cx="250" cy="250" r="230" stroke="#7C1D2E" strokeWidth="2" fill="none" />

      <g stroke="#7C1D2E" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(250,250) rotate(-24) translate(-250,-250)">
          <path d="M244 270 Q240 330 236 390" strokeWidth="8" />
          <path d="M256 270 Q260 330 264 390" strokeWidth="8" />
          <path d="M236 390 Q240 398 250 398 Q260 398 264 390" strokeWidth="6" />
          <path d="M235 245 Q228 190 220 138" strokeWidth="4" />
          <path d="M243 244 Q237 190 231 136" strokeWidth="4" />
          <path d="M250 243 Q246 190 241 135" strokeWidth="4" />
          <path d="M258 244 Q255 190 250 137" strokeWidth="4" />
          <path d="M235 245 Q244 253 256 270" strokeWidth="5" />
          <path d="M258 244 Q252 254 244 270" strokeWidth="5" />
        </g>

        <g transform="translate(250,250) rotate(24) translate(-250,-250)">
          <path d="M244 270 Q240 325 236 380" strokeWidth="7" />
          <path d="M256 270 Q256 325 256 380" strokeWidth="5" />
          <path d="M236 380 Q240 388 250 388 Q260 388 264 380" strokeWidth="6" />
          <path d="M242 248 Q250 258 258 248" strokeWidth="5" />
          <path d="M258 242 Q264 190 270 138" strokeWidth="5" />
          <path d="M242 242 Q236 190 233 142" strokeWidth="3" />
          <path d="M233 142 Q242 132 270 138" strokeWidth="3" />
        </g>
      </g>

      <path
        d="M250 200 C230 182 212 200 232 220 C242 230 250 236 250 236 C250 236 258 230 268 220 C288 200 270 182 250 200 Z"
        fill="#7C1D2E"
      />

      <g stroke="#7C1D2E" strokeWidth="4" strokeLinecap="round" fill="none">
        <line x1="80" y1="238" x2="80" y2="250" />
        <line x1="80" y1="256" x2="80" y2="268" />
        <line x1="420" y1="238" x2="420" y2="250" />
        <line x1="420" y1="256" x2="420" y2="268" />
      </g>
    </svg>
  )
}
