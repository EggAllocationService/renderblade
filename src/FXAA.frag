#version 300 es
precision highp float;

uniform sampler2D uColor;
in vec2 v_uv;
out vec4 FragColor;

// FXAA Quality Settings
#define FXAA_SPAN_MAX 3.0
#define FXAA_REDUCE_MUL (1.0 / FXAA_SPAN_MAX)
#define FXAA_REDUCE_MIN (1.0 / 128.0)

// Computes FXAA
vec4 fxaa(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec3 rgbNW = texture(tex, uv + vec2(-1.0, -1.0) * texelSize).rgb;
    vec3 rgbNE = texture(tex, uv + vec2(1.0, -1.0) * texelSize).rgb;
    vec3 rgbSW = texture(tex, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    vec3 rgbSE = texture(tex, uv + vec2(1.0, 1.0) * texelSize).rgb;
    vec4 cur = texture(tex, uv);
    vec3 rgbM  = cur.xyz;
    
    float lumaNW = dot(rgbNW, vec3(0.299, 0.587, 0.114));
    float lumaNE = dot(rgbNE, vec3(0.299, 0.587, 0.114));
    float lumaSW = dot(rgbSW, vec3(0.299, 0.587, 0.114));
    float lumaSE = dot(rgbSE, vec3(0.299, 0.587, 0.114));
    float lumaM  = dot(rgbM, vec3(0.299, 0.587, 0.114));
    
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    
    float contrast = lumaMax - lumaMin;
    if (contrast < FXAA_REDUCE_MIN) return cur;
    
    float lumaSum = lumaNW + lumaNE + lumaSW + lumaSE;
    vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)),
                    ((lumaNW + lumaSW) - (lumaNE + lumaSE)));
    
    float dirReduce = max((lumaSum * 0.25) * FXAA_REDUCE_MUL, FXAA_REDUCE_MIN);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpDirMin, vec2(-FXAA_SPAN_MAX), vec2(FXAA_SPAN_MAX)) * texelSize;
    
    vec4 rgbA = (texture(tex, uv + dir * (1.0 / 3.0 - 0.5)) + 
                 texture(tex, uv + dir * (2.0 / 3.0 - 0.5))) * 0.5;
    vec4 rgbB = rgbA * 0.5 + (texture(tex, uv + dir * -0.5) + 
                              texture(tex, uv + dir * 0.5)) * 0.25;
    
    return rgbB;
}

void main() {
    vec2 texelSize = 1.0 / vec2(textureSize(uColor, 0));
    FragColor = fxaa(uColor, v_uv, texelSize);
}
