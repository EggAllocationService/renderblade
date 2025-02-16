import ObjFileParser from "obj-file-parser";
import Drawable from "./interface/Drawable";
import { Program } from "./Program";

import baseVertexShader from './shaders/base.vert?raw';
import baseFragmentShader from './shaders/normal.frag?raw';
import { Matrix4, Vector3 } from "@math.gl/core";

export class Object3D implements Drawable {
    private _gl: WebGL2RenderingContext;
    private _vao: WebGLVertexArrayObject;
    private _model: ObjFileParser.ObjModel;

    private _material: Program;

    private _position: Vector3 = new Vector3(0, 0, 0);
    private _scale: Vector3 = new Vector3(1, 1, 1);
    private _rotation: Vector3 = new Vector3(0, 0, 0);
    private _vertexCount: number = 0;


    /**
     * 
     * @param obj the text of a wavefront .obj file 
     */
    public constructor(gl: WebGL2RenderingContext, obj: string) {
        this._gl = gl;
        this._vao = this._gl.createVertexArray();
        this._model = (new ObjFileParser(obj)).parse().models[0];
        this._material = new Program(this._gl, baseVertexShader, baseFragmentShader);

        this.uploadVertexData();
    }

    private uploadVertexData(): void {
        let vertexBuffer: WebGLBuffer = this._gl.createBuffer();
        let normalBuffer: WebGLBuffer = this._gl.createBuffer();
        let texCoordBuffer: WebGLBuffer = this._gl.createBuffer();

        if (vertexBuffer === null) {
            throw new Error('Failed to create vertex buffer');
        }
        this._gl.bindVertexArray(this._vao);
        const verticies: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        this._vertexCount = 0;
        this._model.faces.forEach((face) => {
            face.vertices.forEach((vertex) => {
                var pos = this._model.vertices[vertex.vertexIndex - 1];
                verticies.push(pos.x, pos.y, pos.z);
                var normal = this._model.vertexNormals[vertex.vertexNormalIndex - 1];
                normals.push(normal.x, normal.y, normal.z);
                var uv = this._model.textureCoords[vertex.textureCoordsIndex - 1];
                uvs.push(uv.u, uv.v);
                this._vertexCount++;
            });
        });

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(verticies), this._gl.STATIC_DRAW);
        this._gl.enableVertexAttribArray(0);
        this._gl.vertexAttribPointer(0, 3, this._gl.FLOAT, false, 0, 0);

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, normalBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(normals), this._gl.STATIC_DRAW);
        this._gl.enableVertexAttribArray(1);
        this._gl.vertexAttribPointer(1, 3, this._gl.FLOAT, false, 0, 0);

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, texCoordBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(uvs), this._gl.STATIC_DRAW);
        this._gl.enableVertexAttribArray(2);
        this._gl.vertexAttribPointer(2, 2, this._gl.FLOAT, false, 0, 0);


        this._gl.bindVertexArray(null);
    }

    private generateModelMatrix(): Matrix4 {
        return Matrix4.IDENTITY.clone().translate(this._position).scale(this._scale).rotateXYZ(this._rotation);
    }

    public draw(gl: WebGL2RenderingContext, projectionMatrix: Matrix4, viewMatrix: Matrix4): void {
        this._gl.bindVertexArray(this._vao);
        this._material.use();
        this._material.setUniformMatrix('u_projectionMatrix', projectionMatrix);
        this._material.setUniformMatrix('u_viewMatrix', viewMatrix);
        this._material.setUniformMatrix('u_modelMatrix', this.generateModelMatrix());

        this._gl.drawArrays(this._gl.TRIANGLES, 0, this._vertexCount);
    }
    
    public setRotation(x: number, y: number, z: number): void {
        this._rotation[0] = x;
        this._rotation[1] = y;
        this._rotation[2] = z;
    }
    public setScale(x: number, y: number, z: number): void {
        this._scale[0] = x;
        this._scale[1] = y;
        this._scale[2] = z;
    }
    public setPosition(x: number, y: number, z: number): void {
        this._position[0] = x;
        this._position[1] = y;
        this._position[2] = z;
    }
}