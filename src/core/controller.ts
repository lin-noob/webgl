import Component from "../class/base/component";
import Render from "./render";

export default class Controller {
  public id: string;
  public oldGraphicData: Component[];
  public graphicData: Component[];
  public render: Render;

  constructor(id: string) {
    this.id = id;
    this.render = new Render(id);
    this.graphicData = [];
  }

  setGraphicData(data: Component[]) {
    this.graphicData = data;
  }

  drawElements() {
    for (let index = 0; index < this.graphicData.length; index++) {
      const element = this.graphicData[index];
      element.paint();
    }
    this.render.gal.flush();
    this.render.gal.render();
  }
}
