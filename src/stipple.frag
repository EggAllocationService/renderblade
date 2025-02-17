#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uNoise;
uniform sampler2D uBg;

in vec2 v_uv;

out vec4 color;

uniform float stippleScale;
uniform float noiseScale;
uniform vec3 inkColor;


void main() {
    // tile uNoise across the screen
    vec2 ratio = vec2(textureSize(uColor, 0)) / vec2(textureSize(uNoise, 0));
    color = texture(uColor, v_uv);
    float noise = texture(uNoise, v_uv * ratio * stippleScale).x * noiseScale;
    vec4 bg = texture(uBg, v_uv * ratio * 8.0);

    if (color.r <= noise) {
        color = vec4(inkColor, 1.0) * bg;
    } else {
        color = bg;
    }

}