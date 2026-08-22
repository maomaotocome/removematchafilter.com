import { useId, useState, type DragEvent } from 'react';
import { ImageIcon, ShieldCheck, UploadCloud, VideoIcon } from 'lucide-react';

import type { MediaMode } from '@/lib/matcha';
import { cn } from '@/lib/utils';

/**
 * File picker + drop target. Content arrives via props so the block layer owns
 * all copy and translations.
 */
export function MediaDropZone({
  mode,
  accept,
  title,
  description,
  browseLabel,
  privacyNote,
  localBadge,
  onFile,
  disabled,
}: {
  mode: MediaMode;
  accept: string;
  title: string;
  description: string;
  browseLabel: string;
  privacyNote: string;
  localBadge?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const titleId = useId();
  const ctaId = useId();
  const descriptionId = useId();
  const privacyId = useId();
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  const Icon = mode === 'video' ? VideoIcon : ImageIcon;

  return (
    <label
      aria-disabled={disabled || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'group border-border bg-card/50 focus-within:ring-ring flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none sm:gap-4 sm:px-6 sm:py-10',
        dragging && 'border-primary bg-primary/5',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      {localBadge && (
        <span className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
          <ShieldCheck className="size-3.5" />
          {localBadge}
        </span>
      )}
      <div className="bg-muted text-foreground/70 inline-flex size-10 items-center justify-center rounded-xl sm:size-12">
        <Icon className="size-5 sm:size-6" strokeWidth={1.75} />
      </div>
      <div className="space-y-1.5">
        <p id={titleId} className="text-base font-medium">
          {title}
        </p>
        <p
          id={descriptionId}
          className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed"
        >
          {description}
        </p>
      </div>
      <span
        data-file-cta
        id={ctaId}
        className="bg-primary text-primary-foreground group-hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium transition-colors"
      >
        <UploadCloud className="size-4" />
        {browseLabel}
      </span>
      <p
        id={privacyId}
        className="text-muted-foreground max-w-sm text-xs leading-relaxed"
      >
        {privacyNote}
      </p>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        aria-labelledby={`${titleId} ${ctaId}`}
        aria-describedby={`${descriptionId} ${privacyId}`}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so re-picking the same file still fires a change event.
          event.target.value = '';
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
