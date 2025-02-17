import { DoublesidedFBO, FBO } from "./FBO";
import Drawable from "./interface/Drawable";
import { Matrix4 } from "@math.gl/core";
import { PostEffect } from "./PostEffect";
import copyFs from './shaders/copy.frag?raw'
import { TextureTarget } from "./Material";

export class Camera {
    private _gl: WebGL2RenderingContext;
    private _enablePostProcessing: boolean = false;
    private _postBuffer: DoublesidedFBO;
    private _renderbuffer: FBO;
    
    private _viewMatrix: Matrix4 = Matrix4.IDENTITY;
    private _projectionMatrix: Matrix4 = Matrix4.IDENTITY;

    private _postVao: WebGLVertexArrayObject;
    private _postCopyProgram: PostEffect;

    private _extraBuffers: Map<string, FBO> = new Map<string, FBO>();

    private _frameDrawnTris = 0;

    private _cameraData = {
        fov: 60,
        aspect: 1,
        near: 0.1,
        far: 100
    }

    constructor(gl: WebGL2RenderingContext) {
        this._gl = gl
        this._postBuffer = new DoublesidedFBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.NEAREST, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, false)
        this._renderbuffer = new FBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.NEAREST, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, true);

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
        this._renderbuffer.clear();
        this._postBuffer.getRead().clear();
        this._postBuffer.getWrite().clear();

        this._renderbuffer.unbind();

        this._frameDrawnTris = 0;
    }

    public clearColor(r: number, g: number, b: number, a: number) {
        this._renderbuffer.setClearColor(r, g, b, a);
        this._postBuffer.getRead().setClearColor(r, g, b, a);
        this._postBuffer.getWrite().setClearColor(r, g, b, a);
    }

    public resize(width: number, height: number) {
        this._postBuffer.reallocate(width, height);
        this._renderbuffer.reallocate(width, height);

        this._cameraData.aspect = width / height;
        this.regenerateProjectionMatrix();

        for (let buffer of this._extraBuffers.values()) {
            buffer.reallocate(width, height);
        }
    }

    public draw(drawable: Drawable, target: FBO = this._renderbuffer) {
        // This is the only line that is different from the Drawable interface
        if (this._enablePostProcessing) {
            target.bindAsTarget();
            if (!target.hasColor) {
                this._gl.colorMask(false, false, false, false);
            } else {
                this._gl.colorMask(true, true, true, true);
            }
            this._gl.depthMask(target.hasDepth)
        } 
        
        this._frameDrawnTris += drawable.draw(this._gl, this._projectionMatrix, this._viewMatrix);
    }

    private regenerateProjectionMatrix() {
        this._projectionMatrix = Matrix4.IDENTITY.clone().perspective({fovy: this._cameraData.fov, aspect: this._cameraData.aspect, near: this._cameraData.near, far: this._cameraData.far})
    }

    public setPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
        this._cameraData.fov = fov;
        this._cameraData.aspect = aspect;
        this._cameraData.near = near;
        this._cameraData.far = far;

        this.regenerateProjectionMatrix();
        this._viewMatrix = Matrix4.IDENTITY.clone().lookAt({eye: [0, 0, 5], center: [0, 0, 0], up: [0, 1, 0]})
    }

    public createExtraBuffer(name: string, targets: TextureTarget = TextureTarget.COLOR | TextureTarget.DEPTH): FBO {
        let buffer = new FBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, 
            this._gl.LINEAR, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, 
            this._gl.UNSIGNED_BYTE, (targets & TextureTarget.DEPTH) > 0, (targets & TextureTarget.COLOR) > 0);
        this._extraBuffers.set(name, buffer);
        return buffer;
    }

    public postStart() {
        // copy rendered color to post buffer
        this._gl.colorMask(true, true, true, true);
        this._gl.depthMask(false);
        this._gl.bindVertexArray(this._postVao);
        this._postBuffer.bindWriteAsTarget();
        this._gl.clear(this._gl.COLOR_BUFFER_BIT)
        this._postCopyProgram.use();
        this._renderbuffer.attach(0);
        this._postCopyProgram.setUniform('uColor', this._gl.INT, 0);
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);
        this._postBuffer.unbind();
        this._postBuffer.swap();
    }

    public postPass(program: PostEffect) {

        program.setTexture("uColor", this._postBuffer.getRead());
        program.setTexture("uDepth", this._renderbuffer, TextureTarget.DEPTH);
        program.use();
        this._gl.bindVertexArray(this._postVao);
        this._postBuffer.bindWriteAsTarget();
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);

        this._postBuffer.unbind();
        this._postBuffer.swap();
    }

    public postFinished() {
        this._gl.depthMask(true);
        this._postBuffer!.unbind();
        this._postCopyProgram.use();
        this._gl.bindVertexArray(this._postVao);
        this._postBuffer.bindReadToTexture(0);
        this._postCopyProgram.setUniform('uColor', this._gl.INT, 0);
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);
    }

    public getDrawnTris() {
        return this._frameDrawnTris;
    }
}