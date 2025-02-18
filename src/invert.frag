#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uMask;

float linearDepth(float depth) {
    float zNear = 0.1;
    float zFar = 100.0;
    return (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));
}

in vec2 v_uv;
out vec4 color;



void main() {
    vec3 intensity = texture(uColor, v_uv).xyz;
    float mask = linearDepth(texture(uMask, v_uv).x);
    float depth = linearDepth(texture(uDepth, v_uv).x);
    vec3 inverted = 1.0 - intensity;
    if (depth > mask) {
        color = vec4(inverted, 1.0);
    } else {
        color = vec4(intensity, 1.0);
    }
}