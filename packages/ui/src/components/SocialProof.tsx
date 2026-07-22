import type { HTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export interface SocialProofProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of avatar image URLs. */
  avatars: string[];
  /** Text to display (can include HTML for highlighting). */
  text: string;
  /** Highlighted portion of text (will be styled with primary color). */
  highlight?: string;
}

/** Social proof component with overlapping avatars and text. */
export function SocialProof({
  avatars,
  text,
  highlight,
  className,
  ...props
}: SocialProofProps) {
  const renderText = () => {
    if (!highlight) return text;
    const parts = text.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="font-semibold text-primary">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={cn('flex items-center gap-4', className)} {...props}>
      <div className="flex -space-x-3">
        {avatars.slice(0, 4).map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="h-10 w-10 rounded-full border-2 border-background object-cover"
          />
        ))}
      </div>
      <p className="font-body text-sm text-foreground">{renderText()}</p>
    </div>
  );
}
