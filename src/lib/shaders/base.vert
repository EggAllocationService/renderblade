#version 300 es
precision highp float;

layout (location = 0) in vec3 a_position;
layout (location = 1) in vec3 a_normal;
layout (location = 2) in vec2 a_uv;
uniform mat4 u_modelMatrix;
uniform mat4 u_pvmMatrix;
uniform mat4 u_previousPvmMatrix;

void vertex(in vec3 position, in vec3 normal, in mat4 viewProjModel, in mat4 modelMat, out vec4 vPos, out vec3 vNorm);

#CHILD_VERTEX

out vec2 v_uv;
out vec3 v_normal;

out vec4 v_position;
out vec4 v_previousPosition;

void main() {
    v_uv = a_uv;
    vec3 old_normal;
    vec4 pos;
    vec4 old_pos;

    vertex(a_position, a_normal, u_pvmMatrix, u_modelMatrix, pos, v_normal);
    vertex(a_position, a_normal, u_previousPvmMatrix, u_modelMatrix, old_pos, old_normal);

    v_position = pos;
    gl_Position = pos;
    v_previousPosition = old_pos;

    /*v_normal = transpose(inverse(mat3(u_modelMatrix))) * a_normal;
    gl_Position = u_pvmMatrix * vec4(a_position, 1.0);*/

}
