import initShaders from "./utils/shader";
const gc = document.getElementById("webgl")!.getContext("webgl2");
if(!gc){
  throw new Error('不支持')
}

const gl: WebGL2RenderingContext = gc;

// 顶点着色器
const vertexShader = `
attribute vec2 a_position;
uniform mat4 u_tMatrix;
uniform mat4 u_rMatrix;
uniform mat4 u_sMatrix;
varying vec3 v_color;
attribute vec3 a_color;
void main() {
  // 变换矩阵 x 向量
  // OpenGL中的乘法顺序为从左向右: P * V * M平移 * M旋转 * M缩放 * 3DPoint
  // 实际执行顺序为从右向左: 3DPoint * M缩放 * M旋转 * M平移 * V * P
  gl_Position = u_tMatrix * u_rMatrix * u_sMatrix * vec4(a_position, 0.0, 1.0);
  v_color = a_color;
}`;

// 片元着色器
const fragmentShader = `
precision mediump float;
varying vec3 v_color;
void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
`;

initShaders(gl, vertexShader, fragmentShader);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// 顶点数据 x y r g b
const vertices = [
  -0.5, 0.0, 1.0, 0.0, 0.0, // 0
   0.5, 0.0, 1.0, 0.0, 0.0, // 1
   0.0, 0.8, 1.0, 0.0, 0.0, // 2
   0.0, -0.8, 1.0, 0.0, 0.0, // 3
];
const FSIZE = Float32Array.BYTES_PER_ELEMENT;

console.log("FSIZE", FSIZE);

// 创建并绑定顶点缓冲区
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// 获取 attribute 位置
const a_position = gl.getAttribLocation(gl.program, "a_position");
const a_color = gl.getAttribLocation(gl.program, "a_color");

// 缩放
const Sx = 1, Sy = 1, Sz = 1;
const scale_matrix = [
  Sx, 0, 0, 0,
  0, Sy, 0, 0,
  0, 0, Sz, 0,
  0, 0, 0, 1,
];

// 平移
const Tx = 0, Ty = 0, Tz = 0;
const translate_matrix = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  Tx, Ty, Tz, 1, // 注意：js在写矩阵时，行列需要互换转置(AT)
];

// 旋转
const deg = 90;
const cos = Math.cos((deg / 180) * Math.PI), sin = Math.sin((deg / 180) * Math.PI);
const rotate_matrix = [
  cos, sin, 0, 0,
  -sin, cos, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

// 传入变换矩阵
const u_tMatrix = gl.getUniformLocation(gl.program, "u_tMatrix");
gl.uniformMatrix4fv(u_tMatrix, false, new Float32Array(translate_matrix));
const u_rMatrix = gl.getUniformLocation(gl.program, "u_rMatrix");
gl.uniformMatrix4fv(u_rMatrix, false, new Float32Array(rotate_matrix)); // 传入旋转矩阵，旋转30度
const u_sMatrix = gl.getUniformLocation(gl.program, "u_sMatrix");
gl.uniformMatrix4fv(u_sMatrix, false, new Float32Array(scale_matrix));

// 配置 position 属性
gl.vertexAttribPointer(
  a_position,
  2, // 2个分量：x, y
  gl.FLOAT,
  false,
  5 * FSIZE, // stride 步长：每个顶点数据大小 = (2+3)*4=20 字节
  0 // offset：从第0个字节开始取
);
gl.enableVertexAttribArray(a_position);

// 配置 color 属性
gl.vertexAttribPointer(
  a_color,
  3, // 3个分量：r, g, b
  gl.FLOAT,
  false,
  5 * FSIZE, // stride
  2 * FSIZE // offset：跳过 x,y 两个 float，即跳过 8 字节
);
gl.enableVertexAttribArray(a_color);

// 索引数据，定义两个三角形的绘制顺序
const indices = [
  0, 1, 2, // 第一个三角形
  1, 0, 3  // 第二个三角形
];

// 创建并绑定索引缓冲区
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// 因为索引是整数，没有小数，用 Uint16Array 即可
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// 绘制
/**
 * @function gl.drawElements(primitiveType, count, indexType, offset)
 * @param primitiveType 绘制类型：gl.TRIANGLES 绘制三角形
 * @param count 索引数量
 * @param indexType gl.UNSIGNED_SHORT 表示索引数组类型
 * @param offset 索引缓冲区偏移量，单位字节
 */
gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);