const D65 = [0.95047, 1, 1.08883];
const DELTA = 6 / 29;

function assertImage(image, name) {
  if (
    !image ||
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height)
  ) {
    throw new TypeError(`${name} must have integer width and height.`);
  }
  const expected = image.width * image.height * 4;
  if (!image.data || image.data.length !== expected) {
    throw new TypeError(`${name}.data must contain ${expected} RGBA values.`);
  }
}

function assertSameSize(reference, candidate) {
  assertImage(reference, 'reference');
  assertImage(candidate, 'candidate');
  if (
    reference.width !== candidate.width ||
    reference.height !== candidate.height
  ) {
    throw new RangeError(
      'Paired images must have identical evaluation dimensions.'
    );
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/** Convert an 8-bit sRGB channel to linear-light sRGB. */
export function srgbChannelToLinear(value) {
  const channel = clamp01(value / 255);
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Convert an 8-bit sRGB triplet to CIE Lab using the D65 reference white. */
export function srgbToLab(r, g, b) {
  const red = srgbChannelToLinear(r);
  const green = srgbChannelToLinear(g);
  const blue = srgbChannelToLinear(b);

  const x = (0.4124564 * red + 0.3575761 * green + 0.1804375 * blue) / D65[0];
  const y = (0.2126729 * red + 0.7151522 * green + 0.072175 * blue) / D65[1];
  const z = (0.0193339 * red + 0.119192 * green + 0.9503041 * blue) / D65[2];

  const f = (value) =>
    value > DELTA ** 3 ? Math.cbrt(value) : value / (3 * DELTA ** 2) + 4 / 29;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const radians = (degrees) => (degrees * Math.PI) / 180;
const degrees = (value) => (value * 180) / Math.PI;

function hueDegrees(a, b) {
  if (a === 0 && b === 0) return 0;
  const angle = degrees(Math.atan2(b, a));
  return angle >= 0 ? angle : angle + 360;
}

/**
 * CIEDE2000 implementation following Sharma, Wu, and Dalal (2005).
 * Lab inputs use the conventional L*, a*, b* scales.
 */
export function ciede2000(lab1, lab2) {
  const [l1, a1, b1] = lab1;
  const [l2, a2, b2] = lab2;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cMean = (c1 + c2) / 2;
  const cMean7 = cMean ** 7;
  const g = 0.5 * (1 - Math.sqrt(cMean7 / (cMean7 + 25 ** 7)));
  const a1Prime = (1 + g) * a1;
  const a2Prime = (1 + g) * a2;
  const c1Prime = Math.hypot(a1Prime, b1);
  const c2Prime = Math.hypot(a2Prime, b2);
  const h1Prime = hueDegrees(a1Prime, b1);
  const h2Prime = hueDegrees(a2Prime, b2);

  const deltaLPrime = l2 - l1;
  const deltaCPrime = c2Prime - c1Prime;
  let deltaHuePrime = 0;
  if (c1Prime !== 0 && c2Prime !== 0) {
    const difference = h2Prime - h1Prime;
    deltaHuePrime =
      Math.abs(difference) <= 180
        ? difference
        : difference > 180
          ? difference - 360
          : difference + 360;
  }
  const deltaHPrime =
    2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(radians(deltaHuePrime / 2));

  const lMeanPrime = (l1 + l2) / 2;
  const cMeanPrime = (c1Prime + c2Prime) / 2;
  let hMeanPrime = h1Prime + h2Prime;
  if (c1Prime !== 0 && c2Prime !== 0) {
    const difference = Math.abs(h1Prime - h2Prime);
    if (difference <= 180) hMeanPrime /= 2;
    else if (hMeanPrime < 360) hMeanPrime = (hMeanPrime + 360) / 2;
    else hMeanPrime = (hMeanPrime - 360) / 2;
  }

  const t =
    1 -
    0.17 * Math.cos(radians(hMeanPrime - 30)) +
    0.24 * Math.cos(radians(2 * hMeanPrime)) +
    0.32 * Math.cos(radians(3 * hMeanPrime + 6)) -
    0.2 * Math.cos(radians(4 * hMeanPrime - 63));
  const deltaTheta = 30 * Math.exp(-(((hMeanPrime - 275) / 25) ** 2));
  const cMeanPrime7 = cMeanPrime ** 7;
  const rc = 2 * Math.sqrt(cMeanPrime7 / (cMeanPrime7 + 25 ** 7));
  const sl =
    1 +
    (0.015 * (lMeanPrime - 50) ** 2) / Math.sqrt(20 + (lMeanPrime - 50) ** 2);
  const sc = 1 + 0.045 * cMeanPrime;
  const sh = 1 + 0.015 * cMeanPrime * t;
  const rt = -Math.sin(radians(2 * deltaTheta)) * rc;

  const lTerm = deltaLPrime / sl;
  const cTerm = deltaCPrime / sc;
  const hTerm = deltaHPrime / sh;
  return Math.sqrt(lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + rt * cTerm * hTerm);
}

/** Gamma-encoded Rec.709 luma on the 0..255 scale, used for SSIM. */
export function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;
  const lightness = (max + min) / 2;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(fraction * sorted.length) - 1)
  );
  return sorted[index];
}

function summary(values) {
  if (values.length === 0) {
    return { mean: null, median: null, p95: null, max: null };
  }
  const ordered = [...values].sort((a, b) => a - b);
  const mean =
    values.reduce((total, value) => total + value, 0) / values.length;
  return {
    mean,
    median: percentile(ordered, 0.5),
    p95: percentile(ordered, 0.95),
    max: ordered.at(-1),
  };
}

/** Mean SSIM across deterministic, non-overlapping luminance windows. */
export function lumaSsim(reference, candidate, { windowSize = 8 } = {}) {
  assertSameSize(reference, candidate);
  if (!Number.isInteger(windowSize) || windowSize < 1) {
    throw new RangeError('windowSize must be a positive integer.');
  }

  const { width, height } = reference;
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  let total = 0;
  let windows = 0;

  for (let top = 0; top < height; top += windowSize) {
    for (let left = 0; left < width; left += windowSize) {
      const right = Math.min(width, left + windowSize);
      const bottom = Math.min(height, top + windowSize);
      const referenceValues = [];
      const candidateValues = [];
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const index = (y * width + x) * 4;
          if (
            reference.data[index + 3] === 0 ||
            candidate.data[index + 3] === 0
          ) {
            continue;
          }
          referenceValues.push(
            luma(
              reference.data[index],
              reference.data[index + 1],
              reference.data[index + 2]
            )
          );
          candidateValues.push(
            luma(
              candidate.data[index],
              candidate.data[index + 1],
              candidate.data[index + 2]
            )
          );
        }
      }
      const count = referenceValues.length;
      if (count === 0) continue;
      const meanReference =
        referenceValues.reduce((sum, value) => sum + value, 0) / count;
      const meanCandidate =
        candidateValues.reduce((sum, value) => sum + value, 0) / count;
      let varianceReference = 0;
      let varianceCandidate = 0;
      let covariance = 0;
      for (let i = 0; i < count; i++) {
        const refDelta = referenceValues[i] - meanReference;
        const candidateDelta = candidateValues[i] - meanCandidate;
        varianceReference += refDelta ** 2;
        varianceCandidate += candidateDelta ** 2;
        covariance += refDelta * candidateDelta;
      }
      const denominator = Math.max(1, count - 1);
      varianceReference /= denominator;
      varianceCandidate /= denominator;
      covariance /= denominator;
      total +=
        ((2 * meanReference * meanCandidate + c1) * (2 * covariance + c2)) /
        ((meanReference ** 2 + meanCandidate ** 2 + c1) *
          (varianceReference + varianceCandidate + c2));
      windows++;
    }
  }

  if (windows === 0)
    throw new Error('No opaque pixels were available for SSIM.');
  return { score: total / windows, windows, windowSize };
}

