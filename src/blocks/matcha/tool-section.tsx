import { Check, ShieldCheck } from 'lucide-react';

import type { MediaMode } from '@/lib/matcha';
import { m } from '@/paraglide/messages.js';
import {
  MatchaTool,
  type MatchaToolCopy,
} from '@/components/matcha/matcha-tool';

/**
 * The one place the tool's translations are assembled. All three tool pages
 * (`/`, `/from-photo`, `/from-video`) render this block and differ only in
 * `defaultMode` and heading — there is no second tool implementation.
 */
export function toolCopy(chooseFile?: string): MatchaToolCopy {
  return {
    chooseFile: chooseFile ?? m['tool.cta_file'](),
    processingPhoto: m['tool.processing_photo'](),
    processingVideo: m['tool.processing_video'](),
    progressLabel: m['tool.progress_label'](),
    successTitle: m['tool.success_title'](),
    successBody: m['tool.success_body'](),
    chooseAnother: m['tool.choose_another'](),
    localBadge: m['tool.local_badge'](),
    guideLabel: m['tool.after_export_guide'](),
    shareLabel: m['tool.after_export_share'](),
    copiedLabel: m['tool.after_export_copied'](),
    modePhoto: m['tool.mode_photo'](),
    modeVideo: m['tool.mode_video'](),
    dropPhotoTitle: m['tool.drop_photo_title'](),
    dropPhotoDescription: m['tool.drop_photo_description'](),
    dropVideoTitle: m['tool.drop_video_title'](),
    dropVideoDescription: m['tool.drop_video_description'](),
    privacyNote: m['tool.privacy_note'](),
    labelColor: m['tool.label_color'](),
    hintColor: m['tool.hint_color'](),
    labelNoise: m['tool.label_noise'](),
    hintNoise: m['tool.hint_noise'](),
    labelDetail: m['tool.label_detail'](),
    hintDetail: m['tool.hint_detail'](),
    original: m['tool.original'](),
    adjusted: m['tool.adjusted'](),
    reset: m['tool.reset'](),
    replace: m['tool.replace'](),
    exportPhoto: m['tool.export_photo'](),
    exportVideo: m['tool.export_video'](),
    exporting: m['tool.exporting'](),
    exportingHint: m['tool.exporting_hint'](),
    honestyNote: m['tool.honesty_note'](),
    // Paraglide parses `{format}` as a real message parameter.
    exportedAs: (format: string) => m['tool.exported_as']({ format }),
    audioAttached: m['tool.audio_attached'](),
    audioAbsent: m['tool.audio_absent'](),
    audioUnavailable: m['tool.audio_unavailable'](),
    webglUnsupported: m['tool.webgl_unsupported'](),
    videoExportUnsupported: m['tool.video_export_unsupported'](),
    loading: m['tool.loading'](),
    samplePhoto: m['tool.sample_photo'](),
    sampleError: m['tool.sample_error'](),
  };
}

/**
 * Tool-first hero: H1, one line of context, then the working tool — no
 * scrolling required to start.
 */
export function ToolSection({
  defaultMode,
  heading,
  subhead,
  eyebrow,
  chooseFile,
}: {
  defaultMode: MediaMode;
  heading: string;
  subhead: string;
  eyebrow?: string;
  /** Page-specific primary CTA (§3): Choose a File / Photo / Video. */
  chooseFile?: string;
}) {
  return (
    <section
      id="tool"
      className="paper-grain relative overflow-hidden px-4 pt-6 pb-14 sm:pt-10 sm:pb-20"
    >
      {/* Warm vignette behind the hero only. No depicted subject and no
          downloaded asset, so it costs nothing against the tool's LCP. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent_70%)]"
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 max-w-[46rem] sm:mb-8">
          {eyebrow && (
            <p className="text-muted-foreground mb-3 text-[11px] font-medium tracking-[0.22em] uppercase sm:mb-4">
              {eyebrow}
            </p>
          )}
          <h1 className="text-display font-serif font-normal text-balance">
            {heading}
          </h1>
          <p className="text-muted-foreground text-lede mt-3 max-w-[38rem] text-pretty sm:mt-4">
            {subhead}
          </p>
          {/* §4.1: privacy signal must be visible without scrolling. Given a
              real chip so it reads as a guarantee, not a caption. */}
          <ul className="mt-4 flex flex-wrap gap-2 sm:mt-5">
            {[
              { label: m['tool.trust_free'](), icon: Check },
              { label: m['tool.trust_no_account'](), icon: Check },
              { label: m['tool.local_badge'](), icon: ShieldCheck },
            ].map((item) => (
              <li
                key={item.label}
                className="border-border/70 bg-card/60 text-foreground/80 inline-flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-3 text-[13px] font-medium"
              >
                <item.icon className="size-3.5" strokeWidth={2.25} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <MatchaTool defaultMode={defaultMode} copy={toolCopy(chooseFile)} />
      </div>
    </section>
  );
}
