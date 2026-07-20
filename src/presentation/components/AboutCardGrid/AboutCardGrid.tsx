interface AboutCardGridProps {
  /** Already-translated card texts; one card is rendered per entry. */
  items: string[];
  /** When true, each card is prefixed with its 1-based position. */
  numbered?: boolean;
}

/**
 * A responsive row of equal cards for the About page — the three steps, the
 * three uses, the three philosophy beats each render as one of these grids.
 *
 * @example <AboutCardGrid numbered items={[step1, step2, step3]} />
 */
export function AboutCardGrid({ items, numbered = false }: AboutCardGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item}
          className="flex flex-col gap-2 rounded border border-base-300 bg-base-200 p-4"
        >
          {numbered && (
            <span className="text-2xl font-bold leading-none opacity-30">
              {index + 1}
            </span>
          )}
          <p className="leading-relaxed opacity-80">{item}</p>
        </div>
      ))}
    </div>
  );
}
