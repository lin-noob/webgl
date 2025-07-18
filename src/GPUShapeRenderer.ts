import vertexShaderSource from "./shaders/vert.glsl";
import fragmentShaderSource from "./shaders/frag.glsl";

export default class GPUShapeRenderer {
  constructor(canvas) {
    this.gl = canvas.getContext("webgl2");
    this.initGL();
  }

  initGL() {
    const gl = this.gl;

    // 创建着色器程序
    this.program = this.createShaderProgram(
      this.compileShader(gl.VERTEX_SHADER, vertexShaderSource),
      this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
    );

    // 创建缓冲区
    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.paramsBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
  }

  createShaderProgram(vertexShader, fragmentShader) {
    const gl = this.gl;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  drawShape(options) {
    const {
      type, // 形状类型
      x,
      y, // 中心点
      radius, // 半径
      sides, // 多边形边数
      color = [1, 0, 0, 1], // 颜色
      lineWidth = 1, // 线宽
    } = options;

    const gl = this.gl;
    gl.useProgram(this.program);

    // 设置 Uniforms
    const matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
    const lineWidthLocation = gl.getUniformLocation(
      this.program,
      "u_lineWidth"
    );
    const shapeTypeLocation = gl.getUniformLocation(
      this.program,
      "u_shapeType"
    );

    // 设置变换矩阵和其他 Uniforms
    const matrix = this.createProjectionMatrix(
      gl.canvas.width,
      gl.canvas.height
    );
    gl.uniformMatrix3fv(matrixLocation, false, matrix);
    gl.uniform1f(lineWidthLocation, lineWidth);
    gl.uniform1f(shapeTypeLocation, type);

    // 生成顶点数据
    const vertices = [];
    const colors = [];
    const params = [];
    const texCoords = [];

    switch (type) {
      case 1: // Line
        vertices.push(x, y, x + radius, y);
        colors.push(...color, ...color);
        params.push(x, y, x + radius, y);
        texCoords.push(0, 0, 1, 1);
        break;

      case 2: // Circle
        for (let i = 0; i < 6; i++) {
          vertices.push(x, y);
          colors.push(...color);
          params.push(radius, 0, 0, 0);
          texCoords.push(
            i < 3 ? 0.0 : 1.0,
            i % 3 === 0 ? 0.0 : i % 3 === 1 ? 1.0 : 0.0
          );
        }
        break;

      case 3: // Polygon
        const vertexCount = sides + 2;
        for (let i = 0; i < vertexCount; i++) {
          vertices.push(x, y);
          colors.push(...color);
          params.push(radius, sides, 0, 0);
          texCoords.push(i === 0 ? 0.0 : (i - 1) / (sides - 1), 0.0);
        }
        break;
    }

    // 传输数据到 GPU
    this.updateBuffer(this.positionBuffer, new Float32Array(vertices), 2);
    this.updateBuffer(this.colorBuffer, new Float32Array(colors), 4);
    this.updateBuffer(this.paramsBuffer, new Float32Array(params), 4);
    this.updateBuffer(this.texCoordBuffer, new Float32Array(texCoords), 2);

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }

  updateBuffer(buffer, data, size) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  }

  createProjectionMatrix(width, height) {
    return new Float32Array([2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1]);
  }
}
