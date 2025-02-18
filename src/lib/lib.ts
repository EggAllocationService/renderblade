
export { Camera } from "./Camera";
export { FBO } from "./FBO";
export { Material, TextureTarget } from "./Material";
export { Program } from "./Program";
export { SimpleMaterial } from "./SimpleMaterial";
export { fetchTexture } from "./util";
export { PostEffect } from "./PostEffect";
export { Object3D } from "./Object3D";

import simpleVert from "./shaders/simple.vert?raw";

export const simpleVertexShader = simpleVert;