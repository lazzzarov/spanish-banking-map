interface Props {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  className?: string;
}

export function SectionChevron({ direction, label, onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`section-chevron flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-lg text-muted shadow-sm hover:border-accent hover:text-accent ${className}`}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}
