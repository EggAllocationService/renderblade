#version 300 es
precision highp float;

vec4 fragment(in vec2 uv, in vec3 normal, in vec4 position) {
    return vec4(abs(normalize(normal) * 0.5 + 0.5), 1.0);
}