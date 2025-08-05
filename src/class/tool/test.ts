import Controller from "../../core/controller";
import store from "../../store";
import Line from "../element/line";
import SelectTool from "./selectTool";

console.log("test.ts loaded, store:", store);

// 只在store.controller不存在时初始化
if (!store.controller) {
  console.log("Initializing controller");
  store.controller = new Controller("webgl");
  
  // 设置坐标系统参数
  // unitSize = 1 (1个单位 = 1mil)
  // scale = 0.1 (放大10倍，即1mil在画布上显示为10像素)
  store.controller.render.setCoordinateSystem(1, 0.1);
  
  // 配置格点
  store.controller.render.setGridOptions({
    spacing: 10,         // 格点间距为10个单位
    majorSpacing: 10,    // 每10个格点显示一个主格点
    majorLineWidth: 1,   // 主格点线宽
    minorLineWidth: 0.5, // 次格点线宽
    majorColor: [255, 255, 255, 4] as any,  // 主格点颜色
    minorColor: [255, 255, 255, 1] as any,  // 次格点颜色
    visible: true,       // 显示格点
    densityThreshold: 0.5 // 缩放阈值，当scale < 0.05时只显示主格点
  });
  
  // 创建并设置选择工具为活动工具
  const selectTool = new SelectTool();
  store.controller.setActiveTool(selectTool);
}

// 等待DOM完全加载后再初始化
document.addEventListener("DOMContentLoaded", () => {
  const dom = document.getElementById("btn");
  console.log("Button element:", dom);

  dom?.addEventListener("click", () => {
    console.log("Button clicked");
    
    // 创建线条 - 使用数据坐标系中的位置
    const id = "line-" + Date.now();
    const line = new Line(id, { 
      x0: -500,
      y0: -500,
      x1: 500,
      y1: 500,
      lineWidth: 30,
      color: [255, 0, 0, 1],
    });
    
    const id1 = "line1-" + Date.now();
    const line1 = new Line(id1, { 
      x0: -500,
      y0: 0,
      x1: 500,
      y1: 0,
      lineWidth: 30,
      color: [0, 0, 255, 1], // 蓝色
    });
    
    // 设置图形数据
    store.controller!.setGraphicData([line, line1]);
    store.controller!.drawElements();
    
    // 添加使用说明
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '10px';
    instructions.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    instructions.style.padding = '10px';
    instructions.style.borderRadius = '5px';
    instructions.style.fontSize = '14px';
    instructions.innerHTML = `
      <h3>操作说明:</h3>
      <ul>
        <li>平移: 中键拖拽或Alt+左键拖拽</li>
        <li>缩放: 鼠标滚轮</li>
        <li>重置视图: 按R键</li>
      </ul>
    `;
    // document.body.appendChild(instructions);
  });
});
