export class FBO {
    private _gl: WebGL2RenderingContext;
    private _framebuffer: WebGLFramebuffer | null = null;
    private _hasDepth: boolean = true;
    private _texture: WebGLTexture | null = null;
    private _depthBuffer: WebGLRenderbuffer | null = null;
    private _width: number;
    private _height: number;

    constructor(gl: WebGL2RenderingContext, width: number, height: number, 
        sampling: number = gl.LINEAR, wrapping: number = gl.CLAMP_TO_EDGE, 
        format: number = gl.RGBA, internalFormat: number = gl.RGBA, 
        type: number = gl.UNSIGNED_BYTE, hasDepth: boolean = true) {

        this._gl = gl;
        this._width = width;
        this._height = height;

        this._framebuffer = this._gl.createFramebuffer();
        this._texture = this._gl.createTexture();
        

        if (this._framebuffer === null || this._texture === null || this._depthBuffer === null) {
            throw new Error('Failed to create framebuffer, texture, or depth buffer')
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);

        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, this._width, this._height, 0, internalFormat, type, null);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, sampling);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, sampling);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, wrapping);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, wrapping);
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._texture, 0);

        if (hasDepth) {
            this._depthBuffer = this._gl.createRenderbuffer();
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._depthBuffer);    
            this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, this._width, this._height);
            this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this._depthBuffer);
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    public bindAsTarget() {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);
        this._gl.viewport(0, 0, this._width, this._height);
    }

    public unbind() {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
    }

    public attach(index: number): number {
        this._gl.activeTexture(this._gl.TEXTURE0 + index);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        return index;
    }

    public reallocate(width: number, height: number) {
        this._width = width;
        this._height = height;

        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._width, this._height, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, null);

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._texture, 0);

        if (this._hasDepth) {
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._depthBuffer);
            this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, this._width, this._height);
            this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this._depthBuffer);
        }
       
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }
}