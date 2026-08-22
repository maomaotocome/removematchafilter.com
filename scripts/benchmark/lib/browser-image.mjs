function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
  return value;
}

export function fitWithin(width, height, maxEdge) {
  positiveInteger(width, 'width');
  positiveInteger(height, 'height');
  positiveInteger(maxEdge, 'maxEdge');
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

/**
 * Decode images through the same Chromium Canvas pipeline used by the product.
 * This intentionally avoids Node-native image codecs and their color-profile
 * differences. All paired inputs and candidate pixels are read in one browser.
 */
export async function createCanvasImageDecoder(browser) {
  const context = await browser.newContext({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <meta charset="utf-8">
    <title>Benchmark image decoder</title>
    <input id="decode-input" type="file" accept="image/*">
    <canvas id="decode-canvas"></canvas>`);

  async function load(filePath) {
    await page.setInputFiles('#decode-input', filePath);
    return page.evaluate(async () => {
      const input = document.querySelector('#decode-input');
      const file = input?.files?.[0];
      if (!file) throw new Error('The browser decoder did not receive a file.');
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.decoding = 'sync';
        image.src = url;
        await image.decode();
        return {
          width: image.naturalWidth,
          height: image.naturalHeight,
          mimeType: file.type || null,
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  }

  return {
    async inspect(filePath) {
      const result = await load(filePath);
      positiveInteger(result.width, 'decoded width');
      positiveInteger(result.height, 'decoded height');
      return result;
    },

    async decode(filePath, target, { crop = 'center' } = {}) {
      const width = positiveInteger(target.width, 'target.width');
      const height = positiveInteger(target.height, 'target.height');
      if (crop !== 'center') {
        throw new RangeError(
          'The minimum harness supports only deterministic center crops.'
        );
      }
      await page.setInputFiles('#decode-input', filePath);
      const result = await page.evaluate(
        async ({ width: outputWidth, height: outputHeight }) => {
          const input = document.querySelector('#decode-input');
          const file = input?.files?.[0];
          if (!file)
            throw new Error('The browser decoder did not receive a file.');
          const objectUrl = URL.createObjectURL(file);
          const startedAt = performance.now();
          try {
            const image = new Image();
            image.decoding = 'sync';
            image.src = objectUrl;
            await image.decode();

            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            const sourceAspect = sourceWidth / sourceHeight;
            const outputAspect = outputWidth / outputHeight;
            let sx = 0;
            let sy = 0;
            let sw = sourceWidth;
            let sh = sourceHeight;
            if (sourceAspect > outputAspect) {
              sw = sourceHeight * outputAspect;
              sx = (sourceWidth - sw) / 2;
            } else if (sourceAspect < outputAspect) {
              sh = sourceWidth / outputAspect;
              sy = (sourceHeight - sh) / 2;
            }

            const canvas = document.querySelector('#decode-canvas');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const canvasContext = canvas.getContext('2d', {
              alpha: true,
              colorSpace: 'srgb',
              willReadFrequently: true,
            });
            if (!canvasContext) throw new Error('2D Canvas is unavailable.');
            canvasContext.imageSmoothingEnabled = true;
            canvasContext.imageSmoothingQuality = 'high';
            canvasContext.clearRect(0, 0, outputWidth, outputHeight);
            canvasContext.drawImage(
              image,
              sx,
              sy,
              sw,
              sh,
              0,
              0,
              outputWidth,
              outputHeight
            );
            const imageData = canvasContext.getImageData(
              0,
              0,
              outputWidth,
              outputHeight
            );
            return {
              width: outputWidth,
              height: outputHeight,
              data: Array.from(imageData.data),
              source: {
                width: sourceWidth,
                height: sourceHeight,
                mimeType: file.type || null,
              },
              crop: { strategy: 'center', sx, sy, sw, sh },
              decodeMs: performance.now() - startedAt,
              colorPipeline: {
                decoder: 'Chromium HTMLImageElement.decode',
                canvas: '2d',
                requestedColorSpace: 'srgb',
                returnedColorSpace: imageData.colorSpace || 'srgb',
                caveat:
                  'Embedded-profile conversion is browser/platform dependent; every side of a pair is decoded in the recorded browser run.',
              },
            };
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        },
        { width, height }
      );
      return { ...result, data: Uint8ClampedArray.from(result.data) };
    },

    async close() {
      await context.close();
    },
  };
}
