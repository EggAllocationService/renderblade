#version 300 es
precision highp float;

in vec3 v_normal;

out vec4 color;

void main() {
    color = vec4(normalize(v_normal), 1.0);
}