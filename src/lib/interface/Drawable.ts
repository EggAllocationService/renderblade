import { Matrix4 } from "@math.gl/core";

export default interface Drawable {
    draw(gl: WebGL2RenderingContext, projectionMatrix: Matrix4, viewMatrix: Matrix4): void
}