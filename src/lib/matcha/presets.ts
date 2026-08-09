import type { MatchaParams } from './types';

/**
 * The single shipped preset. Deliberately moderate: it pulls the green cast
 * back toward neutral without inventing detail that the filter destroyed.
 */
export const DEFAULT_PRESET: MatchaParams = {
  color: 70,
  noise: 45,
  detail: 35,
};

/** Saturation target applied at full color strength. */
export const SATURATION_AT_FULL = 1.22;

export const PARAM_KEYS = ['color', 'noise', 'detail'] as const;

export type ParamKey = (typeof PARAM_KEYS)[number];

export function clampParams(params: MatchaParams): MatchaParams {
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  return {
    color: clamp(params.color),
    noise: clamp(params.noise),
    detail: clamp(params.detail),
  };
}
