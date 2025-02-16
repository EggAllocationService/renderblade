import './style.css'
import monkeyObj from './Monkey.obj?raw'
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
const monkey = new Object3D(gl, monkeyObj);

const loc = 1.0;
console.log(cube);
cube.setScale(0.5, 0.5, 0.5);
monkey.setScale(0.7, 0.7, 0.7);

let rotationDeg = 0;
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotationDeg += 1;
    rotationDeg %= 360;

    cube.setRotation(0, rotationDeg * Math.PI / 180, rotationDeg * Math.PI / 180);
    monkey.setRotation(0, -1 * rotationDeg * Math.PI / 180, rotationDeg * Math.PI / 180);

    cube.setPosition(-1 * Math.sin(Date.now() / 1000), -1 * Math.cos(Date.now() / 1000), 0);
    monkey.setPosition(1 * Math.sin(Date.now() / 1000), -1 * Math.sin(Date.now() / 1000), 0);
    camera.draw(cube);
    camera.draw(monkey);
    requestAnimationFrame(render);
}

render();