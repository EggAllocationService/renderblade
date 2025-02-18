#version 300 es
precision highp float;

uniform float uColorDrain;

const vec3 lightDirection = normalize(vec3(0.5, 0.5, 0.4));

vec4 fragment(in vec2 uv, in vec3 normal, in vec4 position) {
    float intensity = dot(normalize(normal), lightDirection);
    intensity = max(min(1.0, intensity - uColorDrain), 0.0);
    return vec4(vec3(intensity), 1.0);
}
