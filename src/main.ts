import './style.css'
import cubeObj from './Cube.obj?raw'
import { Camera } from './lib/Camera';
import { Object3D } from './lib/Object3D';

const app = document.getElementById('app') as HTMLDivElement;

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

app.appendChild(canvas);

const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
const camera = new Camera(gl);
camera.setPerspectiveMatrix(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

const cube = new Object3D(gl, cubeObj);
console.log(cube);

let rotationDeg = 0;

function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotationDeg += 1;
    rotationDeg %= 360;

    cube.setRotation(0, rotationDeg * Math.PI / 180, 0);
    camera.draw(cube);
    requestAnimationFrame(render);
}

render();