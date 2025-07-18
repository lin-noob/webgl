import vertSrc from './shaders/vertex.glsl';
import fragSrc from './shaders/fragment.glsl';
import WebGLShapeRenderer from './gal';
import GPUShapeRenderer from './GPUShapeRenderer';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const gl = canvas.getContext('webgl2');
if (!gl) throw 'WebGL2 not supported';

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener('resize', resize);
resize();

const renderer = new GPUShapeRenderer(canvas);

// 画线
renderer.drawShape({
    type: 1,  // Line
    x: 100, 
    y: 100, 
    radius: 200,  // 线段长度
    color: [1,0,0,1],  // 红色
    lineWidth: 5
});

// const gal = new WebGLShapeRenderer(canvas)
// gal.drawRect(50, 50, 100, 80, {
//   fill: true,
//   stroke: true,
//   fillColor: [0, 0, 0, 1],
//   strokeColor: [0, 0, 0, 1],
//   lineWidth: 10
// });
// gal.render();
// function compile(type, src) {
//   const s = gl.createShader(type);
//   gl.shaderSource(s, src);
//   gl.compileShader(s);
//   if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
//     console.error(gl.getShaderInfoLog(s));
//   return s;
// }
// const prog = gl.createProgram();
// gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
// gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
// gl.linkProgram(prog);

// const posLoc = gl.getAttribLocation(prog, 'aPosition');
// const vbo = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
// gl.bufferData(
//   gl.ARRAY_BUFFER,
//   new Float32Array([0,0, -0.5,-0.5]),
//   gl.STATIC_DRAW
// );
// gl.enableVertexAttribArray(posLoc);
// gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// function draw() {
//   gl.clearColor(0,0,0,1);
//   gl.clear(gl.COLOR_BUFFER_BIT);
//   gl.useProgram(prog);
//   gl.drawArrays(gl.LINES, 0, 2);
//   requestAnimationFrame(draw);
// }
// draw();