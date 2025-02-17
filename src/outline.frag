#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec3 uOutlineColor;

in vec2 v_uv;

out vec4 color;

const mat3 sobel_y = mat3(
	vec3(1.0, 0.0, -1.0),
	vec3(2.0, 0.0, -2.0),
	vec3(1.0, 0.0, -1.0)
);

const mat3 sobel_x = mat3(
	vec3(1.0, 2.0, 1.0),
	vec3(0.0, 0.0, 0.0),
	vec3(-1.0, -2.0, -1.0)
);


float linearDepth(float depth) {
    float zNear = 0.1;
    float zFar = 100.0;
    return (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));
}

void main() {
    float depth = texture(uDepth, v_uv).r;
    float linear = linearDepth(depth);

    ivec2 resolution = textureSize(uDepth, 0);
    ivec2 coord = ivec2(gl_FragCoord.xy);
    if (coord.x == 0 || coord.y == 0 || coord.x == resolution.x - 1 || coord.y == resolution.y - 1) {
        color = texture(uColor, v_uv);
        return;
    }

    float n = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).r);
    float ne = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(1, -1), 0).r);
    float e = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(1, 0), 0).r);
    float se = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(1, 1), 0).r);
    float s = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(0, 1), 0).r);
    float sw = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(-1, 1), 0).r);
    float w = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).r);
    float nw = linearDepth(texelFetch(uDepth, ivec2(gl_FragCoord.xy) + ivec2(-1, -1), 0).r);

    mat3 surrounding = mat3(
        vec3(nw, n, ne),
        vec3(w, linear, e),
        vec3(sw, s, se)
    );

    float edge_x = dot(sobel_x[0], surrounding[0]) + dot(sobel_x[1], surrounding[1]) + dot(sobel_x[2], surrounding[2]);
    float edge_y = dot(sobel_y[0], surrounding[0]) + dot(sobel_y[1], surrounding[1]) + dot(sobel_y[2], surrounding[2]);
    float edge = sqrt(edge_x * edge_x + edge_y * edge_y);
    edge = min(1.0, edge);
    color = mix(texture(uColor, v_uv), vec4(uOutlineColor, 1.0), edge);
}