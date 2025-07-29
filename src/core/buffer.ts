export class Buffer {
  private gl: WebGL2RenderingContext;
  private buffer: WebGLBuffer;
  private target: GLenum;
  private usage: GLenum;

  constructor(gl: WebGL2RenderingContext, target: GLenum, usage: GLenum) {
      this.gl = gl;
      this.target = target;
      this.usage = usage;
      
      try {
        const buffer = gl.createBuffer();
        if (!buffer) { 
          throw new Error("Failed to create WebGL buffer"); 
        }
        this.buffer = buffer;
        console.log(`Buffer created: ${target === gl.ARRAY_BUFFER ? 'VBO' : 'IBO'}`);
      } catch (error) {
        console.error("Error creating buffer:", error);
        throw error;
      }
  }

  bind(): void {
      this.gl.bindBuffer(this.target, this.buffer);
      const error = this.gl.getError();
      if (error !== this.gl.NO_ERROR) {
        console.error("Error binding buffer:", error);
      }
  }

  unbind(): void {
      this.gl.bindBuffer(this.target, null);
  }

  // 支持传入数据或只传入大小
  upload(dataOrSize: BufferSource | number): void {
      console.log(`Uploading buffer data, size: ${typeof dataOrSize === 'number' ? dataOrSize : 'BufferSource'}`);
      this.bind();
      
      try {
        // 根据参数类型调用不同的重载
        if (typeof dataOrSize === 'number') {
          this.gl.bufferData(this.target, dataOrSize, this.usage);
        } else {
          this.gl.bufferData(this.target, dataOrSize, this.usage);
        }
        
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
          console.error("Error uploading buffer data:", error);
        }
      } catch (error) {
        console.error("Exception uploading buffer data:", error);
      }
  }

  update(data: BufferSource, offset: number = 0): void {
      console.log(`Updating buffer at offset ${offset}, data length: ${(data as any).length || 'unknown'}`);
      this.bind();
      
      try {
        this.gl.bufferSubData(this.target, offset, data);
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
          console.error("Error updating buffer data:", error);
        }
      } catch (error) {
        console.error("Exception updating buffer data:", error);
      }
  }
}