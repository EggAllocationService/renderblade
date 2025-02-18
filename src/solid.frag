#version 300 es
precision highp float;
uniform vec3 uColor;



vec4 fragment(in vec2 uv, in vec3 normal, in vec4 position) {
    return vec4(uColor, 1.0);
}