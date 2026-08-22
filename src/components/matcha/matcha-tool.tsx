import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  ImageIcon,
  Loader2,
  RotateCcw,
  Share2,
  ShieldCheck,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  durationBucketForMedia,
  sizeBucketForBytes,
  trackMatchaEvent,
  type MatchaDurationBucket,
  type MatchaErrorCode,
  type MatchaSizeBucket,
} from '@/lib/analytics/matcha-events';
import {
  analyzeFrame,
  clampParams,
  DEFAULT_PRESET,
  exportPhoto,
  ExportUnsupportedError,
  extensionForMimeType,
  fitWithin,
  getSourceAudioTrack,
  isVideoExportSupported,
  loadBundledPhotoSample,
  loadMedia,
  MatchaRenderer,
  MediaLoadError,
  modeForFile,
  PHOTO_ACCEPT,
  releaseSourceAudio,
  startVideoExport,
  VIDEO_ACCEPT,
  WebGLUnavailableError,
  type MatchaParams,
  type MediaMode,
  type SourceMedia,
  type SourceStats,
} from '@/lib/matcha';
import { cn } from '@/lib/utils';
import { AdjustSlider } from '@/components/matcha/adjust-slider';
import { MediaDropZone } from '@/components/matcha/media-drop-zone';

/** Long-edge render ceilings. Photos keep detail; videos stay recordable. */
const MAX_PHOTO_EDGE = 4096;
const MAX_VIDEO_EDGE = 1920;
const RECORD_FPS = 30;

interface MatchaAnalyticsContext {
  media_mode: MediaMode;
  size_bucket: MatchaSizeBucket;
  duration_bucket: MatchaDurationBucket;
  preset_id: 'default';
  processing_path: 'local_webgl';
}

class AnalyticsCodedExportError extends ExportUnsupportedError {
  readonly analyticsCode: MatchaErrorCode;

  constructor(analyticsCode: MatchaErrorCode, message: string) {
    super(message);
    this.name = 'AnalyticsCodedExportError';
    this.analyticsCode = analyticsCode;
  }
}

type VideoFrameElement = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: unknown) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/** Wait for an actual seek before starting capture; assigning currentTime is async. */
async function seekToStart(video: HTMLVideoElement): Promise<void> {
  if (
    video.currentTime === 0 &&
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new Error('The video could not seek to the beginning for export.')
      );
    }, 5_000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(
        new Error('The video could not seek to the beginning for export.')
      );
    };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = 0;
  });
}

export interface MatchaToolCopy {
  modePhoto: string;
  modeVideo: string;
  dropPhotoTitle: string;
  dropPhotoDescription: string;
  dropVideoTitle: string;
  dropVideoDescription: string;
  privacyNote: string;
  labelColor: string;
  hintColor: string;
  labelNoise: string;
  hintNoise: string;
  labelDetail: string;
  hintDetail: string;
  original: string;
  adjusted: string;
  reset: string;
  replace: string;
  exportPhoto: string;
  exportVideo: string;
  exporting: string;
  exportingHint: string;
  honestyNote: string;
  /** Formats the real container name into a sentence. */
  exportedAs: (format: string) => string;
  /** Track was attached to the recording — not a claim about playback. */
  audioAttached: string;
  /** Only used when the source is reliably known to be silent. */
  audioAbsent: string;
  /** Shown when this browser cannot extract the audio at all. */
  audioUnavailable: string;
  webglUnsupported: string;
  videoExportUnsupported: string;
  loading: string;
  samplePhoto: string;
  sampleError: string;
  /** Primary CTA on the empty state — differs per page (§3). */
  chooseFile: string;
  processingPhoto: string;
  processingVideo: string;
  progressLabel: string;
  successTitle: string;
  successBody: string;
  chooseAnother: string;
  localBadge: string;
  guideLabel: string;
  shareLabel: string;
  copiedLabel: string;
}

