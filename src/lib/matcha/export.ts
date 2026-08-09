/**
 * Export helpers. Both paths read from the already-rendered canvas in this tab
 * and hand the user a local download — nothing is transmitted anywhere.
 */

export class ExportUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportUnsupportedError';
  }
}

/**
 * Candidate recording types, best first, in two families.
 *
 * `MediaRecorder.isTypeSupported` is the only reliable oracle here, so nothing
 * is assumed from the browser name.
 *
 * Every audio-family entry must name an audio codec explicitly: browsers report
 * a bare `video/mp4` as supported and then drop the audio track, so listing one
 * here would let a silent export through as success.
 */
const WITH_AUDIO_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1.42E01E,opus',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8,vorbis',
  'video/x-matroska;codecs=avc1,opus',
];

const VIDEO_ONLY_TYPES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

function pickRecordingType(withAudio: boolean): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = withAudio ? WITH_AUDIO_TYPES : VIDEO_ONLY_TYPES;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function isVideoExportSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    pickRecordingType(false) !== null
  );
}

/** Whether a container that also carries audio is available. */
export function isAudioExportSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' && pickRecordingType(true) !== null
  );
}

/**
 * Map a recorder's real media type to a file extension.
 *
 * Driven by `recorder.mimeType` (what was actually negotiated), never by the
 * type we requested or by user-agent sniffing.
 */
export function extensionForMimeType(mimeType: string): string {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  switch (base) {
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/x-matroska':
      return 'mkv';
    case 'video/quicktime':
      return 'mov';
    default: {
      const subtype = base.split('/')[1];
      return subtype && /^[a-z0-9]+$/.test(subtype) ? subtype : 'webm';
    }
  }
}

/** Strip the original extension so we can append our own. */
function baseName(fileName: string): string {
  const trimmed = fileName.replace(/\.[^./\\]+$/, '');
  return trimmed.replace(/[^\w\-]+/g, '-').slice(0, 60) || 'export';
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Export the current canvas contents as a PNG download. */
export async function exportPhoto(
  canvas: HTMLCanvasElement,
  sourceName: string
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) {
    throw new ExportUnsupportedError(
      'This browser could not encode the image. Try Chrome, Edge, Safari, or Firefox.'
    );
  }
  downloadBlob(blob, `${baseName(sourceName)}-adjusted.png`);
}

export interface VideoExportHandle {
  /** Resolves once the recording is written and the download has started. */
  done: Promise<void>;
  /** Stop early and keep whatever has been recorded so far. */
  stop: () => void;
  /** The media type the recorder actually negotiated. */
  mimeType: string;
  /** Whether an audio track was attached to the recording stream. */
  hasAudio: boolean;
}

/**
 * Web Audio graphs are per-element and single-use: calling
 * `createMediaElementSource` twice on the same element throws. Cache the
 * source/destination pair so repeat exports of the same clip keep working.
 */
type AudioBridge = {
  context: AudioContext;
  destination: MediaStreamAudioDestinationNode;
};

const audioBridges = new WeakMap<HTMLMediaElement, AudioBridge>();

/**
 * Browsers cap concurrent AudioContexts (commonly ~6 per page), and a WeakMap
 * alone will not close them — the element can stay reachable long after its
 * media is replaced. Track them separately so `releaseSourceAudio` can close
 * the context when the caller discards the element.
 */
const openContexts = new Set<AudioContext>();

/**
 * Close the Web Audio graph built for `video`, if any.
 *
 * Call this when a media element is being discarded (mode switch, new file,
 * unmount). Safe to call when no bridge exists.
 */
export function releaseSourceAudio(video: HTMLMediaElement): void {
  const bridge = audioBridges.get(video);
  if (!bridge) return;
  audioBridges.delete(video);
  openContexts.delete(bridge.context);
  for (const track of bridge.destination.stream.getTracks()) track.stop();
  void bridge.context.close().catch(() => {});
}

/**
 * Outcome of trying to obtain the source's audio.
 *
 * The three cases are deliberately distinct: telling a user "the source had no
 * audio" when we merely failed to extract it is a false statement about their
 * file, so `unavailable` never collapses into `no-audio`.
 */
export type AudioSourceResult =
  | { status: 'attached'; track: MediaStreamTrack }
  /** The source is reliably known to carry no audio at all. */
  | { status: 'no-audio' }
  /** This browser could not extract the audio; we cannot say what the source has. */
  | { status: 'unavailable'; reason: string };

/**
 * Does the element positively report having no audio?
 *
 * Only trusted when a capture route already handed us a stream with zero audio
 * tracks — `captureStream()` exposes the element's real tracks, so an empty
 * audio list from a working capture is evidence, not a guess. Vendor flags are
 * checked as corroboration where they exist.
 */
function reportsNoAudio(video: HTMLVideoElement): boolean {
  const el = video as HTMLVideoElement & {
    mozHasAudio?: boolean;
    webkitAudioDecodedByteCount?: number;
    audioTracks?: { length: number };
  };
  if (el.mozHasAudio === false) return true;
  if (typeof el.audioTracks?.length === 'number')
    return el.audioTracks.length === 0;
  // Blink/WebKit: stays 0 for a genuinely silent file once decoding started.
  if (
    typeof el.webkitAudioDecodedByteCount === 'number' &&
    video.currentTime > 0
  ) {
    return el.webkitAudioDecodedByteCount === 0;
  }
  return false;
}

/**
 * Obtain an audio track carrying the source video's own audio.
 *
 * Three strategies, in order:
 * 1. `video.captureStream()` — keeps element and track on one clock, which is
 *    what preserves A/V sync. Chrome and Edge.
 * 2. `video.mozCaptureStream()` — the Firefox-prefixed equivalent.
 * 3. A Web Audio graph tapping the element into a MediaStream destination —
 *    the portable fallback, notably for Safari.
 *
 * Never throws. Returns `no-audio` only when a working capture route proved the
 * source has no audio; otherwise capability failures surface as `unavailable`.
 */
