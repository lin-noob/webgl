export class Buffer {
  private gl: WebGL2RenderingContext;
  private buffer: WebGLBuffer;
  private target: GLenum;
  private usage: GLenum;

  constructor(gl: WebGL2RenderingContext, target: GLenum, usage: GLenum) {
      this.gl = gl;
      this.target = target;
      this.usage = usage;
      const buffer = gl.createBuffer();
      if (!buffer) { throw new Error("Failed to create WebGL buffer"); }
      this.buffer = buffer;
  }

  bind(): void {
      this.gl.bindBuffer(this.target, this.buffer);
  }

  unbind(): void {
      this.gl.bindBuffer(this.target, null);
  }

  // 【关键修复】支持传入数据或只传入大小
  upload(dataOrSize: BufferSource | number): void {
      this.bind();
      this.gl.bufferData(this.target, dataOrSize, this.usage);
  }

  update(data: BufferSource, offset: number = 0): void {
      this.bind();
      this.gl.bufferSubData(this.target, offset, data);
  }
}