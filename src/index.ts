import initShaders from "./utils/shader";
import vertexShader from "./shaders/globalVertex.glsl";
import fragmentShader from "./shaders/glovalFrag.glsl";
import { mat4 } from "gl-matrix";
import { ShapShader } from "./utils/utils";  // 假设有SHADER_LINE_A等常量
import earcut from "earcut";

// 类型定义
interface DrawCommand {
  batchType: string;   // 批类型 (e.g., 'line', 'circle')
  mode: GLenum;        // gl.TRIANGLES 等
  vertOffset: number;  // verts数组起始 (floats)
  vertCount: number;   // 本批顶点floats数
  indexOffset: number; // indices数组起始
  indexCount: number;  // 本批索引数
}

// 全局缓冲数据（预分配）
let verts = new Float32Array(1024 * 10);      // 预分配 (1024 verts * 10 floats)
let indices = new Uint32Array(1024 * 3);      // 预分配 (1024 triangles * 3 indices)
let vertUsed = 0;                             // 当前使用floats数
let indexUsed = 0;                            // 当前使用indices数
const drawCommands: DrawCommand[] = [];       // 现在是批命令列表 (每个是1批)

// 全局VAO
let vao: WebGLVertexArrayObject | null = null;
let vbo: WebGLBuffer | null = null;
let ibo: WebGLBuffer | null = null;

const gc = document.getElementById("webgl")!.getContext("webgl2", { antialias: true });
if (!gc) {
  throw new Error("不支持");
}
const gl = gc as WebGL2RenderingContext;
const canvas = document.getElementById("webgl")! as HTMLCanvasElement;

gl.viewport(0, 0, canvas.width, canvas.height);
initShaders(gl, vertexShader, fragmentShader);

// 添加初始几何体
addLine("line-1", { x: -100, y: 0 }, { x: 100, y: 0 }, 20, [1.0, 0.0, 0.0, 1.0]);
addLine("line-2", { x: -50, y: 50 }, { x: 50, y: 50 }, 10, [0.0, 1.0, 0.0, 1.0]);

addCircle("circle-1", { x: -100, y: 100 }, 30, [1.0, 0.0, 0.0, 1.0]);
addCircle("circle-2", { x: 100, y: -100 }, 20, [0.0, 0.0, 1.0, 1.0]); // 添加第二个圆来测试批处理

addPolygon("polygon-1", [
  { x: 10, y: 0 },
  { x: 0, y: 50 },
  { x: 60, y: 60 },
  { x: 70, y: 10 }
], [0.0, 1.0, 0.0, 1.0]);

// 初始化VAO和缓冲
initVertexBuffers(gl);
draw(gl);

// 初始化顶点缓冲和批次
function initVertexBuffers(gl: WebGL2RenderingContext) {
  const program = gl.program;
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const colorLocation = gl.getAttribLocation(program, "a_color");
  const shaderParamsLocation = gl.getAttribLocation(program, "a_shaderParams");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, vertUsed), gl.DYNAMIC_DRAW);

  const stride = 10 * Float32Array.BYTES_PER_ELEMENT;
  let offset = 0;
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, offset);
  gl.enableVertexAttribArray(positionLocation);
  offset += 2 * Float32Array.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, stride, offset);
  gl.enableVertexAttribArray(colorLocation);
  offset += 4 * Float32Array.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(shaderParamsLocation, 4, gl.FLOAT, false, stride, offset);
  gl.enableVertexAttribArray(shaderParamsLocation);

  ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices.subarray(0, indexUsed), gl.DYNAMIC_DRAW);

  gl.bindVertexArray(null);

  const matrix = mat4.create();
  mat4.translate(matrix, matrix, [canvas.width / 2, canvas.height / 2, 0]);
  mat4.ortho(matrix, -canvas.width / 2, canvas.width / 2, -canvas.height / 2, canvas.height / 2, -1, 1);
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
}

