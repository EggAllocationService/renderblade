#version 300 es
precision highp float;
uniform sampler2D uColor;

in vec2 v_uv;

out vec4 color;

const float colors = 4.0;

void main() {
    float intensity = texture(uColor, v_uv).x;
    intensity = floor(intensity * colors) / colors;
    color = vec4(intensity, intensity, intensity, 1.0);
}