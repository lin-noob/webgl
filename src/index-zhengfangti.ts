import initShaders from "./utils/shader";
import { mat4, vec3, glMatrix } from "gl-matrix";
import { degToRad } from "./utils/utils";
const gc = document.getElementById("webgl")!.getContext("webgl2");
if (!gc) {
  throw new Error("不支持");
}

const canvas = document.getElementById("webgl");

const gl: WebGL2RenderingContext = gc;
const v1 = [-0.5, 0.5, 0.5];
const v2 = [-0.5, -0.5, 0.5];
const v3 = [0.5, -0.5, 0.5];
const v4 = [0.5, 0.5, 0.5];
const v5 = [-0.5, 0.5, -0.5];
const v6 = [-0.5, -0.5, -0.5];
const v7 = [0.5, -0.5, -0.5];
const v8 = [0.5, 0.5, -0.5];
const positions = [
  ...v1, ...v2, ...v3, ...v4, // 前面
  ...v5, ...v6, ...v7, ...v8, // 后面
  ...v5, ...v6, ...v2, ...v1, // 左面
  ...v4, ...v3, ...v7, ...v8, // 右面
  ...v5, ...v1, ...v4, ...v8, // 上面
  ...v6, ...v2, ...v3, ...v7, // 下面
];
const c1 = [1.0, 0.0, 0.0];
const c2 = [0.0, 1.0, 0.0];
const c3 = [0.0, 0.0, 1.0];
const c4 = [0.0, 1.0, 1.0];
const c5 = [1.0, 0.0, 1.0];
const c6 = [1.0, 1.0, 0.0];
const colors = [
  ...c1, ...c1, ...c1, ...c1, //前面
  ...c2, ...c2, ...c2, ...c2, //后面
  ...c3, ...c3, ...c3, ...c3, //左面  
  ...c4, ...c4, ...c4, ...c4,//右面
  ...c5, ...c5, ...c5, ...c5, //上面
  ...c6, ...c6, ...c6, ...c6, //下面
];

/*glsl*/
const vertexShader = `
attribute vec3 a_position;
attribute vec3 a_color;
varying vec3 v_color;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projMatrix;
void main() {
  v_color = a_color;
  // P · V · M
  // gl_Position = u_projMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
  gl_Position = u_projMatrix * u_viewMatrix * vec4(a_position, 1.0);
}`;

/*glsl*/
const fragmentShader = `
precision mediump float;
varying vec3 v_color;
void main() {
  gl_FragColor = vec4(v_color, 1.0);
}`;

initShaders(gl, vertexShader, fragmentShader);
initVertexBuffers(gl);

// 视图矩阵 ViewMatrix
const viewMatrix = mat4.create();
// lookAt(out, eye, center, up)
const eye = [3, 10, 2];
mat4.lookAt(viewMatrix, eye, [0, 0, 0], [0, 5, 0]);
const u_viewMatrix = gl.getUniformLocation(gl.program, "u_viewMatrix");
gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix);

// 投影矩阵ProjectionMatrix - 【正交投影Orthography】
const u_projMatrix = gl.getUniformLocation(gl.program, "u_projMatrix");
// ortho(out, left, right, bottom, top, near, far)
const orthoMatrix = mat4.create();
mat4.ortho(orthoMatrix, -1, 1, -1, 1, 0, 100);
gl.uniformMatrix4fv(u_projMatrix, false, orthoMatrix);

// 投影矩阵ProjectionMatrix - 【透视投影Perspective】
// perspective(out, fovy, aspect, near, far)
const perspectiveMatrix = mat4.create();
mat4.perspective(
  perspectiveMatrix,
  (30 / 180) * Math.PI,
  canvas.width / canvas.height,
  0.1,
  100
);
gl.uniformMatrix4fv(u_projMatrix, false, perspectiveMatrix);

function tick() {
  let time = Date.now() * 0.005;
  // eye[0] = Math.sin(time);
  eye[1] = Math.sin(time);
  eye[2] = Math.cos(time);
  // 调整视图矩阵
  mat4.lookAt(viewMatrix, eye, [0, 0, 0], [0, 1, 0]);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix);
  draw(gl);
  requestAnimationFrame(tick);
}
tick();
draw(gl);

function initVertexBuffers(gl) {
  let FSIZE = 4;
  let positionsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  let a_position = gl.getAttribLocation(gl.program, "a_position");
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, FSIZE * 0);
  gl.enableVertexAttribArray(a_position);
  let colorsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  let a_color = gl.getAttribLocation(gl.program, "a_color");
  gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, FSIZE * 0);
  gl.enableVertexAttribArray(a_color);
}

function draw(gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  for (let i = 0; i < 24; i += 4) {
    gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
  }
}