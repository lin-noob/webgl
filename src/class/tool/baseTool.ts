import store from "../../store";
import { Vector2d } from "../../utils/utils";

/**
 * 所有工具类的基类
 */
export default abstract class BaseTool {
  // 鼠标状态
  protected isMouseDown: boolean = false;
  protected mousePos: Vector2d = { x: 0, y: 0 };
  protected clientPos: Vector2d = { x: 0, y: 0 };
  // 用于平移操作
  protected isDragging: boolean = false;

  constructor(x?: number, y?: number) {
    this.mousePos.x = x ?? 0;
    this.mousePos.y = y ?? 0;
    this.clientPos.x = x ?? 0;
    this.clientPos.y = y ?? 0;
  }

  /**
   * 鼠标按下事件
   */
  public onMouseDown(event: MouseEvent, dataPos: Vector2d): void {
    this.isMouseDown = true;
    this.mousePos.x = event.clientX;
    this.mousePos.y = event.clientY;
    this.clientPos = { ...dataPos };

    // 中键按下或Alt+左键开始拖拽
    if (event.button === 2) {
      this.isDragging = true;

      // 阻止默认行为
    }
    event.preventDefault();
  }

  /**
   * 鼠标移动事件
   */
  public onMouseMove(event: MouseEvent, dataPos: Vector2d): void {
    if (this.isDragging) {
      // 计算鼠标移动距离
      const deltaX = event.clientX - this.mousePos.x;
      const deltaY = event.clientY - this.mousePos.y;

      // 将屏幕坐标的变化转换为数据坐标的变化
      const render = store.controller!.render;
      const coords = render.getCoordinateSystem();
      const effectiveScale = coords.unitSize * coords.scale;

      // 平移视图，注意Y轴方向相反
      render.pan(-deltaX / effectiveScale, deltaY / effectiveScale);

      // 重新渲染
      store.controller!.drawElements();
    }
    this.mousePos.x = event.clientX;
    this.mousePos.y = event.clientY;
    this.clientPos = { ...dataPos };
  }

  /**
   * 鼠标松开事件
   */
  public onMouseUp(event: MouseEvent, dataPos: Vector2d): void {
    this.isMouseDown = false;
    this.isDragging = false;
    this.mousePos.x = event.clientX;
    this.mousePos.y = event.clientY;
    this.clientPos = { ...dataPos };
  }

  /**
   * 鼠标滚轮事件
   */
  public onWheel(event: WheelEvent, dataPos: Vector2d): void {
    this.clientPos = { ...dataPos };

    // 阻止默认滚动行为
    event.preventDefault();

    const render = store.controller!.render;

    // 根据滚轮方向决定缩放方向
    const isZoomIn = event.deltaY < 0;

    // 执行缩放，以鼠标位置为中心
    render.zoom(isZoomIn, dataPos.x, dataPos.y);

    // 重新渲染
    store.controller!.drawElements();
  }

  /**
   * 键盘按下事件
   */
  public onKeyDown(event: KeyboardEvent): void {}

  /**
   * 键盘松开事件
   */
  public onKeyUp(event: KeyboardEvent): void {}

  /**
   * 工具激活时调用
   */
  public activate(): void {
    // 重置状态
    this.isMouseDown = false;
  }

  /**
   * 工具停用时调用
   */
  public deactivate(): void {
    // 重置状态
    this.isMouseDown = false;
    this.isDragging = false;
  }
}
