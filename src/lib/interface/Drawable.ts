import { Matrix4 } from "@math.gl/core";

export default interface Drawable {
    /**
     * 
     * @param gl webgl2 instance
     * @param projectionMatrix camera projection matrix
     * @param viewMatrix world view matrix
     * @returns number of triangles drawn
     */
    draw(gl: WebGL2RenderingContext, projectionMatrix: Matrix4, viewMatrix: Matrix4): number
}