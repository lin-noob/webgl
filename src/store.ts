import Controller from "./core/controller";
import BaseTool from "./class/tool/baseTool";

interface STORETYPE {
  controller: Controller;
  tool: BaseTool; // 当前活动的工具
}

const store: STORETYPE = {} as unknown as STORETYPE;

export default store;
