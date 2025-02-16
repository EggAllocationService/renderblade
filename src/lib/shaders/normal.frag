#version 300 es
precision highp float;

in vec3 v_normal;

out vec4 color;

void main() {
    color = vec4(abs(normalize(v_normal) * 0.5 + 0.5), 1.0);
}