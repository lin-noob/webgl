import { vec4, glMatrix } from "gl-matrix";
import { GraphicType } from "../../utils/get";

export default abstract class Component {
  public id: string;
  public lineWidth: number;
  public color: vec4;
  public type: GraphicType;
  public angle: number; // deg
  public mirrorX: boolean;
  public mirrorY: boolean;

  constructor(wData: Component);
  constructor(id: string, baseData: any);
  constructor(v1: Component | string, v2?: any) {
    if (v1 instanceof Component || typeof v1 === "object") {
      this.componentInit1(v1);
    } else {
      this.componentInit2(v2);
    }
  }

  componentInit1(wData) {
    this.id = wData.id;
    this.lineWidth = wData.lineWidth;
    this.color = wData.color;
    this.type = wData.type;
    this.angle = wData.angle;
    this.mirrorX = wData.mirrorX;
    this.mirrorY = wData.mirrorY;
  }

  componentInit2(data) {
    this.lineWidth = data.lineWidth ?? 10;
    this.color = data.color ?? [255, 0, 0, 1];
    if (data.type) {
      this.type = data.type;
    }
    this.angle = data.angle ?? 0;
    this.mirrorX = data.mirrorX ?? false;
    this.mirrorY = data.mirrorY ?? false;
  }

  abstract paint(): void;
}