export function getSourceAudioTrack(
  video: HTMLVideoElement
): AudioSourceResult {
  const el = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };

  // Strategies 1 and 2: standard, then Firefox-prefixed.
  const captureRoutes: [string, (() => MediaStream) | undefined][] = [
    ['captureStream', el.captureStream?.bind(video)],
    ['mozCaptureStream', el.mozCaptureStream?.bind(video)],
  ];

  let captureProvedSilent = false;
  const captureFailures: string[] = [];

  for (const [name, capture] of captureRoutes) {
    if (!capture) continue;
    try {
      const tracks = capture().getAudioTracks();
      if (tracks[0]) return { status: 'attached', track: tracks[0] };
      // A working capture that yields no audio track is real evidence.
      captureProvedSilent = true;
    } catch (error) {
      captureFailures.push(
        `${name}: ${error instanceof Error ? error.message : 'failed'}`
      );
    }
  }

  if (captureProvedSilent && reportsNoAudio(video)) {
    return { status: 'no-audio' };
  }

  // Strategy 3: Web Audio bridge.
  const AudioContextCtor =
    typeof window !== 'undefined'
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)
      : undefined;

  if (!AudioContextCtor) {
    // No capture route worked and no Web Audio at all.
    if (captureProvedSilent) return { status: 'no-audio' };
    return {
      status: 'unavailable',
      reason: captureFailures.join('; ') || 'no audio capture API available',
    };
  }

  try {
    let bridge = audioBridges.get(video);
    if (!bridge) {
      const context = new AudioContextCtor();
      const source = context.createMediaElementSource(video);
      const destination = context.createMediaStreamDestination();
      source.connect(destination);
      // Also route to the speakers: createMediaElementSource otherwise
      // diverts the element's audio away from output entirely.
      source.connect(context.destination);
      bridge = { context, destination };
      audioBridges.set(video, bridge);
      openContexts.add(context);
    }
    void bridge.context.resume().catch(() => {});
    const track = bridge.destination.stream.getAudioTracks()[0];
    if (track) return { status: 'attached', track };
    // A destination with no track means the graph did not come up.
    return {
      status: 'unavailable',
      reason: 'Web Audio destination produced no audio track',
    };
  } catch (error) {
    if (captureProvedSilent) return { status: 'no-audio' };
    return {
      status: 'unavailable',
      reason: `${captureFailures.join('; ')}${captureFailures.length ? '; ' : ''}web audio: ${
        error instanceof Error ? error.message : 'failed'
      }`,
    };
  }
}

/**
 * Record the live canvas while the caller plays the source video back, mixing
 * in the source's own audio track when it has one.
 *
 * Recording is realtime by design: `captureStream` samples whatever the render
 * loop draws, so a 30s clip takes ~30s. The caller owns playback (seek to 0,
 * play, then call `stop` on `ended`).
 */
export function startVideoExport(
  canvas: HTMLCanvasElement,
  sourceName: string,
  fps: number,
  audioTrack?: MediaStreamTrack | null
): VideoExportHandle {
  if (typeof canvas.captureStream !== 'function') {
    throw new ExportUnsupportedError(
      'Video export needs canvas recording, which this browser does not support. Try the latest Chrome, Edge, or Firefox.'
    );
  }

  const wantAudio = Boolean(audioTrack);

  // With an audio track in hand we require a container that can carry audio.
  // Falling back to a video-only type here would produce a silent file from a
  // source that has sound, and present it as success — brief §4 forbids that.
  const requestedType = pickRecordingType(wantAudio);
  if (!requestedType) {
    throw new ExportUnsupportedError(
      wantAudio
        ? 'This browser cannot record video with an audio track reliably, so exporting would drop the original sound. Try the latest Chrome, Edge, or Firefox.'
        : 'Video export needs MediaRecorder, which this browser does not support. Try the latest Chrome, Edge, or Firefox.'
    );
  }

  const stream = canvas.captureStream(fps);
  const audioAttached = Boolean(audioTrack);
  if (audioTrack) stream.addTrack(audioTrack);

  const recorder = new MediaRecorder(stream, {
    mimeType: requestedType,
    videoBitsPerSecond: 8_000_000,
    ...(audioAttached ? { audioBitsPerSecond: 128_000 } : {}),
  });
  const chunks: Blob[] = [];

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  // Only tear down tracks this function owns — the caller's audio track
  // belongs to the source element and may be reused by a later export.
  const releaseOwnTracks = () => {
    for (const track of stream.getTracks()) {
      if (track !== audioTrack) track.stop();
    }
    if (audioTrack) stream.removeTrack(audioTrack);
  };

  const done = new Promise<void>((resolve, reject) => {
    recorder.addEventListener('error', () => {
      releaseOwnTracks();
      reject(new Error('Recording failed while writing the video.'));
    });
    recorder.addEventListener('stop', () => {
      releaseOwnTracks();
      if (chunks.length === 0) {
        reject(new Error('Recording produced no video data.'));
        return;
      }
      // Name the file from what the recorder really produced.
      const actualType = recorder.mimeType || requestedType;
      downloadBlob(
        new Blob(chunks, { type: actualType }),
        `${baseName(sourceName)}-adjusted.${extensionForMimeType(actualType)}`
      );
      resolve();
    });
  });

  recorder.start(1000);

  return {
    done,
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
    },
    mimeType: recorder.mimeType || requestedType,
    hasAudio: audioAttached,
  };
}
