import Drawable from "./interface/Drawable";
import { Matrix4 } from "@math.gl/core";

export class Camera {
    private _gl: WebGL2RenderingContext;
    private _enablePostProcessing: boolean = false;
    private _postBuffer: WebGLFramebuffer | null = null;
    
    private _viewMatrix: Matrix4 = Matrix4.IDENTITY;
    private _projectionMatrix: Matrix4 = Matrix4.IDENTITY;

    constructor(gl: WebGL2RenderingContext) {
        this._gl = gl
    }

    public setPostProcessing(enable: boolean) {
        this._enablePostProcessing = enable
    }

    public clear() {
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT)
    }

    public draw(drawable: Drawable) {
        // This is the only line that is different from the Drawable interface
        drawable.draw(this._gl, this._projectionMatrix, this._viewMatrix)
    }

    public setPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
        this._projectionMatrix = Matrix4.IDENTITY.clone().perspective({fovy: fov, aspect, near, far})
        this._viewMatrix = Matrix4.IDENTITY.clone().lookAt({eye: [0, 0, 5], center: [0, 0, 0], up: [0, 1, 0]})
    }
}