import { useId } from 'react';

import { cn } from '@/lib/utils';

/**
 * Labeled 0-100 control built on a native range input — keyboard-accessible
 * and screen-reader friendly with no extra dependency.
 */
export function AdjustSlider({
  label,
  hint,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const describedBy = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'h-11 w-full cursor-pointer appearance-none bg-transparent',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Thumb needs a vendor rule per engine; keep both in sync.
          '[&::-webkit-slider-runnable-track]:bg-secondary [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0',
          '[&::-moz-range-track]:bg-secondary [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full',
          '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0'
        )}
      />
      {hint && (
        <p
          id={describedBy}
          className="text-muted-foreground text-xs leading-relaxed"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
