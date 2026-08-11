/**
 * GLSL ES 1.00 shaders — deliberately targeting the older dialect so the same
 * program compiles on both WebGL2 and WebGL1 contexts.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
varying vec2 vTexCoord;

void main() {
  // aPosition covers the clip-space quad; flip Y so texture rows line up
  // with the canvas (both images and videos upload top-down).
  vTexCoord = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform vec2 uTexelSize;
uniform vec3 uGain;        // per-channel white-balance gains
uniform float uColor;      // 0-1 color-correction strength
uniform float uNoise;      // 0-1 denoise strength
uniform float uDetail;     // 0-1 unsharp strength
uniform float uBlackPoint;
uniform float uWhitePoint;
uniform float uSaturation; // saturation multiplier at full strength

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
  vec3 center = texture2D(uTexture, vTexCoord).rgb;

  // --- 3x3 neighborhood: bilateral-ish denoise + box mean for unsharp ---
  // Range sigma widens with the denoise slider so stronger settings merge
  // more of the filter's grain while edges keep their own weight.
  float rangeSigma = mix(0.02, 0.16, uNoise);
  float invRange = 1.0 / (2.0 * rangeSigma * rangeSigma);

  vec3 blurSum = vec3(0.0);
  vec3 denoiseSum = vec3(0.0);
  float denoiseWeight = 0.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y)) * uTexelSize;
      vec3 sampled = texture2D(uTexture, vTexCoord + offset).rgb;

      // Spatial weight: 1 / 2 / 4 tent kernel over the 3x3 block.
      float spatial = (abs(float(x)) + abs(float(y)) == 0.0)
        ? 4.0
        : ((abs(float(x)) + abs(float(y)) == 1.0) ? 2.0 : 1.0);
      blurSum += sampled * spatial;

      float dist = dot(sampled - center, sampled - center);
      float weight = spatial * exp(-dist * invRange);
      denoiseSum += sampled * weight;
      denoiseWeight += weight;
    }
  }

  vec3 blurred = blurSum / 16.0;
  vec3 denoised = denoiseSum / max(denoiseWeight, 0.0001);

  vec3 color = mix(center, denoised, uNoise);

  // --- Detail: unsharp mask against the box mean ---
  // Applied after denoise so we sharpen structure, not the grain we removed.
  vec3 highFreq = color - blurred;
  color += highFreq * (uDetail * 1.9);

  // --- Color: white balance, level stretch, saturation ---
  vec3 balanced = clamp(color * uGain, 0.0, 1.0);

  float span = max(uWhitePoint - uBlackPoint, 0.08);
  vec3 stretched = clamp((balanced - uBlackPoint) / span, 0.0, 1.0);

  float luma = dot(stretched, LUMA);
  vec3 saturated = mix(vec3(luma), stretched, uSaturation);

  vec3 corrected = mix(color, saturated, uColor);

  gl_FragColor = vec4(clamp(corrected, 0.0, 1.0), 1.0);
}
`;
