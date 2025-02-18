#version 300 es
precision highp float;

void vertex(in vec3 position, in vec3 normal, in mat4 viewProjModel, in mat4 modelMat, out vec4 vPos, out vec3 vNorm) {
    vPos = viewProjModel * vec4(position, 1.0);
    vNorm = transpose(inverse(mat3(modelMat))) * normal;
}
