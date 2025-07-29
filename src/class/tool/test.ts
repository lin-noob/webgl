import Controller from "../../core/controller";
import store from "../../store";
import Line from "../element/line";

console.log("test.ts loaded, store:", store);

// 只在store.controller不存在时初始化
if (!store.controller) {
  console.log("Initializing controller");
  store.controller = new Controller("webgl");
}

// 等待DOM完全加载后再初始化
document.addEventListener("DOMContentLoaded", () => {
  const dom = document.getElementById("btn");
  console.log("Button element:", dom);

  dom?.addEventListener("click", () => {
    console.log("Button clicked");
    
    // 创建线条 - 使用画布坐标系中的位置
    const id = "line-" + Date.now();
    const line = new Line(id, { 
      x0: 100, 
      y0: 100, 
      x1: 700, 
      y1: 700,
      lineWidth: 30,
      color: [255, 0, 0, 1] 
    });
    
    const id1 = "line1-" + Date.now();
    const line1 = new Line(id1, { 
      x0: 100, 
      y0: 100, 
      x1: 600, 
      y1: 600,
      lineWidth: 30,
      color: [255, 0, 0, 1] 
    });

    console.log("Created line:", line);
    
    // 设置图形数据
    store.controller.setGraphicData([line, line1]);
    store.controller.drawElements();
  });
});
