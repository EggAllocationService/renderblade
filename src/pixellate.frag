#version 300 es
precision highp float;
uniform sampler2D uColor;

const int pixelSize = 16;

in vec2 v_uv;

out vec4 color;

void main() {
    vec2 resolution = 1.0 / vec2(textureSize(uColor, 0));
    ivec2 coord = ivec2(v_uv / resolution);
    coord = (coord / pixelSize) * pixelSize;
    coord += ivec2(pixelSize / 2);
    vec2 uv = vec2(coord) * resolution;

    color = vec4(texture(uColor, uv).xyz, 1.0);
}