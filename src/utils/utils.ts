import { vec4 } from "gl-matrix";

export function degToRad(deg: number) {
  return (deg / 180) * Math.PI;
}

export enum ShapShader {
  SHADER_TRIANGLE = 0.0,
  SHADER_LINE_A = 1.0,
  SHADER_LINE_B = 2.0,
  SHADER_LINE_C = 3.0,
  SHADER_LINE_D = 4.0,
  SHADER_CIRCLE = 5.0,
}

export type DrawCommand = {
  id: string; // 新增：唯一ID，便于查找/更新 (e.g., 'line1', 'circle1')
  mode: GLenum; // gl.TRIANGLES 等
  vertOffset: number; // 顶点起始 (in floats)
  vertCount: number; // 顶点数
  indexOffset: number; // 索引起始 (in shorts)
  indexCount: number; // 索引数
};

export type Vector2d = {
  x: number;
  y: number;
};

export function colorFrom255(r, g, b, a = 1) {
  return vec4.fromValues(r / 255, g / 255, b / 255, a);
}