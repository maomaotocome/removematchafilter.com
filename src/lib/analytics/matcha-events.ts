import type { MediaMode } from '@/lib/matcha/types';

export const MATCHA_EVENT_NAMES = [
  'matcha_file_selected',
  'matcha_render_ready',
  'matcha_export_started',
  'matcha_export_succeeded',
  'matcha_export_failed',
  'matcha_preset_selected',
  'matcha_ai_offer_viewed',
  'matcha_ai_opt_in',
  'matcha_ai_succeeded',
  'matcha_ai_failed',
] as const;

export type MatchaEventName = (typeof MATCHA_EVENT_NAMES)[number];

export type MatchaMediaMode = MediaMode | 'unknown';
export type MatchaSizeBucket =
  | 'under_1_mb'
  | '1_10_mb'
  | '10_50_mb'
  | 'over_50_mb';
export type MatchaDurationBucket =
  | 'not_applicable'
  | 'unknown'
  | 'under_10_s'
  | '10_30_s'
  | '30_60_s'
  | 'over_60_s';
export type MatchaPresetId = 'default';
export type MatchaProcessingPath = 'local_webgl';
export type MatchaErrorCode =
  | 'export_unsupported'
  | 'audio_unavailable'
  | 'export_failed';

type MatchaParameterName =
  | 'media_mode'
  | 'size_bucket'
  | 'duration_bucket'
  | 'preset_id'
  | 'processing_path'
  | 'error_code';

export type MatchaEventParameters = Partial<
  Record<MatchaParameterName, string>
>;

interface SanitizedMatchaEvent {
  name: MatchaEventName;
  parameters: MatchaEventParameters;
}

type MatchaAnalyticsWindow = Window &
  typeof globalThis & {
    gtag?: (...args: unknown[]) => void;
    /** Set only by an explicit consent integration; absent means default-deny. */
    __matchaAnalyticsConsent?: MatchaAnalyticsConsent;
    /** Present only in browser QA; receives already-sanitized events. */
    __matchaAnalyticsTestEvents?: SanitizedMatchaEvent[];
    /** QA-only bridge; installed only when the test event array already exists. */
    __matchaAnalyticsTestTrack?: (name: unknown, parameters?: unknown) => void;
    /** QA-only bridge for boundary testing of the real bucket function. */
    __matchaAnalyticsTestSizeBucket?: typeof sizeBucketForBytes;
  };

export type MatchaAnalyticsConsent = 'unknown' | 'granted' | 'denied';

const MB = 1024 * 1024;
const MAX_QUEUE_LENGTH = 32;
const MAX_FLUSH_ATTEMPTS = 40;
const FLUSH_INTERVAL_MS = 250;
const MATCHA_EVENT_NAME_SET = new Set<string>(MATCHA_EVENT_NAMES);

const PARAMETER_VALUES = {
  media_mode: ['photo', 'video', 'unknown'],
  size_bucket: ['under_1_mb', '1_10_mb', '10_50_mb', 'over_50_mb'],
  duration_bucket: [
    'not_applicable',
    'unknown',
    'under_10_s',
    '10_30_s',
    '30_60_s',
    'over_60_s',
  ],
  preset_id: ['default'],
  processing_path: ['local_webgl'],
  error_code: ['export_unsupported', 'audio_unavailable', 'export_failed'],
} as const satisfies Record<MatchaParameterName, readonly string[]>;

const EVENT_PARAMETERS = {
  matcha_file_selected: ['media_mode', 'size_bucket', 'processing_path'],
  matcha_render_ready: [
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
  ],
  matcha_export_started: [
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
  ],
  matcha_export_succeeded: [
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
  ],
  matcha_export_failed: [
    'media_mode',
    'size_bucket',
    'duration_bucket',
    'preset_id',
    'processing_path',
    'error_code',
  ],
  matcha_preset_selected: ['media_mode', 'preset_id', 'processing_path'],
  // Reserved for the optional-AI phase. They cannot carry parameters until
  // that phase reviews and adds an explicit contract.
  matcha_ai_offer_viewed: [],
  matcha_ai_opt_in: [],
  matcha_ai_succeeded: [],
  matcha_ai_failed: [],
} as const satisfies Record<MatchaEventName, readonly MatchaParameterName[]>;

const pendingEvents: SanitizedMatchaEvent[] = [];
let flushTimer: number | null = null;
let flushAttempts = 0;

export function sizeBucketForBytes(bytes: number): MatchaSizeBucket {
  // File.size is always a finite non-negative integer. Invalid direct calls
  // fall into the smallest bucket rather than becoming a unique value.
  if (!Number.isFinite(bytes) || bytes < MB) return 'under_1_mb';
  if (bytes < 10 * MB) return '1_10_mb';
  if (bytes < 50 * MB) return '10_50_mb';
  return 'over_50_mb';
}

