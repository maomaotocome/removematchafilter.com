const CANDIDATE_ID = 'current-webgl';

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'current-webgl accepts only an unauthenticated loopback HTTP(S) URL.'
    );
  }
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString().replace(/\/$/, '');
}

/**
 * Drive the shipping UI through its file input and read the resulting canvas.
 * No renderer or shader logic is copied into the benchmark.
 */
export async function createCandidate({
  browser,
  baseUrl,
  timeoutMs = 30_000,
}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.setDefaultTimeout(timeoutMs);
  const route = `${normalizeBaseUrl(baseUrl)}/from-photo`;

  async function resetPage() {
    runtimeErrors.length = 0;
    // The file input is server-rendered before React attaches its change
    // handler. Waiting for network idle prevents a false upload into an
    // unhydrated control (the same contract used by make-examples.mjs).
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    if (!response || !response.ok()) {
      throw new Error(
        `Local tool route returned ${response?.status() ?? 'no response'}.`
      );
    }
    await page.locator('input[type="file"]').waitFor({ state: 'attached' });
  }

  return {
    id: CANDIDATE_ID,
    supportedMediaTypes: ['photo'],

    async runPhoto({ filteredPath, evaluationSize }) {
      await resetPage();
      const startedAt = performance.now();
      await page.setInputFiles('input[type="file"]', filteredPath);
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        const source = document.querySelector('figure img');
        return (
          canvas instanceof HTMLCanvasElement &&
          canvas.width > 0 &&
          canvas.height > 0 &&
          source instanceof HTMLImageElement &&
          source.complete &&
          source.naturalWidth > 0
        );
      });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          )
      );

      const rendered = await page.evaluate(
        async ({ outputWidth, outputHeight }) => {
          const sourceCanvas = document.querySelector('canvas');
          if (!(sourceCanvas instanceof HTMLCanvasElement)) {
            throw new Error(
              'The shipping tool did not render an output canvas.'
            );
          }
          // toDataURL exercises the same public canvas/export surface as the
          // tool's download action and snapshots the current WebGL framebuffer.
          const snapshot = sourceCanvas.toDataURL('image/png');
          const image = new Image();
          image.src = snapshot;
          await image.decode();
          const canvas = document.createElement('canvas');
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
          canvasContext.drawImage(image, 0, 0, outputWidth, outputHeight);
          const imageData = canvasContext.getImageData(
            0,
            0,
            outputWidth,
            outputHeight
          );
          const ranges = [
            ...document.querySelectorAll('input[type="range"][step="1"]'),
          ].slice(0, 3);
          const controls = ranges.map((input, index) => {
            const label = input.id
              ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`)
              : null;
            return {
              index,
              label: label?.textContent?.trim() || null,
              value: Number(input.value),
              min: Number(input.min),
              max: Number(input.max),
              step: Number(input.step),
            };
          });
          return {
            width: outputWidth,
            height: outputHeight,
            data: Array.from(imageData.data),
            sourceCanvas: {
              width: sourceCanvas.width,
              height: sourceCanvas.height,
              pixels: sourceCanvas.width * sourceCanvas.height,
            },
            controls,
          };
        },
        {
          outputWidth: evaluationSize.width,
          outputHeight: evaluationSize.height,
        }
      );
      const durationMs = performance.now() - startedAt;
      const opaquePixels = rendered.data.reduce(
        (count, value, index) => count + (index % 4 === 3 && value > 0 ? 1 : 0),
        0
      );
      if (opaquePixels === 0) {
        throw new Error('The shipping WebGL canvas produced no opaque pixels.');
      }
      if (runtimeErrors.length > 0) {
        throw new Error(
          `Shipping tool runtime error: ${runtimeErrors.join(' | ')}`
        );
      }

      return {
        image: {
          width: rendered.width,
          height: rendered.height,
          data: Uint8ClampedArray.from(rendered.data),
        },
        performance: {
          endToEndMs: durationMs,
          sourceCanvas: rendered.sourceCanvas,
        },
        parameters: {
          route: '/from-photo',
          controls: rendered.controls,
          execution:
            'Playwright file input -> application WebGL canvas -> export surface',
        },
      };
    },

    async close() {
      await context.close();
    },
  };
}

export const id = CANDIDATE_ID;
export const supportedMediaTypes = Object.freeze(['photo']);
