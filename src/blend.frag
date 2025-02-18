#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uOutline;

in vec2 v_uv;

out vec4 color;


void main() {
    // tile uNoise across the screen
    vec3 srcColor = texture(uColor, v_uv).xyz;
    vec4 overlay = texture(uOutline, v_uv);

    // blend according to overlay.a
    color = vec4(mix(srcColor, overlay.xyz, overlay.a), 1.0);

}