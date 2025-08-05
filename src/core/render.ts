import { vec2, vec4 } from "gl-matrix";
import { GALMananger } from "./galMananger";
import { Vector2d } from "../utils/utils";
import Grid from "../class/element/grid";

export default class Render {
  public id: string;
  public gal: GALMananger;
  
  // 存储当前的坐标系统参数
  private unitSize: number = 1;
  private scale: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private zoomFactor: number = 1.1; // 每次缩放的倍数

  // 背景格点
  private grid: Grid | null = null;

  constructor(id: string) {
    this.id = id;
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error("Canvas not found");
    }
    this.gal = new GALMananger(canvas);
    
    // 初始化默认格点
    this.initGrid();
  }

  /**
   * 初始化默认格点
   */
  private initGrid(): void {
    this.grid = new Grid("background-grid", {
      spacing: 1,          // 格点间距为1个单位
      majorSpacing: 5,     // 每5个格点显示一个主格点
      majorLineWidth: 1,   // 主格点线宽
      minorLineWidth: 0.5, // 次格点线宽
      majorColor: [0, 0, 0, 0.5] as vec4,  // 主格点颜色
      minorColor: [0, 0, 0, 0.2] as vec4,  // 次格点颜色
      densityThreshold: 0.5 // 缩放阈值
    });
  }

  /**
   * 设置格点参数
   */
  setGridOptions(options: {
    spacing?: number;
    majorSpacing?: number;
    majorLineWidth?: number;
    minorLineWidth?: number;
    majorColor?: vec4;
    minorColor?: vec4;
    visible?: boolean;
    densityThreshold?: number;
  }): void {
    if (!this.grid) {
      this.initGrid();
    }
    
    if (this.grid) {
      // 更新格点参数
      if (options.spacing !== undefined) this.grid.spacing = options.spacing;
      if (options.majorSpacing !== undefined) this.grid.majorSpacing = options.majorSpacing;
      if (options.majorLineWidth !== undefined) this.grid.majorLineWidth = options.majorLineWidth;
      if (options.minorLineWidth !== undefined) this.grid.minorLineWidth = options.minorLineWidth;
      if (options.majorColor !== undefined) this.grid.majorColor = options.majorColor;
      if (options.minorColor !== undefined) this.grid.minorColor = options.minorColor;
      if (options.visible !== undefined) this.grid.visible = options.visible;
      if (options.densityThreshold !== undefined) this.grid.densityThreshold = options.densityThreshold;
    }
  }

  /**
   * 绘制背景格点
   */
  drawGrid(): void {
    if (this.grid && this.grid.visible) {
      this.grid.paint();
    }
  }

  /**
   * 获取格点对象
   */
  getGrid(): Grid | null {
    return this.grid;
  }

  /**
   * 设置坐标系统参数
   * @param unitSize 单位大小，如1mil
   * @param scale 缩放比例
   * @param panX X方向平移量
   * @param panY Y方向平移量
   */
  setCoordinateSystem(unitSize: number, scale: number, panX: number = 0, panY: number = 0): void {
    this.unitSize = unitSize;
    this.scale = scale;
    this.panX = panX;
    this.panY = panY;
    this.gal.setCoordinateSystem(unitSize, scale, panX, panY);
  }

  /**
   * 获取当前坐标系统参数
   */
  getCoordinateSystem(): { unitSize: number; scale: number; panX: number; panY: number; zoomFactor: number } {
    return {
      unitSize: this.unitSize,
      scale: this.scale,
      panX: this.panX,
      panY: this.panY,
      zoomFactor: this.zoomFactor
    };
  }

  /**
   * 设置缩放因子
   * @param factor 缩放因子，大于1表示放大，小于1表示缩小
   */
  setZoomFactor(factor: number): void {
    if (factor <= 1.0) {
      throw new Error("Zoom factor must be greater than 1.0");
    }
    this.zoomFactor = factor;
  }

  /**
   * 获取缩放因子
   */
  getZoomFactor(): number {
    return this.zoomFactor;
  }

  /**
   * 平移视图
   * @param deltaX X方向平移量
   * @param deltaY Y方向平移量
   */
  pan(deltaX: number, deltaY: number): void {
    this.panX += deltaX;
    this.panY += deltaY;
    this.gal.setCoordinateSystem(this.unitSize, this.scale, this.panX, this.panY);
  }

  /**
   * 缩放视图
   * @param isZoomIn 是否放大，true表示放大，false表示缩小
   * @param centerX 缩放中心X坐标（数据坐标系）
   * @param centerY 缩放中心Y坐标（数据坐标系）
   */
  zoom(isZoomIn: boolean, centerX: number, centerY: number): void {
    // 根据放大或缩小决定使用的缩放因子
    const factor = isZoomIn ? this.zoomFactor : 1 / this.zoomFactor;
    
    // 保存旧的缩放比例
    const oldScale = this.scale;
    
    // 计算新的缩放比例
    this.scale *= factor;
    
    // 限制缩放范围，防止过度缩放
    this.scale = Math.max(0.1, Math.min(10, this.scale));
    
    // 调整平移量，使缩放中心保持不变
    const scaleFactor = this.scale / oldScale;
    this.panX = centerX + (this.panX - centerX) / scaleFactor;
    this.panY = centerY + (this.panY - centerY) / scaleFactor;
    
    // 更新坐标系统
    this.gal.setCoordinateSystem(this.unitSize, this.scale, this.panX, this.panY);
    console.log(this.scale);
  }

  /**
   * 将屏幕坐标转换为数据坐标
   * @param screenX 屏幕X坐标
   * @param screenY 屏幕Y坐标
   * @returns 数据坐标
   */
  screenToData(screenX: number, screenY: number): Vector2d {
    const canvas = document.getElementById(this.id) as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    
    // 计算相对于canvas的坐标
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    // 计算相对于canvas中心的坐标
    const centerX = canvasX - canvas.width / 2;
    const centerY = -(canvasY - canvas.height / 2); // Y轴方向相反
    
    // 转换为数据坐标
    const effectiveScale = this.unitSize * this.scale;
    const dataX = centerX / effectiveScale + this.panX;
    const dataY = centerY / effectiveScale + this.panY;
    
    return { x: dataX, y: dataY };
  }

  /**
   * 将数据坐标转换为屏幕坐标
   * @param dataX 数据X坐标
   * @param dataY 数据Y坐标
   * @returns 屏幕坐标
   */
  dataToScreen(dataX: number, dataY: number): { x: number, y: number } {
    const canvas = document.getElementById(this.id) as HTMLCanvasElement;
    
    // 计算相对于数据原点的偏移
    const offsetX = dataX - this.panX;
    const offsetY = dataY - this.panY;
    
    // 转换为屏幕坐标
    const effectiveScale = this.unitSize * this.scale;
    const screenX = offsetX * effectiveScale + canvas.width / 2;
    const screenY = -offsetY * effectiveScale + canvas.height / 2; // Y轴方向相反
    
    return { x: screenX, y: screenY };
  }

  /**
   * 重置视图到初始状态
   */
  resetView(): void {
    this.panX = 0;
    this.panY = 0;
    this.scale = 1;
    this.gal.setCoordinateSystem(this.unitSize, this.scale, this.panX, this.panY);
  }

  /**
   * 绘制线段
   * @param start 起点
   * @param end 终点
   * @param lineWidth 线宽
   * @param color 颜色 rgba
   * @param id id
   */
  drawLine(
    start: Vector2d,
    end: Vector2d,
    lineWidth: number,
    color: vec4,
    id?: string
  ) {
    this.gal.addLine(start, end, lineWidth, color, id);
  }

  /**
   * 绘制圆
   * @param center 中心点
   * @param radius 半径
   * @param lineWidth 线宽
   * @param color 颜色
   * @param id id
   */
  drawCircle(
    center: Vector2d,
    radius: number,
    lineWidth: number,
    color: vec4,
    id?: string
  ) {
    this.gal.addCircle(center, radius, lineWidth, color, id);
  }

  drawPolygon(pts: Vector2d[], lineWidth: number, color: vec4, id?: string) {
    this.gal.addPolygon(pts, lineWidth, color, id);
  }
}
