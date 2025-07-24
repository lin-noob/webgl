import Controller from "../../core/controller";
import store from "../../store";
import Line from "../element/line";

// 等待DOM完全加载后再初始化
document.addEventListener("DOMContentLoaded", () => {
  // 只在store.controller不存在时初始化
  if (!store.controller) {
    store.controller = new Controller('webgl');
  }
  
  const dom = document.getElementById("btn");
  console.log("Button element:", dom);
  
  dom?.addEventListener("click", () => {
    console.log("Button clicked");
    const id = "1";
    const line = new Line(id, { x0: 10, y0: 10, x1: 20, y1: 20 });
    store.controller.setGraphicData([line]);
    store.controller.drawElements();
    console.log("Drawing completed");
  });
});
