import Controller from "../../core/controller";
import store from "../../store";
import Line from "../element/line";
import SelectTool from "./selectTool";


// 只在store.controller不存在时初始化
if (!store.controller) {
  store.controller = new Controller("webgl");
  
  // 设置坐标系统参数
  // unitSize = 1 (1个单位 = 1mil)
  // scale = 0.1 (放大10倍，即1mil在画布上显示为10像素)
  store.controller.render.setCoordinateSystem(1, 0.1);
  
  // 创建并设置选择工具为活动工具
  const selectTool = new SelectTool();
  store.controller.setActiveTool(selectTool);
}

// 等待DOM完全加载后再初始化
document.addEventListener("DOMContentLoaded", () => {
  const dom = document.getElementById("btn");

  dom?.addEventListener("click", () => {
    
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
 
    // 创建一个Line数组来存储额外的线条
    const list: Line[] = [];

    // 添加一个网格
    for (let x = -900; x <= 900; x += 300) {
      const gridLineId = "grid-v-" + x;
      const gridLine = new Line(gridLineId, {
        x0: x,
        y0: -900,
        x1: x,
        y1: 900,
        lineWidth: 5,
        color: [200, 200, 200, 0.5],
      });
      list.push(gridLine);
    }

    for (let y = -900; y <= 900; y += 300) {
      const gridLineId = "grid-h-" + y;
      const gridLine = new Line(gridLineId, {
        x0: -900,
        y0: y,
        x1: 900,
        y1: y,
        lineWidth: 5,
        color: [200, 200, 200, 0.5],
      });
      list.push(gridLine);
    }

    // 添加坐标轴
    const xAxisId = "x-axis";
    const xAxis = new Line(xAxisId, {
      x0: -1000,
      y0: 0,
      x1: 1000,
      y1: 0,
      lineWidth: 10,
      color: [0, 0, 0, 1],
    });
    list.push(xAxis);

    const yAxisId = "y-axis";
    const yAxis = new Line(yAxisId, {
      x0: 0,
      y0: -1000,
      x1: 0,
      y1: 1000,
      lineWidth: 10,
      color: [0, 0, 0, 1],
    });
    list.push(yAxis);

    // 设置图形数据
    store.controller!.setGraphicData([line, line1, ...list]);
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
    document.body.appendChild(instructions);
  });
});
