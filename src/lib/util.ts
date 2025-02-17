import { FBO } from "./FBO";

export function fetchTexture(gl: WebGL2RenderingContext, path: string): Promise<FBO> {
    return new Promise((resolve, reject) => {
        var i = new Image();
        i.onload = () => {
            resolve(FBO.fromImage(gl, i));
        }
        i.onerror = (e) => {
            reject(e);
        }
        i.src = path;
    });
}