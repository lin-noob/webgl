import store from "../../store";
import Component from "../base/component";

export default class Line extends Component {
  public x0: number;
  public y0: number;
  public x1: number;
  public y1: number;

  constructor(wData: Line);
  constructor(id: string, baseData: any);
  constructor(v1: Line | string, v2?: any) {
    if (v1 instanceof Line || typeof v1 === "object") {
      super(v1);
      this.lineInit1(v1);
    } else {
      super(v1, v2);
      this.lineInit2(v2);
    }
  }

  lineInit1(wline) {
    this.x0 = wline.x0;
    this.y0 = wline.y0;
    this.x1 = wline.x1;
    this.y1 = wline.y1;
  }

  lineInit2(data) {
    this.x0 = data.x0;
    this.y0 = data.y0;
    this.x1 = data.x1;
    this.y1 = data.y1;
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
