#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uMask;

in vec2 v_uv;
out vec4 color;

void main() {
    vec3 intensity = texture(uColor, v_uv).xyz;
    float mask = texture(uMask, v_uv).x;
    vec3 inverted = 1.0 - intensity;
    color = vec4(mix(intensity, inverted, mask), 1.0);
}