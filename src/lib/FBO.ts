export class FBO {
    private _gl: WebGL2RenderingContext;
    private _framebuffer: WebGLFramebuffer | null = null;
    private _hasDepth: boolean;
    private _texture: WebGLTexture | null = null;
    private _depthBuffer: WebGLTexture | null = null;
    private _width: number;
    private _height: number;
    private _clearColor = [0, 0, 0, 1];

    constructor(gl: WebGL2RenderingContext, width: number, height: number, 
        sampling: number = gl.LINEAR, wrapping: number = gl.CLAMP_TO_EDGE, 
        format: number = gl.RGBA, internalFormat: number = gl.RGBA, 
        type: number = gl.UNSIGNED_BYTE, hasDepth: boolean = false) {

        this._gl = gl;
        this._width = width;
        this._height = height;
        this._hasDepth = hasDepth;

        this._framebuffer = this._gl.createFramebuffer();
        this._texture = this._gl.createTexture();
        if (hasDepth) {
            this._depthBuffer = this._gl.createTexture();
        }
        

        if (this._framebuffer === null || this._texture === null || (this._depthBuffer === null && hasDepth)) {
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
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._depthBuffer);    
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.DEPTH_COMPONENT24, this._width, this._height, 0, this._gl.DEPTH_COMPONENT, this._gl.UNSIGNED_INT, null);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.TEXTURE_2D, this._depthBuffer, 0);
        }
        // check framebuffer status
        if (this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER) !== this._gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Framebuffer is not complete');
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);

        
    }

    public clear() {
        this.bindAsTarget();
        this._gl.clearColor(this._clearColor[0], this._clearColor[1], this._clearColor[2], this._clearColor[3]);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    public setClearColor(r: number, g: number, b: number, a: number) {
        this._clearColor = [r, g, b, a];
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
    public attachDepth(index: number): number {
        this._gl.activeTexture(this._gl.TEXTURE0 + index);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._depthBuffer);
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
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._depthBuffer);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.DEPTH_COMPONENT24, this._width, this._height, 0, this._gl.DEPTH_COMPONENT, this._gl.UNSIGNED_INT, null);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.TEXTURE_2D, this._depthBuffer, 0);
        }
       
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    public static fromImage(gl: WebGL2RenderingContext, i: HTMLImageElement) {
        if (!i.complete) {
            throw new Error('Image is not loaded');
        }

        var result = new FBO(gl, i.width, i.height, gl.LINEAR, gl.REPEAT);

        gl.bindTexture(gl.TEXTURE_2D, result._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return result;
    }
}

export class DoublesidedFBO {
    private read: FBO;
    private write: FBO;
    constructor(gl: WebGL2RenderingContext, width: number, height: number,
        sampling: number = gl.LINEAR, wrapping: number = gl.CLAMP_TO_EDGE, 
        format: number = gl.RGBA, internalFormat: number = gl.RGBA, 
        type: number = gl.UNSIGNED_BYTE, hasDepth: boolean = true) {

        this.read = new FBO(gl, width, height, sampling, wrapping, format, internalFormat, type, hasDepth);
        this.write = new FBO(gl, width, height, sampling, wrapping, format, internalFormat, type, hasDepth);
    }

    public bindReadToTexture(index: number): number {
        return this.read.attach(index);
    }

    public bindReadDepthToTexture(index: number): number {
        return this.read.attachDepth(index);
    }

    public bindWriteAsTarget() {
        this.write.bindAsTarget();
    }

    public unbind() {
        this.write.unbind();
    }

    public reallocate(width: number, height: number) {
        this.read.reallocate(width, height);
        this.write.reallocate(width, height);
    }

    public swap() {
        let temp = this.read;
        this.read = this.write;
        this.write = temp;
    }

    public getRead(): FBO {
        return this.read;
    }

    public getWrite(): FBO {
        return this.write;
    }
}