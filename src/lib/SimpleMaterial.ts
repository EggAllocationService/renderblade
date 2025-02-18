import { Material } from "./Material";
import baseVs from "./shaders/base.vert?raw";
import baseFs from "./shaders/base.frag?raw";

/**
 * A simple material that has built-in support for producing velocity buffers for TAA and such
 */
export class SimpleMaterial extends Material {
    constructor(gl: WebGL2RenderingContext, vsText: string, fsText: string) {
        vsText = vsText.replace("#version 300 es", "");
        vsText = vsText.replace("\nprecision", "\n//");
        const templated = baseVs.replace("#CHILD_VERTEX", vsText);

        fsText = fsText.replace("#version 300 es", "");
        fsText = fsText.replace("\nprecision", "\n//");
        const templatedFs = baseFs.replace("#CHILD_FRAG", fsText);
        super(gl, templated, templatedFs);
    }
}