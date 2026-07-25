type ClubLogoProps = {
  className?: string;
  title?: string;
  showFrame?: boolean;
};

export function ClubLogo({
  className,
  title = "NUS Semiconductor Club",
  showFrame = true,
}: ClubLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {showFrame && (
        <rect
          x="9"
          y="9"
          width="102"
          height="102"
          rx="19"
          stroke="currentColor"
          strokeWidth="3.5"
        />
      )}
      <path d="M38 10v39" stroke="currentColor" strokeWidth="3.5" />
      <path d="M88 10v33" stroke="currentColor" strokeWidth="3.5" />
      <path d="M10 67h17v43" stroke="currentColor" strokeWidth="3.5" />
      <path d="M60 110V82" stroke="currentColor" strokeWidth="3.5" />
      <path d="m110 70-22 22" stroke="currentColor" strokeWidth="3.5" />
      <path
        d="m44 76 18-25h18"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {[
        [38, 53],
        [88, 47],
        [27, 67],
        [44, 78],
        [80, 51],
        [60, 78],
        [88, 92],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="5.5"
          stroke="currentColor"
          strokeWidth="3.5"
        />
      ))}
    </svg>
  );
}
