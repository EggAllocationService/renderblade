#version 300 es
precision highp float;
uniform sampler2D uColor;

in vec2 v_uv;

out vec4 color;

const float colors = 16.0;

void main() {
    vec3 intensity = texture(uColor, v_uv).xyz;
    intensity = floor(intensity * colors) / colors;
    color = vec4(intensity, 1.0);
}