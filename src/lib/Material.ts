import { FBO } from "./FBO";
import { Program } from "./Program";

export class Material extends Program {
    public constructor(gl: WebGL2RenderingContext, vsText: string | WebGLProgram, fsText: string) {
        super(gl, vsText, fsText);
    }

    private _textures: Map<string, {buffer: FBO, target: TextureTarget}> = new Map();

    public setTexture(name: string, texture: FBO, target: TextureTarget = TextureTarget.COLOR): void {
        this._textures.set(name, {buffer: texture, target});
    }

    public override use(): void {
        var i = 0;
        for (let [name, texture] of this._textures) {
            if (this._uniforms.get(name) === undefined) {
                continue;
            }
            if (texture.target === TextureTarget.COLOR) {
                texture.buffer.attach(i);
            } else {
                texture.buffer.attachDepth(i);
            }
            this.setUniform(name, this._gl.INT, i);
            i++;
        }
        super.use();
    }

    public clone(): Material {
        var result = new Material(this._gl, this._program, "null");
        result._uniforms = this._uniforms;
        result._gl = this._gl;
        return result;
    }
}

export enum TextureTarget {
    COLOR = 1,
    DEPTH = 2
}