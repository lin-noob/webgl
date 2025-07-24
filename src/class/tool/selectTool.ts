export default class SelectTool {
  public x: number;
  public y: number;
  public ids: string[];
  constructor(x: number, y: number, ids?: string[]) {
    this.x = x;
    this.y = y;
    if (ids) {
      this.ids = ids;
    }
  }
}
