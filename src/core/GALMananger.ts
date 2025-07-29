// file: renderer.ts
import { mat4, vec4 } from "gl-matrix";
import earcut from "earcut";
import { GAL } from "./gal";
import { ShapShader, colorFrom255 } from "../utils/utils";
// 导入shader文件，忽略类型检查
// @ts-ignore
import vertexShader from "../shaders/globalVertex.glsl";
// @ts-ignore
import fragmentShader from "../shaders/glovalFrag.glsl";

interface DrawCommand {
  batchType: string;
  mode: GLenum;
  vertOffset: number;
  vertCount: number;
  indexOffset: number;
  indexCount: number;
}

export class GALMananger {
  private gal: GAL;
  private canvas: HTMLCanvasElement;

  private verts = new Float32Array(1024 * 10);
  private indices = new Uint32Array(1024 * 3);
  private vertUsed = 0;
  private indexUsed = 0;
  private drawCommands: DrawCommand[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: true });
    if (!gl) {
      throw new Error("WebGL2 not supported");
    }
    this.gal = new GAL(
      gl,
      vertexShader,
      fragmentShader,
      this.verts.byteLength,
      this.indices.byteLength
    );
    this.canvas = canvas;
    this.setupProjection();
  }

  private setupProjection(): void {
    // 使用gl-matrix库创建正交投影矩阵
    const matrix = mat4.create();

    // 创建一个简单的正交投影
    // 注意：WebGL的坐标系是右手坐标系，Y轴向上为正
    mat4.ortho(
      matrix,
      0, // left
      this.canvas.width, // right
      0, // bottom
      this.canvas.height, // top
      -1, // near
      1 // far
    );

    console.log(
      `Setting up projection with canvas size: ${this.canvas.width}x${this.canvas.height}`
    );
    console.log("Setting projection matrix:", matrix);

    // 转换为Float32Array并传递给着色器
    this.gal.setMatrix(new Float32Array(matrix));
  }

  // 获取或创建渲染批次
  private getBatch(mode: GLenum, batchType?: string): DrawCommand {
    console.log(
      `Getting batch for ${batchType}, current drawCommands:`,
      this.drawCommands
    );

    let cmd = this.drawCommands.find((c) => c.batchType === batchType) as DrawCommand;
    if (!cmd && batchType) {
      // 创建新批次，使用当前的vertUsed和indexUsed作为offset
      cmd = {
        batchType,
        mode,
        vertOffset: 0, // 始终从0开始，因为我们在addLine中清除了drawCommands
        vertCount: 0,
        indexOffset: 0, // 始终从0开始
        indexCount: 0,
      };
      console.log(`Created new batch: ${JSON.stringify(cmd)}`);
      this.drawCommands.push(cmd);
    } else {
      // 更新现有批次，确保offset是正确的
      console.log(`Found existing batch: ${JSON.stringify(cmd)}`);
    }
    return cmd;
  }

  // 检查并按需扩容缓冲区
  private resizeVertsIfNeeded(neededFloats: number): void {
    if (this.vertUsed + neededFloats > this.verts.length) {
      const newVerts = new Float32Array(this.verts.length * 2);
      newVerts.set(this.verts);
      this.verts = newVerts;
      this.gal.resizeVBO(this.verts.byteLength);
    }
  }

  private resizeIndicesIfNeeded(neededIndices: number): void {
    if (this.indexUsed + neededIndices > this.indices.length) {
      const newIndices = new Uint32Array(this.indices.length * 2);
      newIndices.set(this.indices);
      this.indices = newIndices;
      this.gal.resizeIBO(this.indices.byteLength);
    }
  }

  public addLine(
    A: { x: number; y: number },
    B: { x: number; y: number },
    width: number,
    color: vec4,
    id?: string
  ): void {
    console.log(
      `GALMananger.addLine: from (${A.x}, ${A.y}) to (${B.x}, ${B.y}), width: ${width}, color:`,
      color
    );

    const batchType = id;
    this.resizeVertsIfNeeded(6 * 10);
    this.resizeIndicesIfNeeded(6);

    const vertOffset = this.vertUsed / 10;
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    const [r, g, b, a] = color;
    const vec4Color = colorFrom255(r, g, b, a);
    console.log("Converted color:", vec4Color);

    const lineVerts = [
      A.x,
      A.y,
      ...vec4Color,
      ShapShader.SHADER_LINE_A,
      width,
      dx,
      dy,
      A.x,
      A.y,
      ...vec4Color,
      ShapShader.SHADER_LINE_B,
      width,
      dx,
      dy,
      B.x,
      B.y,
      ...vec4Color,
      ShapShader.SHADER_LINE_C,
      width,
      dx,
      dy,
      A.x,
      A.y,
      ...vec4Color,
      ShapShader.SHADER_LINE_B,
      width,
      dx,
      dy,
      B.x,
      B.y,
      ...vec4Color,
      ShapShader.SHADER_LINE_C,
      width,
      dx,
      dy,
      B.x,
      B.y,
      ...vec4Color,
      ShapShader.SHADER_LINE_D,
      width,
      dx,
      dy,
    ];
    this.verts.set(lineVerts, this.vertUsed);
    this.vertUsed += lineVerts.length;

    const lineIndices = [
      vertOffset,
      vertOffset + 1,
      vertOffset + 2,
      vertOffset + 3,
      vertOffset + 4,
      vertOffset + 5,
    ];
    this.indices.set(lineIndices, this.indexUsed);
    this.indexUsed += lineIndices.length;

    const cmd = this.getBatch(this.gal.gl.TRIANGLES, batchType);
    cmd.vertCount = lineVerts.length / 10; // 每个顶点10个浮点数
    cmd.indexCount = lineIndices.length;
    cmd.indexOffset = vertOffset;
    cmd.vertOffset = vertOffset;

    console.log(
      `Line added: vertOffset=${vertOffset}, vertCount=${cmd.vertCount}, indexOffset=${cmd.indexOffset}, indexCount=${cmd.indexCount}`
    );
    console.log("Current drawCommands:", this.drawCommands);
  }

  public addCircle(
    C: { x: number; y: number },
    radius: number,
    lineWidth: number,
    color: vec4,
    id?: string
  ): void {
    const batchType = "circle";
    this.resizeVertsIfNeeded(3 * 10);
    this.resizeIndicesIfNeeded(3);

    const [r, g, b, a] = color;
    const vec4Color = colorFrom255(r, g, b, a);
    const vertOffset = this.vertUsed / 10;
    const circleVerts = [
      C.x,
      C.y,
      ...vec4Color,
      ShapShader.SHADER_CIRCLE,
      1.0,
      radius,
      radius,
      C.x,
      C.y,
      ...vec4Color,
      ShapShader.SHADER_CIRCLE,
      2.0,
      radius,
      radius,
      C.x,
      C.y,
      ...vec4Color,
      ShapShader.SHADER_CIRCLE,
      3.0,
      radius,
      radius,
    ];
    this.verts.set(circleVerts, this.vertUsed);
    this.vertUsed += circleVerts.length;

    const circleIndices = [vertOffset, vertOffset + 1, vertOffset + 2];
    this.indices.set(circleIndices, this.indexUsed);
    this.indexUsed += circleIndices.length;

    const cmd = this.getBatch(batchType, this.gal.gl.TRIANGLES);
    cmd.vertCount += circleVerts.length;
    cmd.indexCount += circleIndices.length;
  }

  public addPolygon(
    polygon: { x: number; y: number }[],
    lineWidth: number,
    color: vec4,
    id?: string
  ): void {
    const batchType = "polygon";
    const numVerts = polygon.length;
    this.resizeVertsIfNeeded(numVerts * 10);

    const [r, g, b, a] = color;
    const vec4Color = colorFrom255(r, g, b, a);
    const vertOffset = this.vertUsed / 10;
    for (let i = 0; i < numVerts; i++) {
      this.verts.set(
        [
          polygon[i].x,
          polygon[i].y,
          ...vec4Color,
          ShapShader.SHADER_TRIANGLE,
          1,
          0,
          0,
        ],
        this.vertUsed + i * 10
      );
    }
    this.vertUsed += numVerts * 10;

    const flatVerts = polygon.map((p) => [p.x, p.y]).flat();
    const triIndices = earcut(flatVerts);
    this.resizeIndicesIfNeeded(triIndices.length);

    this.indices.set(
      triIndices.map((i) => vertOffset + i),
      this.indexUsed
    );
    this.indexUsed += triIndices.length;

    const cmd = this.getBatch(batchType, this.gal.gl.TRIANGLES);
    cmd.vertCount += numVerts * 10;
    cmd.indexCount += triIndices.length;
  }

  public updateBatch(
    batchType: string,
    modifyFn: (positions: number[][]) => number[][]
  ): void {
    const cmd = this.drawCommands.find((c) => c.batchType === batchType);
    if (!cmd) return;

    const numVerts = cmd.vertCount / 10;
    const positions: number[][] = [];
    for (let i = 0; i < numVerts; i++) {
      const idx = cmd.vertOffset + i * 10;
      positions.push([this.verts[idx], this.verts[idx + 1]]);
    }

    const newPositions = modifyFn(positions);

    for (let i = 0; i < numVerts; i++) {
      const idx = cmd.vertOffset + i * 10;
      this.verts[idx] = newPositions[i][0];
      this.verts[idx + 1] = newPositions[i][1];
    }

    this.gal.updateVBO(
      this.verts.subarray(cmd.vertOffset, cmd.vertOffset + cmd.vertCount),
      cmd.vertOffset * Float32Array.BYTES_PER_ELEMENT
    );
  }

  public flush(): void {
    console.log(
      "Flushing buffers - vertices:",
      this.vertUsed,
      "indices:",
      this.indexUsed
    );

    if (this.vertUsed > 0) {
      // 检查数据是否有效
      const vertData = this.verts.subarray(0, this.vertUsed);
      console.log(
        "Vertex data sample:",
        vertData.slice(0, Math.min(20, this.vertUsed))
      );
      this.gal.updateVBO(vertData, 0);
    }

    if (this.indexUsed > 0) {
      // 检查索引数据是否有效
      const indexData = this.indices.subarray(0, this.indexUsed);
      console.log(
        "Index data sample:",
        indexData.slice(0, Math.min(20, this.indexUsed))
      );
      this.gal.updateIBO(indexData, 0);
    }
  }

  public render(updateFn?: () => void): void {
    console.log("Render called, commands:", this.drawCommands.length);

    // 检查缓冲区状态
    console.log(
      "Buffer state - vertices:",
      this.vertUsed,
      "indices:",
      this.indexUsed
    );
    console.log("Draw commands detail:", JSON.stringify(this.drawCommands));

    // 清除画布
    this.gal.clear();

    if (updateFn) {
      updateFn();
    }

    // 检查是否有可绘制的命令
    if (this.drawCommands.length === 0) {
      console.warn("No draw commands to render");
      return;
    }

    // 准备绘制命令
    const drawableCmds = this.drawCommands.map((cmd) => ({
      mode: cmd.mode,
      indexCount: cmd.indexCount,
      indexOffset: cmd.indexOffset,
    }));

    console.log("Prepared draw commands:", drawableCmds);

    // 执行绘制
    this.gal.draw(drawableCmds);

    // 不使用requestAnimationFrame循环
    // requestAnimationFrame(() => this.render(updateFn));
  }

  public clear(): void {
    this.vertUsed = 0;
    this.indexUsed = 0;
    this.drawCommands = [];
  }
}