/**
 * Count clipping created by the candidate that was not already present in the
 * filtered input. Thresholds are inclusive 8-bit luma values.
 */
export function clippingDiagnostics(
  candidate,
  filteredInput,
  { darkThreshold = 1, brightThreshold = 254 } = {}
) {
  assertSameSize(filteredInput, candidate);
  let validPixels = 0;
  let candidateDark = 0;
  let candidateBright = 0;
  let inputDark = 0;
  let inputBright = 0;
  let introducedDark = 0;
  let introducedBright = 0;

  for (let i = 0; i < candidate.data.length; i += 4) {
    if (candidate.data[i + 3] === 0 || filteredInput.data[i + 3] === 0)
      continue;
    validPixels++;
    const candidateLuma = luma(
      candidate.data[i],
      candidate.data[i + 1],
      candidate.data[i + 2]
    );
    const inputLuma = luma(
      filteredInput.data[i],
      filteredInput.data[i + 1],
      filteredInput.data[i + 2]
    );
    const isCandidateDark = candidateLuma <= darkThreshold;
    const isCandidateBright = candidateLuma >= brightThreshold;
    const isInputDark = inputLuma <= darkThreshold;
    const isInputBright = inputLuma >= brightThreshold;
    if (isCandidateDark) candidateDark++;
    if (isCandidateBright) candidateBright++;
    if (isInputDark) inputDark++;
    if (isInputBright) inputBright++;
    if (isCandidateDark && !isInputDark) introducedDark++;
    if (isCandidateBright && !isInputBright) introducedBright++;
  }

  if (validPixels === 0)
    throw new Error('No opaque pixels were available for clipping metrics.');
  const fraction = (count) => count / validPixels;
  return {
    validPixels,
    thresholds: { dark: darkThreshold, bright: brightThreshold },
    input: {
      darkFraction: fraction(inputDark),
      brightFraction: fraction(inputBright),
    },
    candidate: {
      darkFraction: fraction(candidateDark),
      brightFraction: fraction(candidateBright),
    },
    introduced: {
      darkFraction: fraction(introducedDark),
      brightFraction: fraction(introducedBright),
      totalFraction: fraction(introducedDark + introducedBright),
    },
  };
}

