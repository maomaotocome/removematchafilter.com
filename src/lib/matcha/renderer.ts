import { SATURATION_AT_FULL } from './presets';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shaders';
import type { FrameSource, MatchaParams, SourceStats } from './types';

export class WebGLUnavailableError extends Error {
  constructor() {
    super('WebGL is not available in this browser.');
    this.name = 'WebGLUnavailableError';
  }
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;

/**
 * Single-pass GPU renderer for the reduction pipeline.
 *
 * One instance owns one canvas, one program, and one texture; frames are
 * re-uploaded on every `render` call. Videos reuse the exact same code path as
 * photos — that's what lets all three pages share one implementation.
 */
export class MatchaRenderer {
  private gl: GL;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private buffer: WebGLBuffer;
  private uniforms: Record<string, WebGLUniformLocation | null>;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    const attrs: WebGLContextAttributes = {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    };
    const gl = (canvas.getContext('webgl2', attrs) ||
      canvas.getContext('webgl', attrs)) as GL | null;
    if (!gl) throw new WebGLUnavailableError();
    this.gl = gl;

    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(this.program);

    const buffer = gl.createBuffer();
    if (!buffer) throw new WebGLUnavailableError();
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(this.program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    if (!texture) throw new WebGLUnavailableError();
    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // CLAMP_TO_EDGE + LINEAR keeps non-power-of-two sources valid on WebGL1.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.uniforms = {};
    for (const name of [
      'uTexture',
      'uTexelSize',
      'uGain',
      'uColor',
      'uNoise',
      'uDetail',
      'uBlackPoint',
      'uWhitePoint',
      'uSaturation',
    ]) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }
  }

  /** Draw one frame at the given params. Safe to call on every rAF tick. */
  render(
    source: FrameSource,
    params: MatchaParams,
    stats: SourceStats,
    size: { width: number; height: number }
  ): void {
    if (this.disposed) return;
    const gl = this.gl;

    if (
      this.canvas.width !== size.width ||
      this.canvas.height !== size.height
    ) {
      this.canvas.width = size.width;
      this.canvas.height = size.height;
    }

    gl.viewport(0, 0, size.width, size.height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      source as TexImageSource
    );

    const color = params.color / 100;
    gl.uniform1i(this.uniforms.uTexture, 0);
    gl.uniform2f(
      this.uniforms.uTexelSize,
      1 / Math.max(size.width, 1),
      1 / Math.max(size.height, 1)
    );
    gl.uniform3f(this.uniforms.uGain, ...blendGain(stats.gain, color));
    gl.uniform1f(this.uniforms.uColor, color);
    gl.uniform1f(this.uniforms.uNoise, params.noise / 100);
    gl.uniform1f(this.uniforms.uDetail, params.detail / 100);
    gl.uniform1f(this.uniforms.uBlackPoint, stats.blackPoint * color);
    gl.uniform1f(this.uniforms.uWhitePoint, 1 - (1 - stats.whitePoint) * color);
    gl.uniform1f(
      this.uniforms.uSaturation,
      1 + (SATURATION_AT_FULL - 1) * color
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    // Free the drawing buffer eagerly — browsers cap live WebGL contexts and
    // this tool can create several across mode switches.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/** Ease each gain from neutral toward its measured value by `strength`. */
function blendGain(
  gain: [number, number, number],
  strength: number
): [number, number, number] {
  return [
    1 + (gain[0] - 1) * strength,
    1 + (gain[1] - 1) * strength,
    1 + (gain[2] - 1) * strength,
  ];
}

function createProgram(
  gl: GL,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new WebGLUnavailableError();

  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  // Shaders are only needed until link time.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Shader program failed to link: ${log ?? 'unknown error'}`);
  }
  return program;
}

function compileShader(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new WebGLUnavailableError();
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log ?? 'unknown error'}`);
  }
  return shader;
}
