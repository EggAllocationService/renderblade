import { DoublesidedFBO, FBO } from "./FBO";
import Drawable from "./interface/Drawable";
import { Matrix4 } from "@math.gl/core";
import { PostEffect } from "./PostEffect";
import copyFs from './shaders/copy.frag?raw'

export class Camera {
    private _gl: WebGL2RenderingContext;
    private _enablePostProcessing: boolean = false;
    private _postBuffer: DoublesidedFBO;
    
    private _viewMatrix: Matrix4 = Matrix4.IDENTITY;
    private _projectionMatrix: Matrix4 = Matrix4.IDENTITY;

    private _postVao: WebGLVertexArrayObject;
    private _postCopyProgram: PostEffect;

    constructor(gl: WebGL2RenderingContext) {
        this._gl = gl
        this._postBuffer = new DoublesidedFBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.NEAREST, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, true)

        this._postVao = gl.createVertexArray();
        gl.bindVertexArray(this._postVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this._postCopyProgram = new PostEffect(this._gl, copyFs);
    }

    public setPostProcessing(enable: boolean) {
        this._enablePostProcessing = enable
    }

    public clear() {
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT)
        this._postBuffer.bindWriteAsTarget();
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT)
        this._postBuffer.unbind();
    }

    public draw(drawable: Drawable) {
        // This is the only line that is different from the Drawable interface
        if (this._enablePostProcessing) {
            this._postBuffer!.bindWriteAsTarget();
        }
        drawable.draw(this._gl, this._projectionMatrix, this._viewMatrix)
    }

    public setPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
        this._projectionMatrix = Matrix4.IDENTITY.clone().perspective({fovy: fov, aspect, near, far})
        this._viewMatrix = Matrix4.IDENTITY.clone().lookAt({eye: [0, 0, 5], center: [0, 0, 0], up: [0, 1, 0]})
    }
    public postStart() {
        this._postBuffer.swap();
    }
    public postPass(program: PostEffect) {
        program.use();
        this._gl.bindVertexArray(this._postVao);
        this._postBuffer.bindWriteAsTarget();
        this._postBuffer.bindReadToTexture(0);
        program.setUniform('uColor', this._gl.INT, 0);
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);
        this._postBuffer.unbind();
        this._postBuffer.swap();
    }

    public postFinished() {
        this._postBuffer!.unbind();
        this._postCopyProgram.use();
        this._gl.bindVertexArray(this._postVao);
        this._postBuffer.bindReadToTexture(0);
        this._postCopyProgram.setUniform('uColor', this._gl.INT, 0);
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);
    }
}