// file: main.ts

import { GALMananger } from "./galMananger";

const canvas = document.getElementById("webgl") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas not found");
}
canvas.width = 800;
canvas.height = 600;

// 1. 创建渲染器实例
const renderer = new GALMananger(canvas);

// 2. 添加所有初始形状 (数据此时只在JS内存中)
renderer.addLine(
  "line-1",
  { x: -300, y: 0 },
  { x: 300, y: 0 },
  20,
  [1.0, 0.0, 0.0, 1.0]
);
renderer.addLine(
  "line-2",
  { x: -250, y: 50 },
  { x: 250, y: 50 },
  10,
  [0.0, 1.0, 0.0, 1.0]
);

renderer.addCircle("circle-1", { x: -200, y: 150 }, 50, [1.0, 0.0, 0.0, 1.0]);
renderer.addCircle("circle-2", { x: 200, y: -150 }, 30, [0.0, 0.0, 1.0, 1.0]);

renderer.addPolygon(
  "polygon-1",
  [
    { x: 10, y: -200 },
    { x: 0, y: -150 },
    { x: 60, y: -140 },
    { x: 70, y: -190 },
  ],
  [0.0, 1.0, 0.0, 1.0]
);

// 3. 【关键修复】调用 flush() 将所有累积的数据一次性上传到GPU
renderer.flush();

// 4. 定义动画更新逻辑
const updateLogic = () => {
  renderer.updateBatch("line", (positions) => {
    return positions.map((p) => {
      let newX = p[0] + 1;
      if (p[0] > canvas.width / 2 + 50) {
        newX = -canvas.width / 2 - 50;
      }
      return [newX, p[1]];
    });
  });
};

// 5. 开始渲染循环
renderer.render();