export function MatchaTool({
  defaultMode = 'photo',
  copy,
  className,
}: {
  defaultMode?: MediaMode;
  copy: MatchaToolCopy;
  className?: string;
}) {
  const [mode, setMode] = useState<MediaMode>(defaultMode);
  const [params, setParams] = useState<MatchaParams>(DEFAULT_PRESET);
  const [media, setMedia] = useState<SourceMedia | null>(null);
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [glSupported, setGlSupported] = useState(true);
  // Realtime recording progress (0-1) so Processing shows real movement
  // rather than an indeterminate spinner. Photos finish too fast to need it.
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  // What the last export actually contained, read back from the recorder.
  const [exportedAudio, setExportedAudio] = useState<boolean | null>(null);
  const [exportedType, setExportedType] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalVideoHostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MatchaRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
  const frameKindRef = useRef<'animation' | 'video' | null>(null);
  const mediaRef = useRef<SourceMedia | null>(null);
  const renderReadyMediaRef = useRef<SourceMedia | null>(null);
  const analyticsContextRef = useRef<MatchaAnalyticsContext | null>(null);
  // Latest params/stats read inside the rAF loop without restarting it.
  const paramsRef = useRef(params);
  const statsRef = useRef<SourceStats | null>(null);

  paramsRef.current = params;
  statsRef.current = stats;
  mediaRef.current = media;

  const videoExportSupported = useVideoExportSupported();

  const renderSize = useCallback((source: SourceMedia) => {
    return fitWithin(
      source,
      source.mode === 'video' ? MAX_VIDEO_EDGE : MAX_PHOTO_EDGE
    );
  }, []);

  /** Draw exactly one frame with the current params. */
  const drawOnce = useCallback(() => {
    const source = mediaRef.current;
    const renderer = rendererRef.current;
    const currentStats = statsRef.current;
    if (!source || !renderer || !currentStats) return;
    renderer.render(
      source.element,
      paramsRef.current,
      currentStats,
      renderSize(source)
    );
  }, [renderSize]);

  // Create the renderer once the canvas exists and media is loaded.
  useEffect(() => {
    if (!media || !canvasRef.current) return;
    if (rendererRef.current) return;
    try {
      rendererRef.current = new MatchaRenderer(canvasRef.current);
      setGlSupported(true);
      drawOnce();
      if (renderReadyMediaRef.current !== media) {
        const context = analyticsContextRef.current;
        if (context) trackMatchaEvent('matcha_render_ready', context);
        renderReadyMediaRef.current = media;
      }
    } catch (thrown) {
      rendererRef.current = null;
      renderReadyMediaRef.current = null;
      setGlSupported(false);
      setError(
        thrown instanceof WebGLUnavailableError
          ? copy.webglUnsupported
          : messageOf(thrown, copy.webglUnsupported)
      );
    }
  }, [media, drawOnce, copy.webglUnsupported]);

  // Mount the decoder element itself as the original preview. Using a second
  // <video src=...> would create an independent playback clock, so the
  // original and adjusted sides would drift as soon as either one was played
  // or seeked.
  useEffect(() => {
    if (media?.mode !== 'video' || !originalVideoHostRef.current) return;

    const host = originalVideoHostRef.current;
    const video = media.element as HTMLVideoElement;
    video.controls = true;
    video.className = 'block h-auto w-full';
    video.setAttribute('aria-label', copy.original);
    host.replaceChildren(video);

    return () => {
      if (video.parentNode === host) host.removeChild(video);
    };
  }, [media, copy.original]);

  // Video: redraw only when the decoder produces a new frame. Pause, ended
  // and hidden states do no GPU work. Browsers without the video-frame API use
  // requestAnimationFrame, still gated by real playback state.
  useEffect(() => {
    if (!media || !rendererRef.current) return;

    if (media.mode === 'photo') {
      drawOnce();
      return;
    }

    const video = media.element as VideoFrameElement;
    let cancelled = false;

    const cancelScheduledFrame = () => {
      if (frameRef.current === null) return;
      if (frameKindRef.current === 'video' && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameRef.current);
      } else {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      frameKindRef.current = null;
    };

    const scheduleFrame = () => {
      if (cancelled || video.paused || video.ended || document.hidden) return;

      if (video.requestVideoFrameCallback) {
        frameKindRef.current = 'video';
        frameRef.current = video.requestVideoFrameCallback(() => {
          frameRef.current = null;
          frameKindRef.current = null;
          if (cancelled) return;
          drawOnce();
          scheduleFrame();
        });
        return;
      }

      frameKindRef.current = 'animation';
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        frameKindRef.current = null;
        if (cancelled) return;
        drawOnce();
        scheduleFrame();
      });
    };

    const start = () => {
      cancelScheduledFrame();
      drawOnce();
      scheduleFrame();
    };

    const stop = () => {
      cancelScheduledFrame();
      drawOnce();
    };

    const handleVisibility = () => {
      if (document.hidden) cancelScheduledFrame();
      else if (!video.paused && !video.ended) start();
      else drawOnce();
    };

    video.addEventListener('play', start);
    video.addEventListener('pause', stop);
    video.addEventListener('ended', stop);
    video.addEventListener('seeked', drawOnce);
    document.addEventListener('visibilitychange', handleVisibility);

    drawOnce();
    void video.play().catch(() => {
      // Autoplay refusal is fine — the current frame is already rendered and
      // the visible source controls let the user start playback.
    });

    return () => {
      cancelled = true;
      cancelScheduledFrame();
      video.removeEventListener('play', start);
      video.removeEventListener('pause', stop);
      video.removeEventListener('ended', stop);
      video.removeEventListener('seeked', drawOnce);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [media, drawOnce]);

  // Photos always redraw on a control change. A paused video redraws once so
  // slider changes remain visible without restarting a continuous loop.
  useEffect(() => {
    if (!media || !rendererRef.current) return;
    if (media.mode === 'photo' || (media.element as HTMLVideoElement).paused) {
      drawOnce();
    }
  }, [media, params, drawOnce]);

  // Tear down GL + object URLs on unmount.
  useEffect(() => {
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      const current = mediaRef.current;
      if (current) {
        releaseSourceAudio(current.element as HTMLMediaElement);
        URL.revokeObjectURL(current.url);
      }
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      const detected = modeForFile(file);
      const sizeBucket = sizeBucketForBytes(file.size);
      trackMatchaEvent('matcha_file_selected', {
        media_mode: detected ?? 'unknown',
        size_bucket: sizeBucket,
        processing_path: 'local_webgl',
      });
      try {
        const next = await loadMedia(file);

        // Replacing media invalidates the GL context sizing/state; rebuild it.
        rendererRef.current?.dispose();
        rendererRef.current = null;
        renderReadyMediaRef.current = null;
        const previous = mediaRef.current;
        if (previous) {
          // Close any Web Audio graph bound to the outgoing element before
          // dropping it — AudioContexts are a capped resource.
          releaseSourceAudio(previous.element as HTMLMediaElement);
          URL.revokeObjectURL(previous.url);
        }

        if (detected && detected !== mode) setMode(detected);
        analyticsContextRef.current = {
          media_mode: next.mode,
          size_bucket: sizeBucket,
          duration_bucket: durationBucketForMedia(next.mode, next.duration),
          preset_id: 'default',
          processing_path: 'local_webgl',
        };
        setStats(analyzeFrame(next.element));
        setParams(DEFAULT_PRESET);
        setSucceeded(false);
        setMedia(next);
      } catch (thrown) {
        analyticsContextRef.current = null;
        renderReadyMediaRef.current = null;
        setMedia(null);
        setStats(null);
        setError(
          thrown instanceof MediaLoadError
            ? thrown.message
            : messageOf(thrown, 'That file could not be opened.')
        );
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  const handleSamplePhoto = useCallback(async () => {
    if (loading || exporting || mode !== 'photo') return;
    setError(null);
    setLoading(true);
    try {
      const sample = await loadBundledPhotoSample(
        '/imgs/examples/photo-portrait-before.jpg'
      );
      await handleFile(sample);
    } catch {
      setLoading(false);
      setError(copy.sampleError);
    }
  }, [copy.sampleError, exporting, handleFile, loading, mode]);

  function handleModeChange(next: MediaMode) {
    if (exporting || next === mode) return;
    setMode(next);
    // Media of the other kind can't render in the new mode's controls.
    if (media && media.mode !== next) {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      renderReadyMediaRef.current = null;
      analyticsContextRef.current = null;
      releaseSourceAudio(media.element as HTMLMediaElement);
      URL.revokeObjectURL(media.url);
      setMedia(null);
      setStats(null);
    }
    setError(null);
  }

  function handleChooseAnother() {
    const current = mediaRef.current;
    rendererRef.current?.dispose();
    rendererRef.current = null;
    renderReadyMediaRef.current = null;
    analyticsContextRef.current = null;
    if (current) {
      releaseSourceAudio(current.element as HTMLMediaElement);
      URL.revokeObjectURL(current.url);
    }
    setMedia(null);
    setStats(null);
    setSucceeded(false);
    setExportedAudio(null);
    setExportedType(null);
    setError(null);
  }

  function handleReset() {
    setParams(DEFAULT_PRESET);
    setSucceeded(false);
    trackMatchaEvent('matcha_preset_selected', {
      media_mode: analyticsContextRef.current?.media_mode ?? mode,
      preset_id: 'default',
      processing_path: 'local_webgl',
    });
  }

  async function handleExport() {
    const canvas = canvasRef.current;
    const source = mediaRef.current;
    if (!canvas || !source || exporting) return;

    setError(null);
    setSucceeded(false);
    setExporting(true);
    const analyticsContext = analyticsContextRef.current;
    if (analyticsContext) {
      trackMatchaEvent('matcha_export_started', analyticsContext);
    }

    try {
      if (source.mode === 'photo') {
        drawOnce();
        await exportPhoto(canvas, source.fileName);
      } else {
        await recordVideo(canvas, source);
      }
      setSucceeded(true);
      if (analyticsContext) {
        trackMatchaEvent('matcha_export_succeeded', analyticsContext);
      }
    } catch (thrown) {
      if (analyticsContext) {
        const errorCode: MatchaErrorCode =
          thrown instanceof AnalyticsCodedExportError
            ? thrown.analyticsCode
            : thrown instanceof ExportUnsupportedError
              ? 'export_unsupported'
              : 'export_failed';
        trackMatchaEvent('matcha_export_failed', {
          ...analyticsContext,
          error_code: errorCode,
        });
      }
      setError(messageOf(thrown, 'Export failed.'));
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (thrown) {
        if (thrown instanceof DOMException && thrown.name === 'AbortError') {
          return;
        }
      }
    }

    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        // Clipboard permissions vary by browser and embedding context. The
        // selection fallback below still works from this direct button click.
      }
    }
    if (!copied) {
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2_000);
  }

  /** Realtime capture: play the clip start-to-finish while recording. */
  async function recordVideo(canvas: HTMLCanvasElement, source: SourceMedia) {
    const video = source.element as HTMLVideoElement;
    const wasLooping = video.loop;
    video.loop = false;
    video.pause();
    await seekToStart(video);
    drawOnce();

    // Grab the source's own audio before recording so the export keeps it.
    const wasMuted = video.muted;
    const audio = getSourceAudioTrack(video);

    // Capability failure is not the same as a silent source. We cannot claim
    // the file has no audio, so refuse rather than hand over a silent export.
    if (audio.status === 'unavailable') {
      video.loop = wasLooping;
      throw new AnalyticsCodedExportError(
        'audio_unavailable',
        copy.audioUnavailable
      );
    }

    // Unmute for the duration: a muted element yields a silent track.
    const audioTrack = audio.status === 'attached' ? audio.track : null;
    if (audioTrack) video.muted = false;

    // Recording tracks playback, so playback position is real progress.
    const duration = source.duration > 0 ? source.duration : 0;
    const onProgress = () => {
      if (duration > 0) {
        setExportProgress(Math.min(1, video.currentTime / duration));
      }
    };
    setExportProgress(0);
    video.addEventListener('timeupdate', onProgress);

    let handle: ReturnType<typeof startVideoExport> | null = null;
    let stopOnEnd: (() => void) | null = null;

    try {
      // Do not start MediaRecorder until playback has genuinely begun. Under
      // load, play() can take seconds to resolve; recording the waiting period
      // would extend the video track while the audio track remains source-
      // length, creating an intermittent frozen tail and A/V drift.
      await video.play();
      drawOnce();
      handle = startVideoExport(
        canvas,
        source.fileName,
        RECORD_FPS,
        audioTrack
      );
      stopOnEnd = () => handle?.stop();
      video.addEventListener('ended', stopOnEnd, { once: true });
      await handle.done;
      // Report what was actually produced, not what we hoped for. `hasAudio`
      // proves a track was attached to the recording stream — it is not proof
      // that the encoded file plays back with sound, so the copy says
      // "attached", not "kept".
      setExportedAudio(handle.hasAudio);
      setExportedType(handle.mimeType);
    } finally {
      video.removeEventListener('timeupdate', onProgress);
      if (stopOnEnd) video.removeEventListener('ended', stopOnEnd);
      handle?.stop();
      video.loop = wasLooping;
      video.muted = wasMuted;
      video.currentTime = 0;
      void video.play().catch(() => {});
    }
  }

  const accept = mode === 'video' ? VIDEO_ACCEPT : PHOTO_ACCEPT;
  const hasMedia = Boolean(media);
  const controlsDisabled = !hasMedia || !glSupported || exporting;

  return (
    <div className={cn('space-y-5', className)}>
      <div
        role="group"
        aria-label={`${copy.modePhoto} / ${copy.modeVideo}`}
        className="bg-muted inline-flex rounded-full p-1"
      >
        {(['photo', 'video'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            disabled={exporting}
            onClick={() => handleModeChange(value)}
            className={cn(
              'min-h-11 rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              mode === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {value === 'photo' ? copy.modePhoto : copy.modeVideo}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Processing — realtime video recording cannot be interrupted safely,
          so the warning is explicit and the progress bar is real. */}
      {exporting && (
        <div
          role="status"
          aria-live="polite"
          className="border-border bg-card space-y-3 rounded-xl border px-4 py-3"
        >
          <div className="flex items-start gap-3 text-sm">
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
            <p className="leading-relaxed">
              {media?.mode === 'video'
                ? copy.processingVideo
                : copy.processingPhoto}
            </p>
          </div>
          {exportProgress !== null && (
            <div
              role="progressbar"
              aria-label={copy.progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(exportProgress * 100)}
              className="bg-secondary h-1.5 w-full overflow-hidden rounded-full"
            >
              <div
                className="bg-primary h-full transition-[width] duration-200"
                style={{ width: `${Math.round(exportProgress * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Success — result is downloadable and both next actions are offered. */}
      {succeeded && !exporting && (
        <div
          role="status"
          aria-live="polite"
          className="border-border bg-card flex flex-col gap-4 rounded-xl border px-4 py-4"
        >
          <div className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="text-foreground mt-0.5 size-4 shrink-0" />
            <p className="leading-relaxed">
              <span className="font-medium">{copy.successTitle}.</span>{' '}
              <span className="text-muted-foreground">{copy.successBody}</span>
              {/* Report the real container and audio outcome (§4). */}
              {exportedType && (
                <span className="text-muted-foreground">
                  {' '}
                  {copy.exportedAs(
                    extensionForMimeType(exportedType).toUpperCase()
                  )}{' '}
                  {exportedAudio ? copy.audioAttached : copy.audioAbsent}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/how-to-remove-matcha-filter"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors"
            >
              <BookOpen className="size-4" />
              {copy.guideLabel}
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="border-border hover:bg-accent inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
            >
              {shareCopied ? (
                <Check className="size-4" />
              ) : (
                <Share2 className="size-4" />
              )}
              {shareCopied ? copy.copiedLabel : copy.shareLabel}
            </button>
            <button
              type="button"
              onClick={handleChooseAnother}
              className="border-border hover:bg-accent inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors"
            >
              {copy.chooseAnother}
            </button>
          </div>
        </div>
      )}

      {!hasMedia ? (
        loading ? (
          <div
            role="status"
            aria-live="polite"
            className="border-border text-muted-foreground flex items-center justify-center gap-3 rounded-2xl border border-dashed py-20 text-sm"
          >
            <Loader2 className="size-4 animate-spin" />
            {copy.loading}
          </div>
        ) : (
          <div className="space-y-3">
            <MediaDropZone
              mode={mode}
              accept={accept}
              title={
                mode === 'video' ? copy.dropVideoTitle : copy.dropPhotoTitle
              }
              description={
                mode === 'video'
                  ? copy.dropVideoDescription
                  : copy.dropPhotoDescription
              }
              browseLabel={copy.chooseFile}
              privacyNote={copy.privacyNote}
              onFile={handleFile}
              disabled={loading}
            />
            {mode === 'photo' && (
              <div className="flex items-center justify-center gap-3">
                <span aria-hidden="true" className="bg-border h-px w-8" />
                <button
                  type="button"
                  data-sample-cta
                  onClick={handleSamplePhoto}
                  disabled={loading || exporting}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium underline decoration-current/35 underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ImageIcon className="size-4" aria-hidden="true" />
                  {copy.samplePhoto}
                </button>
                <span aria-hidden="true" className="bg-border h-px w-8" />
              </div>
            )}
          </div>
        )
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="space-y-2">
                <figcaption className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {copy.original}
                </figcaption>
                <div className="border-border bg-muted overflow-hidden rounded-xl border">
                  {media!.mode === 'video' ? (
                    <div ref={originalVideoHostRef} />
                  ) : (
                    <img
                      src={media!.url}
                      alt={copy.original}
                      className="block h-auto w-full"
                    />
                  )}
                </div>
              </figure>
              <figure className="space-y-2">
                <figcaption className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {copy.adjusted}
                </figcaption>
                <div className="border-border bg-muted overflow-hidden rounded-xl border">
                  <canvas
                    ref={canvasRef}
                    aria-label={copy.adjusted}
                    className="block h-auto w-full"
                  />
                </div>
              </figure>
            </div>

            <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              {copy.privacyNote}
            </p>
          </div>

          <div className="border-border bg-card h-fit space-y-6 rounded-2xl border p-5">
            <AdjustSlider
              label={copy.labelColor}
              hint={copy.hintColor}
              value={params.color}
              disabled={controlsDisabled}
              onChange={(color) =>
                setParams((prev) => clampParams({ ...prev, color }))
              }
            />
            <AdjustSlider
              label={copy.labelNoise}
              hint={copy.hintNoise}
              value={params.noise}
              disabled={controlsDisabled}
              onChange={(noise) =>
                setParams((prev) => clampParams({ ...prev, noise }))
              }
            />
            <AdjustSlider
              label={copy.labelDetail}
              hint={copy.hintDetail}
              value={params.detail}
              disabled={controlsDisabled}
              onChange={(detail) =>
                setParams((prev) => clampParams({ ...prev, detail }))
              }
            />

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                disabled={
                  controlsDisabled ||
                  (media!.mode === 'video' && !videoExportSupported)
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {copy.exporting}
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    {media!.mode === 'video'
                      ? copy.exportVideo
                      : copy.exportPhoto}
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={controlsDisabled}
                  className="border-border hover:bg-accent inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" />
                  {copy.reset}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleModeChange(mode === 'photo' ? 'video' : 'photo')
                  }
                  disabled={exporting}
                  className="border-border hover:bg-accent inline-flex h-10 flex-1 items-center justify-center rounded-full border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copy.replace}
                </button>
              </div>
            </div>

            {media!.mode === 'video' && (
              <p className="text-muted-foreground border-border border-t pt-4 text-xs leading-relaxed">
                {videoExportSupported
                  ? copy.exportingHint
                  : copy.videoExportUnsupported}
              </p>
            )}

            <p className="text-muted-foreground border-border border-t pt-4 text-xs leading-relaxed">
              {copy.honestyNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** MediaRecorder support can only be probed in the browser, post-hydration. */
function useVideoExportSupported(): boolean {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(isVideoExportSupported());
  }, []);
  return supported;
}

function messageOf(thrown: unknown, fallback: string): string {
  return thrown instanceof Error && thrown.message ? thrown.message : fallback;
}
