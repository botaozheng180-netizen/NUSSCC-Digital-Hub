type ClubLogoProps = {
  className?: string;
  title?: string;
  showFrame?: boolean;
};

/**
 * The interconnect geometry from the club's official mark.
 *
 * The frame is optional because the dashboard chip's thick white border forms
 * the frame there. The traces deliberately terminate at the view-box edge so
 * they meet that border instead of appearing as a second, inset icon.
 */
export function ClubLogo({
  className,
  title = "NUS Semiconductor Club",
  showFrame = true,
}: ClubLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {showFrame && (
        <rect
          x="9"
          y="9"
          width="494"
          height="494"
          rx="47"
          stroke="currentColor"
          strokeWidth="18"
        />
      )}

      <g
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M147 0v185" />
        <path d="M430 0v136" />
        <path d="M64 313v199" />
        <path d="M257 512V423" />
        <path d="M512 354 455 426" />
        <path d="M185 344v-63l105-127h22" />
      </g>

      {[
        [147, 204],
        [430, 157],
        [64, 290],
        [185, 362],
        [257, 400],
        [330, 153],
        [443, 442],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="17"
          stroke="currentColor"
          strokeWidth="14"
        />
      ))}
    </svg>
  );
}
