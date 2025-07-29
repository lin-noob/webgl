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

    public setMatrix(matrix): void {
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
    }
    
    public clear(): void {
        // 使用浅灰色背景，便于区分是否渲染成功
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    public draw(commands: DrawCommand[]): void {
        
        // 检查WebGL错误
        let error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("WebGL error before draw:", error);
        }
        
        // 设置视口
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        
        // 确保VAO已绑定
        this.gl.bindVertexArray(this.vao);
        
        // 确保程序已使用
        this.gl.useProgram(this.program);
        
        // 检查VBO和IBO是否正确绑定
        this.vbo.bind();
        this.ibo.bind();
        
        // 检查是否有命令
        if (commands.length === 0) {
            console.warn("No draw commands provided");
            return;
        }
        
        // 先绘制实际命令
        for (const cmd of commands) {
            if (cmd.indexCount > 0) { // 只绘制有内容的批次
                this.gl.drawElements(cmd.mode, cmd.indexCount, this.gl.UNSIGNED_INT, cmd.indexOffset * 4);
                
                // 检查绘制后的错误
                error = this.gl.getError();
                if (error !== this.gl.NO_ERROR) {
                    console.error("WebGL error after draw:", error);
                }
            }
        }
        
        // 如果没有成功渲染，尝试绘制一个测试三角形
        if (commands.length === 0 || commands[0].indexCount === 0) {
            // 绘制一个简单的三角形，确保渲染系统工作正常
            const testVertices = new Float32Array([
                // x, y, r, g, b, a, mode, param1, param2, param3
                -0.5, -0.5, 1, 0, 0, 1, 0, 0, 0, 0,  // 左下
                 0.5, -0.5, 0, 1, 0, 1, 0, 0, 0, 0,  // 右下
                 0.0,  0.5, 0, 0, 1, 1, 0, 0, 0, 0   // 顶部
            ]);
            this.updateVBO(testVertices, 0);
            
            const testIndices = new Uint32Array([0, 1, 2]);
            this.updateIBO(testIndices, 0);
            
            // 绘制测试三角形
            this.gl.drawElements(this.gl.TRIANGLES, 3, this.gl.UNSIGNED_INT, 0);
            
            // 检查绘制后的错误
            error = this.gl.getError();
            if (error !== this.gl.NO_ERROR) {
                console.error("WebGL error after drawing test triangle:", error);
            }
        }
        
        this.gl.bindVertexArray(null);
    }
}