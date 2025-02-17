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
import paper from './textures/paper.jpg';
import { Material } from './lib/Material';

import baseVs from "./lib/shaders/base.vert?raw";
import litFs from "./lit.frag?raw";

import {Pane} from 'tweakpane';

async function main() {
    const state = {
        outline: false,
        stipple: false,
        stippleScale: 0.8,
        noiseScale: 0.9,
        colorDrain: 0.2
    };
    const pane = new Pane({
        expanded:true
    });
    pane.addBinding(state, 'outline');
    pane.addBinding(state, 'stipple');
    const materialFolder = pane.addFolder({title: 'Material', expanded: true});
    materialFolder.addBinding(state, 'colorDrain', {min: 0, max: 1})
        .label = 'Color Drain';

    const stippleFolder = pane.addFolder({title: 'Stipple', expanded: true});
    stippleFolder.addBinding(state, 'stippleScale', {min: 0.1, max: 2})
        .label = 'Stipple Texture Scale';
    stippleFolder.addBinding(state, 'noiseScale', {min: 0.1, max: 2})
        .label = 'Noise Threshold Scale';

    
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

    const fpsEl = document.createElement('div');
    fpsEl.style.position = 'absolute';
    fpsEl.style.top = '0';
    fpsEl.style.left = '0';
    fpsEl.style.color = 'white';
    fpsEl.style.backgroundColor = 'black';
    fpsEl.style.padding = '5px';
    fpsEl.style.zIndex = '1000';
    app.appendChild(fpsEl);


    sphere.setPosition(-2, 0.4, -2);
    sphere.setScale(1, 1, 1);
    teapot.setPosition(2, 0, -2);

    console.log(stippleEffect);

    teapot.setScale(0.3, 0.3, 0.3);
    function render() {
        performance.mark('renderStart');
        litMaterial.setUniform('uColorDrain', gl.FLOAT, state.colorDrain);
        camera.clear();
        rotationDeg += 1;
        rotationDeg %= 360;


        teapot.setRotation(0, -1 * rotationDeg * Math.PI / 180, Math.PI / 10);
        sphere.setRotation(0, -1 * rotationDeg * Math.PI / 180, rotationDeg * Math.PI / 180);

        camera.draw(sphere);
        camera.draw(teapot);

        camera.postStart();
        if (state.stipple) {
            stippleEffect.setUniform("noiseScale", gl.FLOAT, state.noiseScale);
            stippleEffect.setUniform("stippleScale", gl.FLOAT, state.stippleScale);
            camera.postPass(stippleEffect);
        }
        if (state.outline) {
            camera.postPass(outlineEffect);
        }
        camera.postFinished();
        performance.mark('renderEnd');
        const time = performance.measure('render', 'renderStart', 'renderEnd');
        avg[i++] = time.duration;
        i %= 100;
        if (i === 0) {
            const averageFrameTime = avg.reduce((a, b) => a + b) / avg.length;
            const fps = 1000 / averageFrameTime;
            fpsEl.innerText = `FPS: ${fps.toFixed(2)}\nTriangles: ${camera.getDrawnTris()}`;
        }
        requestAnimationFrame(render);
    }
    render();
}

main();