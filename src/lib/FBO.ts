export class FBO {
    private _gl: WebGL2RenderingContext;
    public readonly _framebuffer: WebGLFramebuffer;
    public hasDepth: boolean;
    public hasColor: boolean;
    private _texture: WebGLTexture | null = null;
    private _depthBuffer: WebGLTexture | null = null;
    private _width: number;
    private _height: number;
    private _clearColor = [0, 0, 0, 1];
    

    public get texture(): WebGLTexture {
        if (this._texture === null) {
            throw new Error('Framebuffer does not have a color buffer');
        }
        return this._texture;
    }

    constructor(gl: WebGL2RenderingContext, width: number, height: number, 
        sampling: number = gl.LINEAR, wrapping: number = gl.CLAMP_TO_EDGE, 
        format: number = gl.RGBA, internalFormat: number = gl.RGBA, 
        type: number = gl.UNSIGNED_BYTE, hasDepth: boolean = true, hasColor: boolean = true) {

        if (!hasColor && !hasDepth) {
            throw new Error('Framebuffer must have at least one buffer');
        }

        this._gl = gl;
        this._width = width;
        this._height = height;
        this.hasDepth = hasDepth;
        this.hasColor = hasColor;

        this._framebuffer = this._gl.createFramebuffer();
        if (hasColor) {
            this._texture = this._gl.createTexture();
        }
        if (hasDepth) {
            this._depthBuffer = this._gl.createTexture();
        }
        

        if (this._framebuffer === null || (this._texture === null && hasColor) || (this._depthBuffer === null && hasDepth)) {
            throw new Error('Failed to create framebuffer, texture, or depth buffer')
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);

        if (hasColor) {
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, this._width, this._height, 0, format, type, null);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, sampling);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, sampling);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, wrapping);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, wrapping);

            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._texture, 0);
        }

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
            throw new Error('Framebuffer is not complete: ' + this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER));
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
        if (!this.hasColor) {
            throw new Error('Framebuffer does not have a color buffer');
        }
        this._gl.activeTexture(this._gl.TEXTURE0 + index);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        return index;
    }
    public attachDepth(index: number): number {
        if (!this.hasDepth) {
            throw new Error('Framebuffer does not have a depth buffer');
        }
        this._gl.activeTexture(this._gl.TEXTURE0 + index);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._depthBuffer);
        return index;
    }

    public reallocate(width: number, height: number) {
        this._width = width;
        this._height = height;

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);

        if (this.hasColor) {
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._width, this._height, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, null);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._texture, 0);
        }

        if (this.hasDepth) {
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._depthBuffer);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.DEPTH_COMPONENT24, this._width, this._height, 0, this._gl.DEPTH_COMPONENT, this._gl.UNSIGNED_INT, null);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.TEXTURE_2D, this._depthBuffer, 0);
        }
       
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    public get width() {
        return this._width;
    }

    public get height() {
        return this._height;
    }

    public static fromImage(gl: WebGL2RenderingContext, i: HTMLImageElement) {
        if (!i.complete) {
            throw new Error('Image is not loaded');
        }

        var result = new FBO(gl, i.width, i.height, gl.LINEAR, gl.REPEAT, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, false, true);

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