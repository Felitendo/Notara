// Icon pattern: 60px spacing, 24px icons in a hex grid layout
// Uses SVG <pattern> for zero DOM overhead instead of rendering thousands of elements

const ICON_SVG_PATHS: Record<string, string> = {
  pattern_groceries:
    '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  pattern_music:
    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  pattern_travel:
    '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  pattern_code:
    '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
};

const ICON_ROTATIONS: Record<string, number> = {
  pattern_travel: 0.5,
};

export function IconPattern({
  patternId,
  color,
}: {
  patternId: string;
  color: string;
}) {
  const svgPath = ICON_SVG_PATHS[patternId];
  if (!svgPath) return null;

  const rotation = ICON_ROTATIONS[patternId] ?? 0;
  const rotationDeg = rotation * (180 / Math.PI);
  const hasRotation = rotationDeg !== 0;

  // Hex grid: two icons per 60x120 tile, offset to create staggered rows
  // Icons are 24x24, centered at (20, 20) and (50, 80)
  const positions = [
    { cx: 20, cy: 20 },
    { cx: 50, cy: 80 },
  ];

  const svgId = `icon-${patternId}`;

  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id={svgId}
          x="0"
          y="0"
          width="60"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {positions.map(({ cx, cy }, i) => (
            <g
              key={i}
              transform={
                hasRotation
                  ? `translate(${cx}, ${cy}) rotate(${rotationDeg}) translate(-12, -12)`
                  : `translate(${cx - 12}, ${cy - 12})`
              }
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: svgPath }}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${svgId})`} />
    </svg>
  );
}
