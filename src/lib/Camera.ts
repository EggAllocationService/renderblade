import { DoublesidedFBO, FBO } from "./FBO";
import Drawable from "./interface/Drawable";
import { Matrix4 } from "@math.gl/core";
import { PostEffect } from "./PostEffect";
import copyFs from './shaders/copy.frag?raw'
import taaFs from './shaders/taa.frag?raw'
import { TextureTarget } from "./Material";

export class Camera {
    private _gl: WebGL2RenderingContext;
    private _enablePostProcessing: boolean = false;
    private _postBuffer: DoublesidedFBO;
    private _renderbuffer: FBO;
    private _velocityTexture: WebGLTexture;
    
    private _viewMatrix: Matrix4 = Matrix4.IDENTITY;
    private _projectionMatrix: Matrix4 = Matrix4.IDENTITY;

    private _postVao: WebGLVertexArrayObject;
    private _postCopyProgram: PostEffect;
    private _lastColor: FBO;

    private _effectiveWidth: number;
    private _effectiveHeight: number;

    private _extraBuffers: Map<string, FBO> = new Map<string, FBO>();

    private _frameDrawnTris = 0;

    private renderScale: number = 1;

    private _cameraData = {
        fov: 60,
        aspect: 1,
        near: 0.1,
        far: 100
    }

    constructor(gl: WebGL2RenderingContext) {
        this._gl = gl;

        var ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
            throw new Error("Floating point textures not supported");
        }
        this._postBuffer = new DoublesidedFBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.LINEAR, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, false)
        this._renderbuffer = new FBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.LINEAR, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, true);

        this._postVao = gl.createVertexArray();
        gl.bindVertexArray(this._postVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this._postCopyProgram = new PostEffect(this._gl, copyFs);
    
        this._lastColor = new FBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.LINEAR, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, false);

        this._velocityTexture = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._velocityTexture);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RG16F, this._gl.canvas.width, this._gl.canvas.height, 0, this._gl.RG, this._gl.FLOAT, null);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderbuffer._framebuffer);
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT1, this._gl.TEXTURE_2D, this._velocityTexture, 0);
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);

        this._effectiveWidth = this._gl.canvas.width;
        this._effectiveHeight = this._gl.canvas.height;
    }

    public setPostProcessing(enable: boolean) {
        this._enablePostProcessing = enable
    }

    public setRenderScale(ssaa: number) {
        this.renderScale = ssaa;
        this.resize(this._gl.canvas.width, this._gl.canvas.height);
    }

    public clear() {
        this._renderbuffer.clear();
        this._gl.drawBuffers([this._gl.NONE, this._gl.COLOR_ATTACHMENT1]);
        this._gl.clearColor(0, 0, 0, 1);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0, this._gl.NONE])

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
        this._effectiveWidth = Math.floor(width * this.renderScale);
        this._effectiveHeight = Math.floor(height * this.renderScale);
        this._postBuffer.reallocate(this._effectiveWidth, this._effectiveHeight);
        this._renderbuffer.reallocate(this._effectiveWidth, this._effectiveHeight);
        this._lastColor.reallocate(this._effectiveWidth, this._effectiveHeight);

        this._cameraData.aspect = this._effectiveWidth / this._effectiveHeight;
        this.regenerateProjectionMatrix();

        for (let buffer of this._extraBuffers.values()) {
            buffer.reallocate(this._effectiveWidth, this._effectiveHeight);
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
        
        this._frameDrawnTris += drawable.draw(this._projectionMatrix, this._viewMatrix);
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
        program.setTexture("uVelocity", this._velocityTexture);
        program.setTexture("uColor", this._postBuffer.getRead());
        program.setTexture("uDepth", this._renderbuffer, TextureTarget.DEPTH);
        program.setUniform("uRenderScale", this._gl.FLOAT, this.renderScale);
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