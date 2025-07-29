import { vec2, vec4 } from "gl-matrix";
import { GALMananger } from "./galMananger";
import { Vector2d } from "../utils/utils";

export default class Render {
  public id: string;

  public gal: GALMananger;

  constructor(id: string) {
    this.id = id;
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error("Canvas not found");
    }
    this.gal = new GALMananger(canvas);
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
    console.log(`Render.drawLine: from (${start.x}, ${start.y}) to (${end.x}, ${end.y}), width: ${lineWidth}, color:`, color);
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
