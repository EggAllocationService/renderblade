# Renderblade

A simple rendering engine for WebGL2.

Supports loading .OBJ files, custom materials and custom postprocessing.

It's recommended to use `SimpleMaterial` for your object materials as that will automatically write motion vectors to the `uVelocity` texture to be used by post-processing effects.

## Materials
For `SimpleMaterial`s, your vertex and fragment shaders will look different to vanilla opengl. Here's a template for each:
```glsl
// solid color
#version 300 es
precision highp float;
uniform vec3 uColor;

vec4 fragment(in vec2 uv, in vec3 normal, in vec4 position) {
    return vec4(uColor, 1.0);
}
```
```glsl
// basic vertex shader
#version 300 es
precision highp float;

void vertex(in vec3 position, in vec3 normal, in mat4 viewProjModel, in mat4 modelMat, out vec4 vPos, out vec3 vNorm) {
    vPos = viewProjModel * vec4(position, 1.0);
    vNorm = transpose(inverse(mat3(modelMat))) * normal;
}
```

For normal `Materials` you can write normal vertex and fragment shaders, though the fragment shaders are still expected to write to two output buffers, with color at 0 and a 2D velocity buffer at 1.

## Camera
The `Camera` object is your main renderer. You can call `Camera.draw(object)` to render 3d objects to the screen

MSAA can be enabled by calling `camera.setSamples(n: number)`. 

Each frame's code should look something like this:
```js
camera.clear();
// update objects
// draw objects with camera.draw(object)
camera.postStart();
// call camera.postPass(PostEffect) to run post-processing passes
camera.postFinished();
```

## Post-Processing

`PostEffect` is a class extending `Material` that lets you create a post-processing effect. They are rendered as a quad covering the whole screen. Here's a sample:
```glsl
uniform sampler2D uColor; // input color buffer (usually scene or output from last effect, but can be customized)
uniform sampler2D uDepth; // scene depth buffer
uniform sampler2D uVelocity; // clip-space motion vectors
uniform sampler2D uRenderScale; // render scale multiplier

in vec2 v_uv; // screen UV coordinate
in vec2 v_uv;

out vec4 color;
void main() {
    // invert color
    color = vec4(1.0 - texture(uColor, v_uv).xyz, 1.0); 
}
```

