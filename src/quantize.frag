#version 300 es
precision highp float;
uniform sampler2D uColor;

in vec2 v_uv;

out vec4 color;

void main() {
    vec4 texel = texture(uColor, v_uv);
    float intensity = (texel.r + texel.g + texel.b) / 3.0;
    if (intensity > 0.001) {
        color = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    }
}