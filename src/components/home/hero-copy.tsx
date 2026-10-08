/**
 * Hero copy entrance runs on CSS keyframes so the headline animates on first paint without
 * waiting for JavaScript; reduced-motion users see the final state immediately.
 */
export function HeroCopy({
  eyebrow,
  headline,
  subheadline,
}: {
  eyebrow: string;
  headline: string;
  subheadline: string;
}) {
  const words = headline.split(" ");
  return (
    <div className="max-w-5xl">
      {eyebrow ? (
        <p className="eyebrow mb-6 flex animate-fade-up items-center gap-3 text-ivory [animation-delay:150ms]">
          <span aria-hidden className="h-px w-10 bg-ivory/60" />
          {eyebrow}
        </p>
      ) : null}
      <h1 id="hero-heading" className="font-display text-display-1 font-normal text-balance">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden pb-[0.08em] align-bottom"
          >
            <span
              className="inline-block animate-rise"
              style={{ animationDelay: `${250 + index * 60}ms` }}
            >
              {word}
              {index < words.length - 1 ? " " : ""}
            </span>
          </span>
        ))}
      </h1>
      {subheadline ? (
        <p className="mt-6 max-w-xl animate-fade-up text-lead text-ivory [animation-delay:550ms]">
          {subheadline}
        </p>
      ) : null}
    </div>
  );
}
