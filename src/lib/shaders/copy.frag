#version 300 es
precision highp float;
uniform sampler2D uColor;

in vec2 v_uv;

out vec4 color;

void main() {
    vec4 texel = texture(uColor, v_uv);
    color = vec4(texel.xyz, 1.0);// texture(uColor, v_uv);
}