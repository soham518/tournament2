import { cn } from "cn";

const URL_REGEX = /https?:\/\/[^\s]+/g;

// Renders free-text admin input (description, rules, eligibility notes)
// preserving the line breaks the admin typed, and turning any bare URL
// into a clickable link — without needing a rich-text editor upstream.
export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(URL_REGEX);
  const urls = text.match(URL_REGEX) ?? [];

  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part) nodes.push(part);
    if (urls[i]) {
      nodes.push(
        <a
          key={i}
          href={urls[i]}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--usw-secondary-fixed-dim)] underline"
        >
          {urls[i]}
        </a>
      );
    }
  });

  return <span className={cn("whitespace-pre-line", className)}>{nodes}</span>;
}
