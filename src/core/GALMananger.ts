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

  // 定义类的属性，用于存储坐标系统参数
  private unitSize: number = 1; // 单位距离，如1mil
  private scale: number = 1;    // 缩放比例
  private panX: number = 0;     // 平移X
  private panY: number = 0;     // 平移Y

  // 设置单位大小和缩放比例
  public setCoordinateSystem(unitSize: number, scale: number, panX: number = 0, panY: number = 0): void {
    this.unitSize = unitSize;
    this.scale = scale;
    this.panX = panX;
    this.panY = panY;
    this.setupProjection(); // 重新计算投影矩阵
  }

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

    // 计算视口范围
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    // 计算数据坐标系范围
    // 基于单位大小、缩放比例和画布尺寸计算
    const effectiveScale = this.unitSize * this.scale;
    const halfWidth = (canvasWidth / 2) / effectiveScale;
    const halfHeight = (canvasHeight / 2) / effectiveScale;
    
    // 数据坐标系范围，考虑平移
    const dataLeft = -halfWidth + this.panX;
    const dataRight = halfWidth + this.panX;
    const dataBottom = -halfHeight + this.panY;
    const dataTop = halfHeight + this.panY;

    // 创建一个正交投影，将数据坐标系映射到NDC坐标系(-1到1)
    mat4.ortho(
      matrix,
      dataLeft,     // 数据坐标系左边界
      dataRight,    // 数据坐标系右边界
      dataBottom,   // 数据坐标系下边界
      dataTop,      // 数据坐标系上边界
      -1,           // near裁剪面
      1             // far裁剪面
    );

    // 设置视口，确保WebGL渲染区域与canvas大小匹配
    this.gal.gl.viewport(
      0,
      0,
      this.gal.gl.canvas.width,
      this.gal.gl.canvas.height
    );

    // 转换为Float32Array并传递给着色器
    this.gal.setMatrix(new Float32Array(matrix));
  }

  // 获取或创建渲染批次
  private getBatch(mode: GLenum, batchType?: string): DrawCommand {

    let cmd = this.drawCommands.find(
      (c) => c.batchType === batchType
    ) as DrawCommand;
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
      this.drawCommands.push(cmd);
    } else {
      // 更新现有批次，确保offset是正确的
      // console.log(`Found existing batch: ${JSON.stringify(cmd)}`);
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

    // 使用固定的批次类型"line"，而不是使用id
    const batchType = "line";
    this.resizeVertsIfNeeded(6 * 10);
    this.resizeIndicesIfNeeded(6);

    const vertOffset = this.vertUsed / 10;
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    const [r, g, b, a] = color;
    const vec4Color = colorFrom255(r, g, b, a);

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
    // 更新批次的顶点和索引计数，而不是覆盖它们
    cmd.vertCount += lineVerts.length / 10; // 每个顶点10个浮点数
    cmd.indexCount += lineIndices.length;
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

    const cmd = this.getBatch(this.gal.gl.TRIANGLES, batchType);
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

    const cmd = this.getBatch(this.gal.gl.TRIANGLES, batchType);
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

    if (this.vertUsed > 0) {
      // 检查数据是否有效
      const vertData = this.verts.subarray(0, this.vertUsed);
      this.gal.updateVBO(vertData, 0);
    }

    if (this.indexUsed > 0) {
      // 检查索引数据是否有效
      const indexData = this.indices.subarray(0, this.indexUsed);
      this.gal.updateIBO(indexData, 0);
    }
  }

  public render(updateFn?: () => void): void {
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
