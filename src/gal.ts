export default class WebGLShapeRenderer {
  public gl: WebGL2RenderingContext;
  public shapes: number[];
  public vertices: number[];
  public indices: number[];
  public colors: number[];

  private program: any;
  private buffers: any;
  private uniformLocations: any;
  private attribLocations: any;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL 2 not supported");
    }
    this.gl = gl;
    this.shapes = [];
    this.vertices = [];
    this.indices = [];
    this.colors = [];

    this.program = null;
    this.buffers = null;
    this.uniformLocations = {};
    this.attribLocations = {};

    this.initShaders();
    this.initBuffers();
  }

  // 在 initShaders 方法中
  initShaders() {
    const vsSource = `#version 300 es
    in vec2 a_position;
    in vec4 a_color;
    
    uniform mat3 u_matrix;
    
    out vec4 v_color;
    
    void main() {
      // 将 2D 像素坐标通过矩阵变换到裁剪空间
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_color = a_color;
    }
  `;

    const fsSource = `#version 300 es
    precision mediump float;
    
    in vec4 v_color;
    
    out vec4 outColor;
    
    void main() {
      outColor = v_color;
    }
  `;

    // ... (编译和链接着色器的辅助函数)
    this.program = this.createProgram(vsSource, fsSource);

    // 获取 attribute 和 uniform 的位置
    this.attribLocations = {
      position: this.gl.getAttribLocation(this.program, "a_position"),
      color: this.gl.getAttribLocation(this.program, "a_color"),
    };
    this.uniformLocations = {
      matrix: this.gl.getUniformLocation(this.program, "u_matrix"),
    };
  }

  initBuffers() {
    const gl = this.gl;
    this.buffers = {
      position: gl.createBuffer(),
      color: gl.createBuffer(),
      indices: gl.createBuffer(),
    };
  }

  /**
   * 创建并链接一个 WebGL 程序
   * @param {string} vsSource - 顶点着色器源码
   * @param {string} fsSource - 片元着色器源码
   * @returns {WebGLProgram | null} 成功则返回 WebGLProgram，失败则返回 null
   */
  createProgram(vsSource, fsSource) {
    const gl = this.gl;

    // --- 1. 编译着色器 ---
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    // --- 2. 创建并链接程序 ---
    const program = gl.createProgram();
    gl.attachShader(program!, vertexShader);
    gl.attachShader(program!, fragmentShader);
    gl.linkProgram(program!);

    // --- 3. 检查链接状态 ---
    if (!gl.getProgramParameter(program!, gl.LINK_STATUS)) {
      console.error("无法链接 WebGL 程序:", gl.getProgramInfoLog(program!));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    // 在实际项目中，链接成功后可以立即分离和删除着色器对象，以释放资源
    // 因为它们已经被链接到程序中了，不再需要独立存在
    gl.detachShader(program!, vertexShader);
    gl.detachShader(program!, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  /**
   * 编译单个着色器
   * @param {number} type - gl.VERTEX_SHADER 或 gl.FRAGMENT_SHADER
   * @param {string} source - 着色器源码
   * @returns {WebGLShader | null} 成功则返回 WebGLShader，失败则返回 null
   */
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);

    gl.shaderSource(shader!, source);
    gl.compileShader(shader!);

    // 检查编译状态
    if (!gl.getShaderParameter(shader!, gl.COMPILE_STATUS)) {
      const typeName = type === gl.VERTEX_SHADER ? "顶点着色器" : "片元着色器";
      console.error(`编译${typeName}时出错:`, gl.getShaderInfoLog(shader!));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  drawRect(x, y, width, height, options = {}) {
    const {
      fill = true,
      stroke = false,
      fillColor = [1, 0, 0, 1],
      strokeColor = [0, 0, 0, 1],
      lineWidth = 1,
    } = options;

    if (fill) {
      const baseIndex = this.vertices.length / 2;
      // 添加4个顶点
      this.vertices.push(
        x,
        y,
        x + width,
        y,
        x + width,
        y + height,
        x,
        y + height
      );
      // 添加4个顶点的颜色
      for (let i = 0; i < 4; i++) this.colors.push(...fillColor);
      // 添加索引，组成两个三角形
      this.indices.push(
        baseIndex,
        baseIndex + 1,
        baseIndex + 2,
        baseIndex,
        baseIndex + 2,
        baseIndex + 3
      );
    }

    if (stroke && lineWidth > 0) {
      // 描边就是画一个闭合的折线
      const points = [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ];
      this.drawLine(points, { color: strokeColor, lineWidth, closed: true });
    }
  }
  drawCircle(x, y, radius, options) {}
  drawPolygon(points, options) {}
  drawLine(points, options = {}) {
    const { color = [0, 0, 0, 1], lineWidth = 1, closed = false } = options;
    if (points.length < 2) return;

    const path = closed ? [...points, points[0]] : points;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];

      // 计算线段的法线
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      // 单位法线向量，乘以线宽的一半
      const nx = (-dy / len) * (lineWidth / 2);
      const ny = (dx / len) * (lineWidth / 2);

      const baseIndex = this.vertices.length / 2;
      // 添加构成线段矩形的4个顶点
      this.vertices.push(
        p1[0] - nx,
        p1[1] - ny,
        p1[0] + nx,
        p1[1] + ny,
        p2[0] - nx,
        p2[1] - ny,
        p2[0] + nx,
        p2[1] + ny
      );
      for (let k = 0; k < 4; k++) this.colors.push(...color);

      this.indices.push(
        baseIndex,
        baseIndex + 1,
        baseIndex + 2,
        baseIndex + 1,
        baseIndex + 3,
        baseIndex + 2
      );
    }

    // TODO: 处理线段连接处的尖角/圆角，这会让实现更复杂
  }

  render() {
    const gl = this.gl;
    const buffers = this.buffers;

    if (this.indices.length === 0) return;

    // --- 1. 上传数据到 GPU ---
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.DYNAMIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.colors),
      gl.DYNAMIC_DRAW
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices),
      gl.DYNAMIC_DRAW
    );

    // --- 2. 设置渲染状态 ---
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // 透明背景
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // --- 3. 绑定属性和 Uniforms ---
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.enableVertexAttribArray(this.attribLocations.position);
    gl.vertexAttribPointer(
      this.attribLocations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.enableVertexAttribArray(this.attribLocations.color);
    gl.vertexAttribPointer(
      this.attribLocations.color,
      4,
      gl.FLOAT,
      false,
      0,
      0
    );

    // 创建从像素坐标到裁剪空间的变换矩阵
    const matrix = [
      2 / gl.canvas.width,
      0,
      0,
      0,
      -2 / gl.canvas.height,
      0,
      -1,
      1,
      1,
    ];
    gl.uniformMatrix3fv(this.uniformLocations.matrix, false, matrix);

    // --- 4. 执行绘制 ---
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    // --- 5. 清理本次批次数据 ---
    this.clear();
  }
  clear() {}
}
