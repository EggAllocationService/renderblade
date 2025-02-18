import { DoublesidedFBO, FBO } from "./FBO";
import Drawable from "./interface/Drawable";
import { Matrix4, Vector3 } from "@math.gl/core";
import { PostEffect } from "./PostEffect";
import copyFs from './shaders/copy.frag?raw'
import { TextureTarget } from "./Material";

export class Camera {
    private _gl: WebGL2RenderingContext;
    private _postBuffer: DoublesidedFBO;

    private _renderbuffer: WebGLFramebuffer;
    private _renderColor: WebGLRenderbuffer;
    private _renderDepth: WebGLTexture;
    private _velocityTexture: WebGLRenderbuffer;

    private _velocityBuffer: FBO;
    
    private _viewMatrix: Matrix4 = Matrix4.IDENTITY;
    private _projectionMatrix: Matrix4 = Matrix4.IDENTITY;

    private _postVao: WebGLVertexArrayObject;
    private _postCopyProgram: PostEffect;
    private _lastColor: FBO;

    private _effectiveWidth: number;
    private _effectiveHeight: number;

    private _extraBuffers: Map<string, FBO> = new Map<string, FBO>();

    private _frameDrawnTris = 0;

    private _multiSample: number = 0;

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
        
        this._renderbuffer = this._gl.createFramebuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderbuffer);

        this._renderColor = this._gl.createRenderbuffer();
        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._renderColor);
        this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, this._multiSample, this._gl.RGBA8, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.RENDERBUFFER, this._renderColor);

        this._renderDepth = this._gl.createRenderbuffer();
        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._renderDepth);
        this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, this._multiSample, this._gl.DEPTH_COMPONENT24, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this._renderDepth);


        this._velocityTexture = this._gl.createRenderbuffer();
        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._velocityTexture);
        this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, this._multiSample, this._gl.RG16F, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT1, this._gl.RENDERBUFFER, this._velocityTexture);

        this._velocityBuffer = new FBO(this._gl, this._gl.canvas.width, this._gl.canvas.height, this._gl.LINEAR, this._gl.CLAMP_TO_EDGE, this._gl.RG, this._gl.RG16F, this._gl.FLOAT, true, true);
        

        // if the framebuffer isn't complete, throw an error
        if (this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER) !== this._gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Framebuffer is not complete: ' + this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER));
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);

        this._effectiveWidth = this._gl.canvas.width;
        this._effectiveHeight = this._gl.canvas.height;
    }

    public setRenderScale(ssaa: number) {
        this.renderScale = ssaa;
        this.resize(this._gl.canvas.width, this._gl.canvas.height);
    }

    public clear() {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderbuffer);
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0, this._gl.NONE]);
        this._gl.clearColor(this._clearColor[0], this._clearColor[1], this._clearColor[2], this._clearColor[3]);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.drawBuffers([this._gl.NONE, this._gl.COLOR_ATTACHMENT1]);
        this._gl.clearColor(0, 0, 0, 1);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0, this._gl.NONE])

        this._postBuffer.getRead().clear();
        this._postBuffer.getWrite().clear();

        this._frameDrawnTris = 0;
    }

    private _clearColor: number[] = [0, 0, 0, 1];
    public clearColor(r: number, g: number, b: number, a: number) {
        this._clearColor = [r, g, b, a];
        this._postBuffer.getRead().setClearColor(r, g, b, a);
        this._postBuffer.getWrite().setClearColor(r, g, b, a);
    }

    public resize(width: number, height: number) {
        this._effectiveWidth = Math.floor(width * this.renderScale);
        this._effectiveHeight = Math.floor(height * this.renderScale);
        this._postBuffer.reallocate(this._effectiveWidth, this._effectiveHeight);
        this._lastColor.reallocate(this._effectiveWidth, this._effectiveHeight);

        this._cameraData.aspect = this._effectiveWidth / this._effectiveHeight;
        this.regenerateProjectionMatrix();

        for (let buffer of this._extraBuffers.values()) {
            buffer.reallocate(this._effectiveWidth, this._effectiveHeight);
        }

        // resize the multisample buffers
        this.setSampleCount(this._multiSample);
    }

    public setSampleCount(count: number) {
        this._multiSample = count;

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderbuffer);
        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._renderColor);
        this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, this._multiSample, this._gl.RGBA8, this._effectiveWidth, this._effectiveHeight);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.RENDERBUFFER, this._renderColor);

        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._renderDepth);
        this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, this._multiSample, this._gl.DEPTH_COMPONENT24, this._effectiveWidth, this._effectiveHeight);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this._renderDepth);

        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._velocityTexture);
        this._gl.renderbufferStorageMultisample(this._gl.RENDERBUFFER, this._multiSample, this._gl.RG16F, this._effectiveWidth, this._effectiveHeight);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT1, this._gl.RENDERBUFFER, this._velocityTexture);
    }

    public draw(drawable: Drawable, target: FBO | null = null) {
        // This is the only line that is different from the Drawable interface
        if (target == null) {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderbuffer);
        } else {
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

    public setLocationAndLookTarget(eye: Vector3, target: Vector3) {
        this._viewMatrix = Matrix4.IDENTITY.clone().lookAt({eye: eye.toArray(), center: target.toArray(), up: [0, 1, 0]})
    }

    public setPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
        this._cameraData.fov = fov;
        this._cameraData.aspect = aspect;
        this._cameraData.near = near;
        this._cameraData.far = far;

        this.regenerateProjectionMatrix();
        this._viewMatrix = Matrix4.IDENTITY.clone().lookAt({eye: [0, 0, 5], center: [0, 0, 0], up: [0, 1, 0]})
    }

    public createExtraBuffer(name: string, targets: TextureTarget = TextureTarget.COLOR | TextureTarget.DEPTH, size: "auto" | {width: number, height: number} = "auto"): FBO {
        const width = size === "auto" ? this._effectiveWidth : size.width;
        const height = size === "auto" ? this._effectiveHeight : size.height;
        let buffer = new FBO(this._gl, width, height, 
            this._gl.LINEAR, this._gl.CLAMP_TO_EDGE, this._gl.RGBA, this._gl.RGBA, 
            this._gl.UNSIGNED_BYTE, (targets & TextureTarget.DEPTH) > 0, (targets & TextureTarget.COLOR) > 0);
        if (size == "auto") {
            this._extraBuffers.set(name, buffer);
        }
        return buffer;
    }

    public postStart() {
        // copy rendered color to post buffer
        this._gl.colorMask(true, true, true, true);
        this._gl.depthMask(false);
        this._gl.bindVertexArray(this._postVao);
        
        this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, this._renderbuffer);
        this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, this._postBuffer.getWrite()._framebuffer);
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0, this._gl.NONE]);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT)
        this._gl.blitFramebuffer(0, 0, this._effectiveWidth, this._effectiveHeight, 0, 0, this._effectiveWidth, this._effectiveHeight, this._gl.COLOR_BUFFER_BIT, this._gl.NEAREST);

        this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, this._velocityBuffer._framebuffer);
        this._gl.readBuffer(this._gl.COLOR_ATTACHMENT1);
        this._gl.blitFramebuffer(0, 0, this._effectiveWidth, this._effectiveHeight, 0, 0, this._effectiveWidth, this._effectiveHeight, this._gl.COLOR_BUFFER_BIT, this._gl.NEAREST);
        this._gl.readBuffer(this._gl.COLOR_ATTACHMENT0);
        this._gl.blitFramebuffer(0, 0, this._effectiveWidth, this._effectiveHeight, 0, 0, this._effectiveWidth, this._effectiveHeight, this._gl.DEPTH_BUFFER_BIT, this._gl.NEAREST);
    

        this._postBuffer.swap();
    }

    public postPass(program: PostEffect, target: FBO | null = null, source: FBO = this._postBuffer.getRead()) {

        program.setTexture("uVelocity", this._velocityBuffer);
        program.setTexture("uColor", source);
        program.setTexture("uDepth", this._velocityBuffer, TextureTarget.DEPTH);
        program.setUniform("uRenderScale", this._gl.FLOAT, this.renderScale);
        program.use();
        this._gl.bindVertexArray(this._postVao);
        
        if (target == null) {
            this._postBuffer.bindWriteAsTarget();
            this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);
    
            this._postBuffer.unbind();
            this._postBuffer.swap();
        } else {
            target.bindAsTarget();
            this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 4);
            target.unbind();
        }
        
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