// Waves pattern: 40px spacing, strokeWidth = 2px
// Uses SVG <pattern> for zero DOM overhead
export function WavesPattern({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="waves-pattern"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 20 Q 10 10 20 20 Q 30 30 40 20"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#waves-pattern)" />
    </svg>
  );
}
