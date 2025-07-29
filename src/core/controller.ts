import Component from "../class/base/component";
import BaseTool from "../class/tool/baseTool";
import Render from "./render";
import store from "../store";
import { vec4 } from "gl-matrix";
import SelectTool from "../class/tool/selectTool";

export default class Controller {
  public id: string;
  public oldGraphicData: Component[];
  public graphicData: Component[];
  public render: Render;

  constructor(id: string) {
    this.id = id;
    this.graphicData = [];
    this.oldGraphicData = [];

    try {
      this.render = new Render(id);

      // 初始化事件监听器
      this.initEventListeners();
      this.initTool();
    } catch (error) {
      console.error("Failed to create Render:", error);
      throw error;
    }
  }

  private initTool() {
    store.tool = new SelectTool();
  }

  /**
   * 初始化事件监听器
   */
  private initEventListeners(): void {
    const canvas = document.getElementById(this.id) as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    // 鼠标按下事件
    canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));

    // 鼠标移动事件
    canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));

    // 鼠标松开事件
    canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // 鼠标滚轮事件
    canvas.addEventListener("wheel", this.handleWheel.bind(this));

    // 键盘事件
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(event: MouseEvent): void {
    // 转换为数据坐标
    const dataPos = this.render.screenToData(event.clientX, event.clientY);

    // 如果有活动工具，调用其鼠标按下方法
    if (store.tool) {
      store.tool.onMouseDown(event, dataPos);
    }
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    // 转换为数据坐标
    const dataPos = this.render.screenToData(event.clientX, event.clientY);

    // 如果有活动工具，调用其鼠标移动方法
    if (store.tool) {
      store.tool.onMouseMove(event, dataPos);
    }
  }

  /**
   * 处理鼠标松开事件
   */
  private handleMouseUp(event: MouseEvent): void {
    // 转换为数据坐标
    const dataPos = this.render.screenToData(event.clientX, event.clientY);

    // 如果有活动工具，调用其鼠标松开方法
    if (store.tool) {
      store.tool.onMouseUp(event, dataPos);
    }
  }

  /**
   * 处理鼠标滚轮事件
   */
  private handleWheel(event: WheelEvent): void {
    // 转换为数据坐标
    const dataPos = this.render.screenToData(event.clientX, event.clientY);

    // 如果有活动工具，调用其滚轮方法
    if (store.tool) {
      store.tool.onWheel(event, dataPos);
    }
  }

  /**
   * 处理键盘按下事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // 如果有活动工具，调用其键盘按下方法
    if (store.tool) {
      store.tool.onKeyDown(event);
    }
  }

  /**
   * 处理键盘松开事件
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // 如果有活动工具，调用其键盘松开方法
    if (store.tool) {
      store.tool.onKeyUp(event);
    }
  }

  /**
   * 设置当前活动工具
   * @param tool 工具实例
   */
  public setActiveTool(tool: BaseTool): void {
    // 如果已有活动工具，先停用它
    if (store.tool) {
      store.tool.deactivate();
    }

    // 设置新的活动工具
    store.tool = tool;

    // 如果有新工具，激活它
    if (tool) {
      tool.activate();
    }
  }

  setGraphicData(data: Component[]) {
    this.oldGraphicData = [...this.graphicData];
    this.graphicData = data;
  }

  drawElements() {

    try {
      // 确保在绘制前清空画布和缓冲区
      this.render.gal.clear();

      // 添加一个测试三角形，确保渲染系统工作正常
      if (this.graphicData.length === 0) {
        // 添加一个简单的红色三角形
        const A = { x: 100, y: 100 };
        const B = { x: 700, y: 100 };
        const C = { x: 400, y: 700 };
        // 使用vec4类型
        const color = [255, 0, 0, 1] as vec4;
        this.render.gal.addPolygon([A, B, C], 1, color, "test-triangle");
      }

      // 绘制每个元素
      for (let index = 0; index < this.graphicData.length; index++) {
        const element = this.graphicData[index];
        element.paint();
      }

      // 刷新缓冲区
      this.render.gal.flush();

      // 执行渲染
      this.render.gal.render();

    } catch (error) {
      console.error("Error during drawing:", error);
    }
  }
}
