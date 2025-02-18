import { Matrix4 } from "@math.gl/core";

export default interface Drawable {
    /**
     * @param velocityBuffer velocity buffer where screen-space velocity vectors should be written
     * @param projectionMatrix camera projection matrix
     * @param viewMatrix world view matrix
     * @returns number of triangles drawn
     */
    draw(projectionMatrix: Matrix4, viewMatrix: Matrix4): number
}