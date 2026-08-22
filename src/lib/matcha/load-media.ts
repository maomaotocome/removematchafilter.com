import type { MediaMode, SourceMedia } from './types';

/** Practical ceiling: everything is decoded in-tab, so very large files stall. */
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export const PHOTO_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif';
export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm';

const PHOTO_TYPES = new Set(PHOTO_ACCEPT.split(','));
const VIDEO_TYPES = new Set(VIDEO_ACCEPT.split(','));

export class MediaLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaLoadError';
  }
}

/**
 * Turn a bundled demo fixture into the same File input used for visitor media.
 * The response stays in this browser tab and then follows the normal renderer
 * path, so the sample is a real product trial rather than a separate preview.
 */
export async function loadBundledPhotoSample(url: string): Promise<File> {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new MediaLoadError('The bundled sample image could not be loaded.');
  }

  const blob = await response.blob();
  const type = blob.type || 'image/jpeg';
  if (!PHOTO_TYPES.has(type)) {
    throw new MediaLoadError('The bundled sample is not a supported image.');
  }

  return new File([blob], 'sample-photo.jpg', {
    type,
    lastModified: 0,
  });
}

export function modeForFile(file: File): MediaMode | null {
  if (PHOTO_TYPES.has(file.type)) return 'photo';
  if (VIDEO_TYPES.has(file.type)) return 'video';

  // A present but unsupported MIME type must not be overridden by a friendly
  // extension. This matters for drag-and-drop, which bypasses the picker's
  // `accept` filter.
  if (file.type) return null;

  // Some browsers report an empty type for files from certain pickers —
  // fall back to the extension so those still work.
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (!extension) return null;
  if (['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(extension))
    return 'photo';
  if (['mp4', 'mov', 'webm', 'm4v'].includes(extension)) return 'video';
  return null;
}

/**
 * Decode a local File into a ready-to-render element.
 *
 * The File never leaves the browser: it becomes an object URL that only this
 * document can resolve, and the element decoding it lives in this tab.
 */
export async function loadMedia(file: File): Promise<SourceMedia> {
  const mode = modeForFile(file);
  if (!mode) {
    throw new MediaLoadError(
      `“${file.name}” is not a supported image or video. Use PNG, JPEG, WebP, MP4, MOV, or WebM.`
    );
  }

  const limit = mode === 'photo' ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
  if (file.size > limit) {
    throw new MediaLoadError(
      `That file is ${formatBytes(file.size)}. The in-browser limit is ${formatBytes(limit)} for ${mode === 'photo' ? 'photos' : 'videos'}.`
    );
  }

  const url = URL.createObjectURL(file);
  try {
    return mode === 'photo'
      ? await loadPhoto(url, file.name)
      : await loadVideo(url, file.name);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function loadPhoto(url: string, fileName: string): Promise<SourceMedia> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Large phone photos can otherwise block the main thread while decoding.
    // The load promise still resolves only when dimensions and pixels are ready.
    image.decoding = 'async';
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new MediaLoadError('That image could not be decoded.'));
        return;
      }
      resolve({
        mode: 'photo',
        url,
        fileName,
        width: image.naturalWidth,
        height: image.naturalHeight,
        element: image,
        duration: 0,
      });
    };
    image.onerror = () =>
      reject(
        new MediaLoadError(
          'This browser could not decode that image. Try exporting it as PNG or JPEG.'
        )
      );
    image.src = url;
  });
}

function loadVideo(url: string, fileName: string): Promise<SourceMedia> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';

    const fail = () =>
      reject(
        new MediaLoadError(
          `This browser cannot play “${fileName}”. HEVC-encoded MOV files often fail outside Safari — re-export as H.264 MP4 or WebM.`
        )
      );

    video.onloadedmetadata = () => {
      if (!video.videoWidth || !video.videoHeight) {
        fail();
        return;
      }
      resolve({
        mode: 'video',
        url,
        fileName,
        width: video.videoWidth,
        height: video.videoHeight,
        element: video,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
    };
    video.onerror = fail;
    video.src = url;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Fit `source` inside `max` on the long edge, never upscaling. */
export function fitWithin(
  source: { width: number; height: number },
  max: number
): { width: number; height: number } {
  const longEdge = Math.max(source.width, source.height);
  if (longEdge <= max) return { width: source.width, height: source.height };
  const scale = max / longEdge;
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}
