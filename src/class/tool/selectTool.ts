import Render from "../../core/render";
import store from "../../store";
import { Vector2d } from "../../utils/utils";
import Component from "../base/component";
import BaseTool from "./baseTool";

export default class SelectTool extends BaseTool {
  private selectData: Component[] = [];

  constructor(x?: number, y?: number, selectData?: Component[]) {
    super(x, y);
    if (selectData) {
      this.selectData = selectData;
    }
  }

  /**
   * 工具激活时调用
   */
  public override activate(): void {
    super.activate();
  }

  /**
   * 处理鼠标按下事件
   */
  public override onMouseDown(event: MouseEvent, dataPos: Vector2d): void {
    super.onMouseDown(event, dataPos);
    event.preventDefault();
  }

  /**
   * 处理鼠标移动事件
   */
  public override onMouseMove(event: MouseEvent, dataPos: Vector2d): void {
    super.onMouseMove(event, dataPos);
  }

  /**
   * 处理鼠标滚轮事件
   */
  public override onWheel(event: WheelEvent, dataPos: Vector2d): void {
    super.onWheel(event, dataPos);
    
    // 阻止默认滚动行为
    event.preventDefault();
  }

  /**
   * 处理键盘按下事件
   */
  public override onKeyDown(event: KeyboardEvent): void {
    // 按R键重置视图
    if (event.key === "r" || event.key === "R") {
      store.controller!.render.resetView();
      store.controller!.drawElements();
    }
  }
}
