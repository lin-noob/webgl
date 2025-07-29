import Component from "../class/base/component";
import Render from "./render";
import { vec4 } from "gl-matrix";

export default class Controller {
  public id: string;
  public oldGraphicData: Component[];
  public graphicData: Component[];
  public render: Render;

  constructor(id: string) {
    console.log(`Creating Controller with id: ${id}`);
    this.id = id;
    this.graphicData = [];
    this.oldGraphicData = [];
    
    try {
      this.render = new Render(id);
      console.log("Render created successfully");
    } catch (error) {
      console.error("Failed to create Render:", error);
      throw error;
    }
  }

  setGraphicData(data: Component[]) {
    console.log(`Setting graphic data: ${data.length} elements`);
    this.oldGraphicData = [...this.graphicData];
    this.graphicData = data;
  }

  drawElements() {
    console.log(`Drawing ${this.graphicData.length} elements`);
    
    try {
      // 确保在绘制前清空画布和缓冲区
      this.render.gal.clear();
      
      // 添加一个测试三角形，确保渲染系统工作正常
      if (this.graphicData.length === 0) {
        console.log("No elements to draw, adding a test triangle");
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
        console.log(`Painting element ${index}:`, element);
        element.paint();
      }
      
      // 刷新缓冲区
      console.log("Flushing buffers");
      this.render.gal.flush();
      
      // 执行渲染
      console.log("Rendering");
      this.render.gal.render();
      
      console.log("Draw elements completed");
    } catch (error) {
      console.error("Error during drawing:", error);
    }
  }
}
