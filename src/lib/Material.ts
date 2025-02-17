import { FBO } from "./FBO";
import { Program } from "./Program";

export class Material extends Program {
    public constructor(gl: WebGL2RenderingContext, vsText: string, fsText: string) {
        super(gl, vsText, fsText);
    }

    private _textures: Map<string, FBO> = new Map<string, FBO>();

    public setTexture(name: string, texture: FBO): void {
        this._textures.set(name, texture);
    }

    public override use(): void {
        var i = 2;
        for (let [name, texture] of this._textures) {
            if (this._uniforms.get(name) === undefined) {
                console.warn(`Texture uniform ${name} not found in program`);
                continue;
            }
            texture.attach(i);
            this.setUniform(name, this._gl.INT, i);
            i++;
        }
        super.use();
    }
}