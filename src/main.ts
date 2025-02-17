import './style.css'
import sphereObj from './Icosphere.obj?raw'
import teapotObj from './teapot.obj?raw'
import { Camera } from './lib/Camera';
import { Object3D } from './lib/Object3D';
import { PostEffect } from './lib/PostEffect';
import outlineFs from './outline.frag?raw'
import stippleFs from './stipple.frag?raw'
import { fetchTexture } from './lib/util';
import bluenoise from './textures/bluenoise.png';
import paper from './textures/paper.png';
import { Material } from './lib/Material';

import baseVs from "./lib/shaders/base.vert?raw";
import litFs from "./lit.frag?raw";

import {Pane} from 'tweakpane';

async function main() {
    const state = {
        outline: true,
        stipple: true,
        stippleScale: 0.7,
        noiseScale: 0.9,
        colorDrain: 0.2,
        frameTime: 0,
        triangles: 0,
        degreesPerSecond: 20,
        inkColor: {r: 0.1529, g: 0.1333, b: 0.1216}
    };
    const pane = new Pane({
        expanded:true,
        title: "Debug"
    });
    pane.addBinding(state, 'degreesPerSecond', {min: 0, max: 360}).label = "Rotation Speed";
    const postProcessFolder = pane.addFolder({title: 'Post Processing', expanded: true});
    postProcessFolder.addBinding(state, 'outline');
    postProcessFolder.addBinding(state, 'stipple');
    const materialFolder = pane.addFolder({title: 'Material', expanded: true});
    materialFolder.addBinding(state, 'colorDrain', {min: -1, max: 1})
        .label = 'Color Drain';

    const stippleFolder = pane.addFolder({title: 'Stipple', expanded: true});
    stippleFolder.addBinding(state, 'stippleScale', {min: 0.1, max: 2})
        .label = 'Stipple Texture Scale';
    stippleFolder.addBinding(state, 'noiseScale', {min: 0.1, max: 2})
        .label = 'Noise Threshold Scale';
    stippleFolder.addBinding(state, 'inkColor', {
        label: 'Ink Color', 
        color: {
            type: 'float'
        }
    });

    const statsFolder = pane.addFolder({title: 'Stats', expanded: true});
    statsFolder.addBinding(state, 'frameTime', {
        readonly: true,
        label: 'Frame Time',
        view: 'graph',
        min: 0,
        max: 16
    });
    statsFolder.addBinding(state, 'triangles', {
        readonly: true,
        label: 'Triangles',
        format: (value: number) => Math.floor(value).toString()
    });

    
    const app = document.getElementById('app') as HTMLDivElement;

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    app.appendChild(canvas);

    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    const camera = new Camera(gl);
    camera.setPerspectiveMatrix(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

    const sphere = new Object3D(gl, sphereObj);
    const teapot = new Object3D(gl, teapotObj);
    const outlineEffect = new PostEffect(gl, outlineFs);
    const stippleEffect = new PostEffect(gl, stippleFs);

    const litMaterial = new Material(gl, baseVs, litFs);
    sphere.setMaterial(litMaterial);
    teapot.setMaterial(litMaterial);

    const blueNoise = await fetchTexture(gl, bluenoise);
    const paperTexture = await fetchTexture(gl, paper);

    stippleEffect.setTexture("uNoise", blueNoise);
    stippleEffect.setTexture("uBg", paperTexture);

    camera.setPostProcessing(true);

    console.log(camera);

    let rotationDeg = 0;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE)
    gl.clearColor(1, 1, 1, 1.0);

    var avg: number[] = new Array(100).fill(0);
    var i = 0;

    sphere.setPosition(-2, 0.4, -2);
    sphere.setScale(1, 1, 1);
    teapot.setPosition(2, 0, -2);

    console.log(stippleEffect);

    teapot.setScale(0.3, 0.3, 0.3);

    var last = performance.now();
    function render() {
        var dt = performance.now() - last;
        
        performance.mark('renderStart');
        litMaterial.setUniform('uColorDrain', gl.FLOAT, state.colorDrain);
        camera.clear();
        rotationDeg += state.degreesPerSecond * dt / 1000;
        if (rotationDeg > 360) {
            rotationDeg = 0;
        }

        teapot.setRotation(0, -1 * rotationDeg * Math.PI / 180, Math.PI / 10);
        sphere.setRotation(0, -1 * rotationDeg * Math.PI / 180, rotationDeg * Math.PI / 180);

        camera.draw(sphere);
        camera.draw(teapot);

        camera.postStart();
        if (state.stipple) {
            stippleEffect.setUniform("noiseScale", gl.FLOAT, state.noiseScale);
            stippleEffect.setUniform("stippleScale", gl.FLOAT, state.stippleScale);
            stippleEffect.setUniform("inkColor", gl.FLOAT_VEC3, state.inkColor.r, state.inkColor.g, state.inkColor.b);
            camera.postPass(stippleEffect);
        }
        if (state.outline) {
            outlineEffect.setUniform("uOutlineColor", gl.FLOAT_VEC3, state.inkColor.r, state.inkColor.g, state.inkColor.b);
            camera.postPass(outlineEffect);
        }
        camera.postFinished();
        performance.mark('renderEnd');
        const time = performance.measure('render', 'renderStart', 'renderEnd');
        avg[i++] = time.duration;
        i %= 100;
        if (i === 0) {
            const averageFrameTime = avg.reduce((a, b) => a + b) / avg.length;
            state.frameTime = averageFrameTime;
            state.triangles = camera.getDrawnTris();
        }
        last = performance.now();
        requestAnimationFrame(render);
    }
    render();
}

main();