// file: ./utils/gal.ts
import initShaders from '../utils/shader';
import { Buffer } from './buffer';

interface DrawCommand {
  mode: GLenum;
  indexCount: number;
  indexOffset: number;
}

export class GAL {
    public gl: WebGL2RenderingContext;
    public program: WebGLProgram;
    private vao: WebGLVertexArrayObject;
    private vbo: Buffer;
    private ibo: Buffer;
    private matrixLocation: WebGLUniformLocation;

    constructor(gl: WebGL2RenderingContext, vsSource: string, fsSource: string, initialVBOSize: number, initialIBOSize: number) {
        this.gl = gl;
        const program = initShaders(gl, vsSource, fsSource);
        if (!program) { throw new Error("Failed to initialize shaders."); }
        this.program = program;
        gl.useProgram(this.program);

        this.vbo = new Buffer(gl, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
        this.ibo = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.DYNAMIC_DRAW);
        
        // 【关键修复】初始化时只分配大小，不上传数据
        this.vbo.upload(initialVBOSize);
        this.ibo.upload(initialIBOSize);

        const vao = gl.createVertexArray();
        if (!vao) { throw new Error("Failed to create VAO"); }
        this.vao = vao;
        this.setupAttributes();

        const matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        if (!matrixLocation) { throw new Error("Failed to get u_matrix location"); }
        this.matrixLocation = matrixLocation;
    }

    private setupAttributes(): void {
        // ... setupAttributes 方法保持不变 ...
        this.gl.bindVertexArray(this.vao);
        this.vbo.bind();
        this.ibo.bind();

        const stride = 10 * Float32Array.BYTES_PER_ELEMENT;
        let offset = 0;

        const posLoc = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, stride, offset);
        this.gl.enableVertexAttribArray(posLoc);
        offset += 2 * Float32Array.BYTES_PER_ELEMENT;

        const colorLoc = this.gl.getAttribLocation(this.program, "a_color");
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, stride, offset);
        this.gl.enableVertexAttribArray(colorLoc);
        offset += 4 * Float32Array.BYTES_PER_ELEMENT;

        const paramLoc = this.gl.getAttribLocation(this.program, "a_shaderParams");
        this.gl.vertexAttribPointer(paramLoc, 4, this.gl.FLOAT, false, stride, offset);
        this.gl.enableVertexAttribArray(paramLoc);

        this.gl.bindVertexArray(null);
    }
    
    public resizeVBO(newSize: number) {
        this.vbo.upload(newSize);
    }
    
    public resizeIBO(newSize: number) {
        this.ibo.upload(newSize);
    }
    
    public updateVBO(data: Float32Array, offsetBytes: number) {
        this.vbo.update(data, offsetBytes);
    }

    public updateIBO(data: Uint32Array, offsetBytes: number) {
        this.ibo.update(data, offsetBytes);
    }

    public setMatrix(matrix: Float32Array): void {
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
    }
    
    public clear(): void {
        this.gl.clearColor(1, 1, 1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    public draw(commands: DrawCommand[]): void {
        this.gl.bindVertexArray(this.vao);
        for (const cmd of commands) {
            if (cmd.indexCount > 0) { // 只绘制有内容的批次
                this.gl.drawElements(cmd.mode, cmd.indexCount, this.gl.UNSIGNED_INT, cmd.indexOffset * 4);
            }
        }
        this.gl.bindVertexArray(null);
    }
}