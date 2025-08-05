import Component from "../base/component";
import store from "../../store";
import { vec4 } from "gl-matrix";

/**
 * 格点类，用于绘制背景网格
 */
export default class Grid extends Component {
  // 格点间距
  public spacing: number;
  // 主格点间距（每隔多少个格点显示主格点）
  public majorSpacing: number;
  // 主格点线宽
  public majorLineWidth: number;
  // 次格点线宽
  public minorLineWidth: number;
  // 主格点颜色
  public majorColor: vec4;
  // 次格点颜色
  public minorColor: vec4;
  // 是否显示格点
  public visible: boolean;
  // 动态密度阈值（当缩放比例小于此值时，只显示主格点）
  public densityThreshold: number;

  constructor(
    id: string,
    options: {
      spacing?: number;
      majorSpacing?: number;
      majorLineWidth?: number;
      minorLineWidth?: number;
      majorColor?: vec4;
      minorColor?: vec4;
      visible?: boolean;
      densityThreshold?: number;
    } = {}
  ) {
    super(id, {});

    // 设置默认值和用户自定义值
    this.spacing = options.spacing || 1;
    this.majorSpacing = options.majorSpacing || 5;
    this.majorLineWidth = options.majorLineWidth || 2;
    this.minorLineWidth = options.minorLineWidth || 1;
    this.majorColor = options.majorColor || ([255, 255, 255, 1] as vec4);
    this.minorColor = options.minorColor || ([255, 255, 255, 1] as vec4);
    this.visible = options.visible !== undefined ? options.visible : true;
    this.densityThreshold = options.densityThreshold || 0.5;
  }

  /**
   * 绘制格点
   */
  override paint(): void {
    if (!this.visible) return;

    // 获取当前视图范围
    const render = store.controller!.render;
    const coords = render.getCoordinateSystem();
    const canvas = document.getElementById(
      store.controller!.id
    ) as HTMLCanvasElement;

    // 计算当前视图中的数据坐标范围
    const topLeft = render.screenToData(0, 0);
    const bottomRight = render.screenToData(canvas.width, canvas.height);

    // 根据缩放比例决定是否显示次格点
    const showMinorGrids = coords.scale <= this.densityThreshold;

    // 计算实际的格点间距（考虑单位大小）
    const effectiveSpacing = this.spacing * coords.unitSize;

    // 计算格点范围（向外扩展一点，确保覆盖整个视图）
    const startX = Math.floor(topLeft.x / effectiveSpacing) * effectiveSpacing;
    const endX = Math.ceil(bottomRight.x / effectiveSpacing) * effectiveSpacing;
    const startY =
      Math.floor(bottomRight.y / effectiveSpacing) * effectiveSpacing;
    const endY = Math.ceil(topLeft.y / effectiveSpacing) * effectiveSpacing;

    // 绘制垂直格点线
    for (let x = startX; x <= endX; x += effectiveSpacing) {
      // 绘制水平格点线clearColor
      for (let y = startY; y <= endY; y += effectiveSpacing) {
        // 检查是否是主格点
        const isMajor =
          Math.round(y / effectiveSpacing) % this.majorSpacing === 0 &&
          Math.round(x / effectiveSpacing) % this.majorSpacing === 0;

        // 如果是次格点且当前缩放比例小于阈值，则跳过
        // if (!isMajor && !showMinorGrids) continue;

        // 设置线宽和颜色
        const lineWidth = isMajor ? this.majorLineWidth : this.minorLineWidth;
        const color = isMajor ? this.majorColor : this.minorColor;

        // 绘制水平线
        render.drawCircle({ x, y }, lineWidth, 1, color, `grid-${x}-${y}`);
      }
    }
  }
}