export function durationBucketForMedia(
  mode: MediaMode,
  seconds: number
): MatchaDurationBucket {
  if (mode === 'photo') return 'not_applicable';
  if (!Number.isFinite(seconds) || seconds <= 0) return 'unknown';
  if (seconds < 10) return 'under_10_s';
  if (seconds < 30) return '10_30_s';
  if (seconds < 60) return '30_60_s';
  return 'over_60_s';
}

/**
 * In-memory consent bridge for a future reviewed consent component. Nothing is
 * persisted, and unknown/denied immediately clears any pending product event.
 */
export function setMatchaAnalyticsConsent(
  consent: MatchaAnalyticsConsent
): void {
  if (typeof window === 'undefined') return;
  const analyticsWindow = window as MatchaAnalyticsWindow;
  analyticsWindow.__matchaAnalyticsConsent = consent;

  if (consent !== 'granted') {
    pendingEvents.length = 0;
    flushAttempts = 0;
    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
  }
}

/**
 * Send one allowlisted, low-cardinality product event through the existing
 * delayed GA loader. The helper neither loads a script nor performs a request.
 * Invalid keys/values are discarded at runtime, and every failure is a no-op.
 */
export function trackMatchaEvent(
  name: MatchaEventName,
  parameters: MatchaEventParameters = {}
): void {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as MatchaAnalyticsWindow;
  installTestHooks(analyticsWindow);
  // Product events are stricter than the existing pageview integration. They
  // are default-deny and are neither captured nor queued before explicit
  // in-memory consent is granted.
  if (analyticsWindow.__matchaAnalyticsConsent !== 'granted') return;
  if (!MATCHA_EVENT_NAME_SET.has(name as string)) return;

  const safeParameters =
    parameters && typeof parameters === 'object' ? parameters : {};
  const event = sanitizeEvent(name, safeParameters);

  // The QA hook exists only when an init script creates it. It receives the
  // exact sanitized payload, never the caller's object.
  analyticsWindow.__matchaAnalyticsTestEvents?.push({
    name: event.name,
    parameters: { ...event.parameters },
  });

  if (deliver(analyticsWindow, event)) {
    flushPending(analyticsWindow);
    return;
  }

  if (pendingEvents.length >= MAX_QUEUE_LENGTH) pendingEvents.shift();
  pendingEvents.push(event);
  scheduleFlush(analyticsWindow);
}

function installTestHooks(analyticsWindow: MatchaAnalyticsWindow): void {
  if (!Array.isArray(analyticsWindow.__matchaAnalyticsTestEvents)) return;

  analyticsWindow.__matchaAnalyticsTestTrack ??= (name, parameters) => {
    trackMatchaEvent(
      name as MatchaEventName,
      parameters && typeof parameters === 'object'
        ? (parameters as MatchaEventParameters)
        : {}
    );
  };
  analyticsWindow.__matchaAnalyticsTestSizeBucket ??= sizeBucketForBytes;
}

function sanitizeEvent(
  name: MatchaEventName,
  parameters: MatchaEventParameters
): SanitizedMatchaEvent {
  const sanitized: MatchaEventParameters = {};

  for (const key of EVENT_PARAMETERS[name]) {
    const value = parameters[key];
    if (
      typeof value === 'string' &&
      (PARAMETER_VALUES[key] as readonly string[]).includes(value)
    ) {
      sanitized[key] = value;
    }
  }

  return { name, parameters: sanitized };
}

function deliver(
  analyticsWindow: MatchaAnalyticsWindow,
  event: SanitizedMatchaEvent
): boolean {
  if (typeof analyticsWindow.gtag !== 'function') return false;

  try {
    analyticsWindow.gtag('event', event.name, event.parameters);
    return true;
  } catch {
    return false;
  }
}

function flushPending(analyticsWindow: MatchaAnalyticsWindow): void {
  if (analyticsWindow.__matchaAnalyticsConsent !== 'granted') {
    pendingEvents.length = 0;
    flushAttempts = 0;
    return;
  }
  if (typeof analyticsWindow.gtag !== 'function') return;

  while (pendingEvents.length > 0) {
    const event = pendingEvents[0];
    if (!deliver(analyticsWindow, event)) return;
    pendingEvents.shift();
  }

  flushAttempts = 0;
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function scheduleFlush(analyticsWindow: MatchaAnalyticsWindow): void {
  if (flushTimer !== null) return;
  if (flushAttempts >= MAX_FLUSH_ATTEMPTS) flushAttempts = 0;

  const attempt = () => {
    flushTimer = null;
    flushAttempts += 1;
    flushPending(analyticsWindow);

    if (pendingEvents.length > 0 && flushAttempts < MAX_FLUSH_ATTEMPTS) {
      flushTimer = window.setTimeout(attempt, FLUSH_INTERVAL_MS);
    }
  };

  flushTimer = window.setTimeout(attempt, FLUSH_INTERVAL_MS);
}
