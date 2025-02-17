#version 300 es
precision highp float;

in vec3 v_normal;

out vec4 color;

const vec3 lightDirection = normalize(vec3(0.5, 0.5, 0.4));

void main() {
    float intensity = dot(normalize(v_normal), lightDirection);
    intensity = min(1.0, intensity - 0.2);
    color = vec4(vec3(intensity), 1.0);
}