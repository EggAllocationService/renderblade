

export class Program {
    private _vsText: string;
    private _fsText: string;
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _uniforms = new Map<string, WebGLUniformLocation>();
    private _uniformValues = new Map<string, {type: number, data: any[]}>();

    constructor(gl: WebGL2RenderingContext, vsText: string, fsText: string) {
        this._gl = gl;
        this._vsText = vsText;
        this._fsText = fsText;

        this._program = this._gl.createProgram();
        if (this._program === null) {
            throw new Error('Failed to create program');
        }

        this._program = this._gl.createProgram();

        this.compileShader(this._gl.VERTEX_SHADER, this._vsText);
        this.compileShader(this._gl.FRAGMENT_SHADER, this._fsText);
        this._gl.linkProgram(this._program);

        if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS)) {
            let info: string = this._gl.getProgramInfoLog(this._program) || '';
            throw new Error(`Failed to link program: ${info}`);
        }

        // Cache uniform locations

        let numUniforms: number = this._gl.getProgramParameter(this._program, this._gl.ACTIVE_UNIFORMS);
        for (let i: number = 0; i < numUniforms; i++) {
            let info: WebGLActiveInfo | null = this._gl.getActiveUniform(this._program, i);
            if (info === null) {
                continue;
            }

            let location: WebGLUniformLocation | null = this._gl.getUniformLocation(this._program, info.name);
            if (location === null) {
                continue;
            }

            this._uniforms.set(info.name, location);
        }
    }

    private compileShader(type: number, source: string): WebGLShader {
        let shader: WebGLShader | null = this._gl.createShader(type);
        if (shader === null) {
            throw new Error('Failed to create shader');
        }

        this._gl.shaderSource(shader, source);
        this._gl.compileShader(shader);

        if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
            let info: string = this._gl.getShaderInfoLog(shader) || '';
            throw new Error(`Failed to compile shader: ${info}`);
        }

        this._gl.attachShader(this._program, shader);
        return shader;
    }

    public setUniform(name: string, type: number, ...data: any[]) {
        this._uniformValues.set(name, {type, data});
    }

    private setUniformInternal(name: string, type: number, data: any[]) {
        let location: WebGLUniformLocation | undefined = this._uniforms.get(name);
        if (location === undefined) {
            throw new Error(`Failed to find uniform ${name}`);
        }

        switch (type) {
            case this._gl.INT:
                this._gl.uniform1i(location, data[0]);
                break;
            case this._gl.FLOAT:
                this._gl.uniform1f(location, data[0]);
                break;
            case this._gl.FLOAT_VEC2:
                this._gl.uniform2f(location, data[0], data[1]);
                break;
            case this._gl.FLOAT_VEC3:
                this._gl.uniform3f(location, data[0], data[1], data[2]);
                break;
            case this._gl.FLOAT_VEC4:
                this._gl.uniform4f(location, data[0], data[1], data[2], data[3]);
                break;
            case this._gl.FLOAT_MAT4:
                this._gl.uniformMatrix4fv(location, false, data[0]);
                break;
            default:
                throw new Error(`Unsupported uniform type ${type}`);
        }
    }

    public use() {
        this._gl.useProgram(this._program);
        //console.log(this._uniformValues);
        for (var key of this._uniformValues.keys()) {
            if (!this._uniforms.has(key)) continue;
            this.setUniformInternal(key, this._uniformValues.get(key)!.type, this._uniformValues.get(key)!.data);
        }
    }

}