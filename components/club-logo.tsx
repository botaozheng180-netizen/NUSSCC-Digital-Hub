type ClubLogoProps = {
  className?: string;
  title?: string;
};

export function ClubLogo({
  className,
  title = "NUS Semiconductor Club",
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
      <rect
        x="11"
        y="11"
        width="98"
        height="98"
        rx="18"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path d="M38 12v37" stroke="currentColor" strokeWidth="5" />
      <path d="M88 12v31" stroke="currentColor" strokeWidth="5" />
      <path d="M12 67h16v41" stroke="currentColor" strokeWidth="5" />
      <path d="M60 108V82" stroke="currentColor" strokeWidth="5" />
      <path d="M108 72 90 90" stroke="currentColor" strokeWidth="5" />
      <path
        d="m44 76 18-25h15"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="53" r="7" fill="currentColor" />
      <circle cx="88" cy="47" r="7" fill="currentColor" />
      <circle cx="27" cy="67" r="7" fill="currentColor" />
      <circle cx="44" cy="78" r="7" fill="currentColor" />
      <circle cx="80" cy="51" r="7" fill="currentColor" />
      <circle cx="60" cy="78" r="7" fill="currentColor" />
      <circle cx="88" cy="92" r="7" fill="currentColor" />
      <g fill="var(--logo-cutout, #071944)">
        <circle cx="38" cy="53" r="2.4" />
        <circle cx="88" cy="47" r="2.4" />
        <circle cx="27" cy="67" r="2.4" />
        <circle cx="44" cy="78" r="2.4" />
        <circle cx="80" cy="51" r="2.4" />
        <circle cx="60" cy="78" r="2.4" />
        <circle cx="88" cy="92" r="2.4" />
      </g>
    </svg>
  );
}
