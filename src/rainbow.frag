#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform float uTime;

in vec2 v_uv;

#define M_PI 3.14159265358979323846

float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
float rand (vec2 co, float l) {return rand(vec2(rand(co), l));}
float rand (vec2 co, float l, float t) {return rand(vec2(rand(co, l), t));}

float perlin(vec2 p, float dim, float time) {
	vec2 pos = floor(p * dim);
	vec2 posx = pos + vec2(1.0, 0.0);
	vec2 posy = pos + vec2(0.0, 1.0);
	vec2 posxy = pos + vec2(1.0);
	
	float c = rand(pos, dim, time);
	float cx = rand(posx, dim, time);
	float cy = rand(posy, dim, time);
	float cxy = rand(posxy, dim, time);
	
	vec2 d = fract(p * dim);
	d = -0.5 * cos(d * M_PI) + 0.5;
	
	float ccx = mix(c, cx, d.x);
	float cycxy = mix(cy, cxy, d.x);
	float center = mix(ccx, cycxy, d.y);
	
	return center * 2.0 - 1.0;
}

const vec3 rainbow[5] = vec3[5](
    vec3(255,102,128),
    vec3(255,230,102),
    vec3(102,255,153),
    vec3(102,204,255),
    vec3(153,102,255)
    
);

vec3 baseColor(vec2 uv)
{
    
    float f = 0.707107;
    
    mat2 offset = mat2(f ,-f ,f, f);
    vec2 perlinuv = uv;
    perlinuv.x += uTime * 0.3;
    perlinuv.y += uTime * 0.1;
    
    uv.x += perlin(perlinuv, 4.0, 1.0) * 0.08;
    uv.y += perlin(perlinuv.yx * 0.8, 4.0, 1.0) * 0.1;
    uv = uv * offset;
    uv += 0.5;
    //uv = uv + max(0.5, (1.0 - (iTime / 4.0)));
    
    int col =  int(uv.x * 100.0f);
    col = col / 20;
    col = max(col, 0);
    col = min(col, 4);
    return rainbow[col] / 255.0;
}
out vec4 color;
void main()
{
    float mask = min(texture(uColor, v_uv).r, 1.0);
    color = vec4(baseColor(v_uv) * mask, 1.0);
}