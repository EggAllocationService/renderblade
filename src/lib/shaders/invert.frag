#version 300 es
precision highp float;
uniform sampler2D uColor;

in vec2 v_uv;

out vec4 color;

void main() {
    color = vec4(1.0 - texture(uColor, v_uv).xyz, 1.0);
}