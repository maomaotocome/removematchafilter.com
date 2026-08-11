/**
 * Shared types for the matcha-filter reduction pipeline.
 *
 * Everything here runs in the browser. No media is ever uploaded — the
 * processor reads from an object URL created off the user's local File and
 * writes to a canvas in the same tab.
 */

export type MediaMode = 'photo' | 'video';

/** User-facing adjustment strengths, each 0-100. */
export interface MatchaParams {
  /** Neutralize the green/olive cast and restore contrast + saturation. */
  color: number;
  /** Edge-preserving denoise that softens the filter's grain overlay. */
  noise: number;
  /** Unsharp pass that brings back micro-detail the filter smeared. */
  detail: number;
}

/**
 * Measured statistics of the source frame. Drives the white-balance gains
 * and level stretch so the correction adapts to the actual image instead of
 * applying a fixed look.
 */
export interface SourceStats {
  /** Per-channel white-balance gains, already clamped to a safe range. */
  gain: [number, number, number];
  /** Luma black point (0-1) taken from a low percentile. */
  blackPoint: number;
  /** Luma white point (0-1) taken from a high percentile. */
  whitePoint: number;
}

/** Anything the WebGL texture upload accepts as a source frame. */
export type FrameSource = HTMLImageElement | HTMLVideoElement;

export interface SourceMedia {
  mode: MediaMode;
  /** Object URL for the local File. Revoke when replaced. */
  url: string;
  fileName: string;
  width: number;
  height: number;
  element: FrameSource;
  /** Video duration in seconds; 0 for photos. */
  duration: number;
}