function draw(gl: WebGL2RenderingContext) {
  gl.clearColor(1, 1, 1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (!vao) {
    console.error("VAO not initialized!");
    return;
  }

  gl.bindVertexArray(vao);

  for (const cmd of drawCommands) {
    gl.drawElements(cmd.mode, cmd.indexCount, gl.UNSIGNED_INT, cmd.indexOffset * 4);
  }

  gl.bindVertexArray(null);

  requestAnimationFrame(() => {
    // updateBatch(gl, "line", (positions) => positions.map(p => [p[0] > 200 ? -200 : p[0] + 1, p[1]]));
    draw(gl);
  });
}

function addLine(id: string, A: { x: number; y: number }, B: { x: number; y: number }, width: number, color: number[]) {
  const batchType = "line";
  if (vertUsed + 6 * 10 > verts.length) resizeVerts(gl);

  const vertStart = vertUsed;
  const vertOffset = vertUsed / 10;
  const dx = B.x - A.x;
  const dy = B.y - A.y;

  const lineVerts = [
    A.x, A.y, ...color, ShapShader.SHADER_LINE_A, width, dx, dy,
    A.x, A.y, ...color, ShapShader.SHADER_LINE_B, width, dx, dy,
    B.x, B.y, ...color, ShapShader.SHADER_LINE_C, width, dx, dy,
    A.x, A.y, ...color, ShapShader.SHADER_LINE_B, width, dx, dy,
    B.x, B.y, ...color, ShapShader.SHADER_LINE_C, width, dx, dy,
    B.x, B.y, ...color, ShapShader.SHADER_LINE_D, width, dx, dy,
  ];
  verts.set(lineVerts, vertUsed);
  vertUsed += lineVerts.length;

  if (indexUsed + 6 > indices.length) resizeIndices(gl);

  const indexStart = indexUsed;
  const lineIndices = [vertOffset, vertOffset + 1, vertOffset + 2, vertOffset + 3, vertOffset + 4, vertOffset + 5];
  indices.set(lineIndices, indexUsed);
  indexUsed += lineIndices.length;

  let cmd = drawCommands.find((c) => c.batchType === batchType);
  if (!cmd) {
    cmd = {
      batchType,
      mode: gl.TRIANGLES,
      vertOffset: vertStart,
      vertCount: 0,
      indexOffset: indexStart,
      indexCount: 0
    };
    drawCommands.push(cmd);
  }
  cmd.vertCount += lineVerts.length;
  cmd.indexCount += lineIndices.length;
}

function addCircle(id: string, C: { x: number; y: number }, radius: number, color: number[]) {
  const batchType = "circle";
  if (vertUsed + 3 * 10 > verts.length) resizeVerts(gl);

  const vertStart = vertUsed;
  const vertOffset = vertUsed / 10;

  const circleVerts = [
    C.x, C.y, ...color, ShapShader.SHADER_CIRCLE, 1.0, radius, radius,
    C.x, C.y, ...color, ShapShader.SHADER_CIRCLE, 2.0, radius, radius,
    C.x, C.y, ...color, ShapShader.SHADER_CIRCLE, 3.0, radius, radius,
  ];
  verts.set(circleVerts, vertUsed);
  vertUsed += circleVerts.length;

  if (indexUsed + 3 > indices.length) resizeIndices(gl);

  const indexStart = indexUsed;
  const circleIndices = [vertOffset, vertOffset + 1, vertOffset + 2];
  indices.set(circleIndices, indexUsed);
  indexUsed += circleIndices.length;

  let cmd = drawCommands.find((c) => c.batchType === batchType);
  if (!cmd) {
    cmd = {
      batchType,
      mode: gl.TRIANGLES,
      vertOffset: vertStart,
      vertCount: 0,
      indexOffset: indexStart,
      indexCount: 0
    };
    drawCommands.push(cmd);
  }
  cmd.vertCount += circleVerts.length;
  cmd.indexCount += circleIndices.length;
}

function addPolygon(id: string, polygon: { x: number; y: number }[], color: number[]) {
  const batchType = "polygon";
  const numVerts = polygon.length;
  if (vertUsed + numVerts * 10 > verts.length) resizeVerts(gl);

  const vertStart = vertUsed;
  const vertOffset = vertUsed / 10;

  for (let i = 0; i < numVerts; i++) {
    verts.set([polygon[i].x, polygon[i].y, ...color, ShapShader.SHADER_TRIANGLE, 1, 0, 0], vertUsed + i * 10);
  }
  vertUsed += numVerts * 10;

  const list = polygon.map((item) => [item.x, item.y]).flat();
  const polygonTriangles = earcut(list);
  const numIndices = polygonTriangles.length;

  if (indexUsed + numIndices > indices.length) resizeIndices(gl);

  const indexStart = indexUsed;
  indices.set(polygonTriangles.map(i => vertOffset + i), indexUsed);
  indexUsed += numIndices;

  let cmd = drawCommands.find((c) => c.batchType === batchType);
  if (!cmd) {
    cmd = {
      batchType,
      mode: gl.TRIANGLES,
      vertOffset: vertStart,
      vertCount: 0,
      indexOffset: indexStart,
      indexCount: 0
    };
    drawCommands.push(cmd);
  }
  cmd.vertCount += numVerts * 10;
  cmd.indexCount += numIndices;
}

function updateBatch(gl: WebGL2RenderingContext, batchType: string, modifyFn: (pos: number[][]) => number[][]) {
  const cmd = drawCommands.find((c) => c.batchType === batchType);
  if (!cmd) return;

  const floatsPerVert = 10;
  const numVerts = cmd.vertCount / floatsPerVert;

  const positions = [];
  for (let i = 0; i < numVerts; i++) {
    const idx = cmd.vertOffset + i * floatsPerVert;
    positions.push([verts[idx], verts[idx + 1]]);
  }

  const newPositions = modifyFn(positions);

  for (let i = 0; i < numVerts; i++) {
    const idx = cmd.vertOffset + i * floatsPerVert;
    verts[idx] = newPositions[i][0];
    verts[idx + 1] = newPositions[i][1];
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    cmd.vertOffset * Float32Array.BYTES_PER_ELEMENT,
    verts.subarray(cmd.vertOffset, cmd.vertOffset + cmd.vertCount)
  );
}

function resizeVerts(gl: WebGL2RenderingContext) {
  const newSize = verts.length * 2;
  const newVerts = new Float32Array(newSize);
  newVerts.set(verts);
  verts = newVerts;

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
}

function resizeIndices(gl: WebGL2RenderingContext) {
  const newSize = indices.length * 2;
  const newIndices = new Uint32Array(newSize);
  newIndices.set(indices);
  indices = newIndices;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
}

function createOrthoMatrix(left: number, right: number, bottom: number, top: number, near: number, far: number) {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  return [
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
  ];
}