function gradientMagnitudes(image) {
  const { width, height, data } = image;
  const values = new Float64Array(width * height);
  const luminance = new Float64Array(width * height);
  for (let p = 0, i = 0; i < data.length; i += 4, p++) {
    luminance[p] = luma(data[i], data[i + 1], data[i + 2]);
  }
  const at = (x, y) => luminance[y * width + x];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        -at(x - 1, y - 1) +
        at(x + 1, y - 1) -
        2 * at(x - 1, y) +
        2 * at(x + 1, y) -
        at(x - 1, y + 1) +
        at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1);
      values[y * width + x] = Math.hypot(gx, gy) / 8;
    }
  }
  return values;
}

/** A bounded Sobel-gradient similarity diagnostic. This is not a halo score. */
export function gradientStructure(reference, candidate) {
  assertSameSize(reference, candidate);
  if (reference.width < 3 || reference.height < 3) {
    return { similarity: 1, meanAbsoluteError: 0, evaluatedPixels: 0 };
  }
  const referenceGradient = gradientMagnitudes(reference);
  const candidateGradient = gradientMagnitudes(candidate);
  let absoluteError = 0;
  let scale = 0;
  let evaluatedPixels = 0;
  for (let y = 1; y < reference.height - 1; y++) {
    for (let x = 1; x < reference.width - 1; x++) {
      const index = y * reference.width + x;
      const ref = referenceGradient[index];
      const current = candidateGradient[index];
      absoluteError += Math.abs(ref - current);
      scale += ref + current;
      evaluatedPixels++;
    }
  }
  return {
    similarity: scale === 0 ? 1 : clamp01(1 - absoluteError / scale),
    meanAbsoluteError: absoluteError / Math.max(1, evaluatedPixels),
    evaluatedPixels,
  };
}

/** Calculate all currently supported full-image photo metrics. */
export function compareImages(reference, candidate) {
  assertSameSize(reference, candidate);
  const deltaE = [];
  const channelErrors = [[], [], []];
  const channelSigned = [0, 0, 0];
  const saturationErrors = [];
  const lumaErrors = [];
  const referenceLuma = [];
  const candidateLuma = [];
  let squaredRgbError = 0;
  let validPixels = 0;

  for (let i = 0; i < reference.data.length; i += 4) {
    if (reference.data[i + 3] === 0 || candidate.data[i + 3] === 0) continue;
    const ref = [
      reference.data[i],
      reference.data[i + 1],
      reference.data[i + 2],
    ];
    const current = [
      candidate.data[i],
      candidate.data[i + 1],
      candidate.data[i + 2],
    ];
    deltaE.push(ciede2000(srgbToLab(...ref), srgbToLab(...current)));
    for (let channel = 0; channel < 3; channel++) {
      const signed = current[channel] - ref[channel];
      channelSigned[channel] += signed;
      channelErrors[channel].push(Math.abs(signed));
      squaredRgbError += signed ** 2;
    }
    saturationErrors.push(
      Math.abs(saturation(...current) - saturation(...ref))
    );
    const refLuma = luma(...ref);
    const currentLuma = luma(...current);
    referenceLuma.push(refLuma);
    candidateLuma.push(currentLuma);
    lumaErrors.push(Math.abs(currentLuma - refLuma));
    validPixels++;
  }

  if (validPixels === 0)
    throw new Error('No opaque pixels were available for metrics.');
  const rgbMse = squaredRgbError / (validPixels * 3);
  const lumaDistribution = (values) => {
    const ordered = [...values].sort((a, b) => a - b);
    return {
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      p01: percentile(ordered, 0.01),
      median: percentile(ordered, 0.5),
      p99: percentile(ordered, 0.99),
    };
  };
  const names = ['red', 'green', 'blue'];
  const perChannel = Object.fromEntries(
    names.map((name, channel) => [
      name,
      {
        meanSignedError: channelSigned[channel] / validPixels,
        absoluteError: summary(channelErrors[channel]),
      },
    ])
  );

  return {
    validPixels,
    ciede2000: summary(deltaE),
    lumaSsim: lumaSsim(reference, candidate),
    gradientStructure: gradientStructure(reference, candidate),
    perChannel,
    saturationAbsoluteError: summary(saturationErrors),
    lumaAbsoluteError: summary(lumaErrors),
    lumaDistribution: {
      reference: lumaDistribution(referenceLuma),
      candidate: lumaDistribution(candidateLuma),
    },
    psnr: {
      db: rgbMse === 0 ? null : 10 * Math.log10(255 ** 2 / rgbMse),
      infinite: rgbMse === 0,
      mse: rgbMse,
    },
  };
}

export const unsupportedObjectiveMetrics = Object.freeze([
  {
    id: 'face-roi-ciede2000',
    reason:
      'No reviewed face/skin or neutral-reference ROI annotations are available in the minimum harness.',
  },
  {
    id: 'visible-halo-score',
    reason:
      'The Sobel diagnostic is reported, but it is not promoted to a visible-halo metric without a validated detector and human labels.',
  },
  {
    id: 'video-optical-flow-flicker',
    reason:
      'Motion-compensated video and optical-flow metrics are not implemented; video items fail coverage instead of receiving proxy values.',
  },
]);
