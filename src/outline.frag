#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uNormal;
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
    

    ivec2 resolution = textureSize(uNormal, 0);
    ivec2 coord = ivec2(gl_FragCoord.xy);
    if (coord.x == 0 || coord.y == 0 || coord.x == resolution.x - 1 || coord.y == resolution.y - 1) {
        color = texture(uColor, v_uv);
        return;
    }

    vec3 n = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).xyz;
    vec3 ne = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(1, -1), 0).xyz;
    vec3 e = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(1, 0), 0).xyz;
    vec3 se = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(1, 1), 0).xyz;
    vec3 s = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(0, 1), 0).xyz;
    vec3 sw = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(-1, 1), 0).xyz;
    vec3 w = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).xyz;
    vec3 nw = texelFetch(uNormal, ivec2(gl_FragCoord.xy) + ivec2(-1, -1), 0).xyz;
    vec3 center = texture(uNormal, v_uv).xyz;

    mat3 surrounding_r = mat3(
        vec3(nw.r, n.r, ne.r),
        vec3(w.r, center.r, e.r),
        vec3(sw.r, s.r, se.r)
    );

    mat3 surrounding_g = mat3(
        vec3(nw.g, n.g, ne.g),
        vec3(w.g, center.g, e.g),
        vec3(sw.g, s.g, se.g)
    );

    mat3 surrounding_b = mat3(
        vec3(nw.b, n.b, ne.b),
        vec3(w.b, center.b, e.b),
        vec3(sw.b, s.b, se.b)
    );

    vec2 edge_r = vec2(
        dot(sobel_x[0], surrounding_r[0]) + dot(sobel_x[1], surrounding_r[1]) + dot(sobel_x[2], surrounding_r[2])
    );
    vec2 edge_g = vec2(
        dot(sobel_x[0], surrounding_g[0]) + dot(sobel_x[1], surrounding_g[1]) + dot(sobel_x[2], surrounding_g[2])
    );
    vec2 edge_b = vec2(
        dot(sobel_x[0], surrounding_b[0]) + dot(sobel_x[1], surrounding_b[1]) + dot(sobel_x[2], surrounding_b[2])
    );

    float edge = length(edge_r) + length(edge_g) + length(edge_b);
    edge = clamp(edge * 10.0 ,0.0, 1.0);
    color = mix(vec4(0), vec4(uOutlineColor * vec3(0.97f, 0.97f, 0.8f), 1.0), edge);
}