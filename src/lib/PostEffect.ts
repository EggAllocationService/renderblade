import { Program } from "./Program";
import postVs from "./shaders/post.vert?raw"

export class PostEffect extends Program {
    public constructor(gl: WebGL2RenderingContext, fsText: string) {
        super(gl, postVs, fsText)
    }

}