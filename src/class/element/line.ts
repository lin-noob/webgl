import store from "../../store";
import Component from "../base/component";

export default class Line extends Component {
  public x0: number;
  public y0: number;
  public x1: number;
  public y1: number;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    
  }

  override paint(): void {
    const start = {
      x: this.x0,
      y: this.y0,
    };

    const end = {
      x: this.x1,
      y: this.y1,
    };

    store.controller.render.drawLine(
      start,
      end,
      this.lineWidth,
      this.color,
      this.id
    );
  }
}
