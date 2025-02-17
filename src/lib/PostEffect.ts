import { Material } from "./Material";
import postVs from "./shaders/post.vert?raw"

export class PostEffect extends Material {
    public constructor(gl: WebGL2RenderingContext, fsText: string) {
        super(gl, postVs, fsText)
    }

}