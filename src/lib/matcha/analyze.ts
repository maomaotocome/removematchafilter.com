import type { FrameSource, SourceStats } from './types';

/** Downsample width for statistics — plenty for histograms, cheap to read back. */
const SAMPLE_WIDTH = 160;

const NEUTRAL_STATS: SourceStats = {
  gain: [1, 1, 1],
  blackPoint: 0,
  whitePoint: 1,
};

/**
 * Measure per-channel white-balance gains and a luma black/white point from a
 * downsampled copy of the frame.
 *
 * The gains use a grey-world assumption clamped to ±35%: a matcha-style filter
 * pushes green up and red down, so equalizing channel means removes most of the
 * cast without letting a legitimately green subject (foliage, a matcha latte)
 * get inverted into magenta.
 *
 * Returns neutral stats — not an error — when the frame can't be read (e.g. a
 * tainted canvas), so the tool keeps working with the sliders alone.
 */
export function analyzeFrame(source: FrameSource): SourceStats {
  const naturalWidth =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source.naturalWidth;
  const naturalHeight =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source.naturalHeight;

  if (!naturalWidth || !naturalHeight) return NEUTRAL_STATS;

  const width = Math.min(SAMPLE_WIDTH, naturalWidth);
  const height = Math.max(
    1,
    Math.round((width / naturalWidth) * naturalHeight)
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return NEUTRAL_STATS;

  let data: Uint8ClampedArray;
  try {
    ctx.drawImage(source, 0, 0, width, height);
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return NEUTRAL_STATS;
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const lumaHistogram = new Uint32Array(256);
  const pixelCount = width * height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
    lumaHistogram[luma < 0 ? 0 : luma > 255 ? 255 : luma]++;
  }

  const meanR = sumR / pixelCount;
  const meanG = sumG / pixelCount;
  const meanB = sumB / pixelCount;
  const meanAll = (meanR + meanG + meanB) / 3;

  const gainFor = (mean: number) =>
    mean < 1 ? 1 : Math.min(1.35, Math.max(0.65, meanAll / mean));

  return {
    gain: [gainFor(meanR), gainFor(meanG), gainFor(meanB)],
    blackPoint: percentile(lumaHistogram, pixelCount, 0.005) / 255,
    whitePoint: percentile(lumaHistogram, pixelCount, 0.995) / 255,
  };
}

/** Luma value at the given cumulative fraction of the histogram. */
function percentile(
  histogram: Uint32Array,
  total: number,
  fraction: number
): number {
  const target = total * fraction;
  let cumulative = 0;
  for (let value = 0; value < histogram.length; value++) {
    cumulative += histogram[value];
    if (cumulative >= target) return value;
  }
  return 255;
}
