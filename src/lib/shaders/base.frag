#version 300 es
precision highp float;

in vec3 v_normal;

layout(location = 0) out vec4 color;
layout(location = 1) out vec4 velocity;
layout(location = 2) out vec4 normal;

vec4 fragment(in vec2 uv, in vec3 normal, in vec4 position);

#CHILD_FRAG

in vec2 v_uv;
in vec4 v_position;
in vec4 v_previousPosition;
void main() {
    color = fragment(v_uv, v_normal, v_position);

    vec3 cur = v_position.xyz / v_position.w;
    vec3 old = v_previousPosition.xyz / v_previousPosition.w;
    
    // Convert from clip space to screen space
    vec2 v = (cur.xy - old.xy) * 0.5;
    
    // Flip Y velocity to match screen space
    v.y = -v.y;
    
    velocity = vec4(v, 0.0, 1.0);

    normal = vec4(v_normal, 1.0);
}