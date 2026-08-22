import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ciede2000,
  clippingDiagnostics,
  compareImages,
  gradientStructure,
  lumaSsim,
  srgbToLab,
  unsupportedObjectiveMetrics,
} from './lib/image-metrics.mjs';

function approximately(actual, expected, tolerance = 1e-4) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

function rgba(width, height, pixels) {
  assert.equal(pixels.length, width * height);
  return {
    width,
    height,
    data: Uint8ClampedArray.from(pixels.flatMap((pixel) => [...pixel, 255])),
  };
}

test('sRGB primaries convert to known CIE Lab D65 values', () => {
  const cases = [
    [
      [255, 255, 255],
      [100, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [255, 0, 0],
      [53.2408, 80.0925, 67.2032],
    ],
    [
      [0, 255, 0],
      [87.7347, -86.1827, 83.1793],
    ],
    [
      [0, 0, 255],
      [32.297, 79.1875, -107.8602],
    ],
  ];

  for (const [input, expected] of cases) {
    const actual = srgbToLab(...input);
    expected.forEach((value, index) =>
      approximately(actual[index], value, 8e-4)
    );
  }
});

test('CIEDE2000 matches published Sharma reference pairs', () => {
  const pairs = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1],
  ];

  for (const [first, second, expected] of pairs) {
    approximately(ciede2000(first, second), expected, 5e-5);
  }
});

test('clipping diagnostics distinguish inherited and newly introduced clipping', () => {
  const input = rgba(2, 2, [
    [0, 0, 0],
    [10, 10, 10],
    [245, 245, 245],
    [255, 255, 255],
  ]);
  const candidate = rgba(2, 2, [
    [0, 0, 0],
    [0, 0, 0],
    [255, 255, 255],
    [255, 255, 255],
  ]);

  const result = clippingDiagnostics(candidate, input);
  assert.deepEqual(result.input, { darkFraction: 0.25, brightFraction: 0.25 });
  assert.deepEqual(result.candidate, {
    darkFraction: 0.5,
    brightFraction: 0.5,
  });
  assert.deepEqual(result.introduced, {
    darkFraction: 0.25,
    brightFraction: 0.25,
    totalFraction: 0.5,
  });
});

test('luma SSIM and Sobel structure are exact for identical images and react to damage', () => {
  const reference = rgba(
    4,
    4,
    Array.from({ length: 16 }, (_, index) => {
      const value = (index % 4) * 64;
      return [value, value, value];
    })
  );
  const damaged = rgba(
    4,
    4,
    Array.from({ length: 16 }, (_, index) => {
      const value = index < 8 ? 255 : 0;
      return [value, value, value];
    })
  );

  approximately(lumaSsim(reference, reference, { windowSize: 4 }).score, 1);
  approximately(gradientStructure(reference, reference).similarity, 1);
  assert.ok(lumaSsim(reference, damaged, { windowSize: 4 }).score < 1);
  assert.ok(gradientStructure(reference, damaged).similarity < 1);

  const constant10 = rgba(4, 4, Array(16).fill([10, 10, 10]));
  const constant20 = rgba(4, 4, Array(16).fill([20, 20, 20]));
  const c1 = (0.01 * 255) ** 2;
  const knownConstantSsim = (2 * 10 * 20 + c1) / (10 ** 2 + 20 ** 2 + c1);
  approximately(
    lumaSsim(constant10, constant20, { windowSize: 4 }).score,
    knownConstantSsim
  );

  const verticalEdge = rgba(
    3,
    3,
    Array.from({ length: 9 }, (_, index) =>
      index % 3 === 2 ? [255, 255, 255] : [0, 0, 0]
    )
  );
  const flat = rgba(3, 3, Array(9).fill([0, 0, 0]));
  const edgeResult = gradientStructure(verticalEdge, flat);
  approximately(edgeResult.similarity, 0);
  approximately(edgeResult.meanAbsoluteError, 127.5);
  assert.equal(edgeResult.evaluatedPixels, 1);
});

test('full diagnostics report channel, saturation, luma, and PSNR changes', () => {
  const reference = rgba(2, 1, [
    [10, 20, 30],
    [40, 50, 60],
  ]);
  const candidate = rgba(2, 1, [
    [20, 20, 30],
    [50, 40, 60],
  ]);
  const result = compareImages(reference, candidate);

  assert.equal(result.validPixels, 2);
  assert.equal(result.perChannel.red.meanSignedError, 10);
  assert.equal(result.perChannel.green.meanSignedError, -5);
  assert.equal(result.perChannel.blue.meanSignedError, 0);
  assert.equal(result.perChannel.red.absoluteError.mean, 10);
  assert.equal(result.perChannel.green.absoluteError.mean, 5);
  approximately(result.saturationAbsoluteError.mean, 0.15);
  approximately(result.saturationAbsoluteError.median, 0);
  approximately(result.saturationAbsoluteError.p95, 0.3);
  approximately(result.lumaAbsoluteError.mean, 3.576);
  approximately(result.lumaAbsoluteError.median, 2.126);
  approximately(result.lumaAbsoluteError.p95, 5.026);
  approximately(result.lumaDistribution.reference.mean, 33.596);
  approximately(result.lumaDistribution.candidate.mean, 32.146);
  approximately(result.psnr.mse, 50);
  assert.equal(result.psnr.infinite, false);

  const identical = compareImages(reference, reference);
  assert.deepEqual(identical.psnr, { db: null, infinite: true, mse: 0 });
  approximately(identical.lumaSsim.score, 1);
});

test('unsupported objective metrics are explicit and never emitted as proxy scores', () => {
  assert.deepEqual(
    unsupportedObjectiveMetrics.map(({ id }) => id),
    ['face-roi-ciede2000', 'visible-halo-score', 'video-optical-flow-flicker']
  );
  for (const metric of unsupportedObjectiveMetrics) {
    assert.equal(typeof metric.reason, 'string');
    assert.ok(metric.reason.length > 20);
    assert.equal('score' in metric, false);
  }
});
