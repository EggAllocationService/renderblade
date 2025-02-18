import ObjFileParser from "obj-file-parser";
import Drawable from "./interface/Drawable";

import baseVertexShader from './shaders/simple.vert?raw';
import baseFragmentShader from './shaders/normal.frag?raw';

import { Matrix4, Vector3 } from "@math.gl/core";
import { Material } from "./Material";
import { SimpleMaterial } from "./SimpleMaterial";

export class Object3D implements Drawable {
    private _gl: WebGL2RenderingContext;
    private _vao: WebGLVertexArrayObject;
    private _model: ObjFileParser.ObjModel;

    private _material: Material;

    private _position: Vector3 = new Vector3(0, 0, 0);
    private _scale: Vector3 = new Vector3(1, 1, 1);
    private _rotation: Vector3 = new Vector3(0, 0, 0);
    private _vertexCount: number = 0;

    private _lastPvm: Matrix4 = Matrix4.IDENTITY;


    /**
     * 
     * @param obj the text of a wavefront .obj file 
     */
    public constructor(gl: WebGL2RenderingContext, obj: string) {
        this._gl = gl;
        this._vao = this._gl.createVertexArray();
        this._model = (new ObjFileParser(obj)).parse().models[0];
        this._material = new SimpleMaterial(this._gl, baseVertexShader, baseFragmentShader);

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
        let needsVertexNormalsCalculated: boolean = false;
        this._model.faces.forEach((face) => {
            face.vertices.forEach((vertex) => {
                var pos = this._model.vertices[vertex.vertexIndex - 1];
                verticies.push(pos.x, pos.y, pos.z);

                var normal = this._model.vertexNormals[vertex.vertexNormalIndex - 1];
                if (normal == undefined) {
                    needsVertexNormalsCalculated = true;
                } else {
                    normals.push(normal.x, normal.y, normal.z);
                }
                
                var uv = this._model.textureCoords[vertex.textureCoordsIndex - 1];
                if (uv == undefined) {
                    uvs.push(0, 0);
                } else {
                    uvs.push(uv.u, uv.v);
                }
                this._vertexCount++;
            });
        });

        if (needsVertexNormalsCalculated) {
            for (let i = 0; i < verticies.length; i += 9) {
                const v1 = new Vector3(verticies[i], verticies[i + 1], verticies[i + 2]);
                const v2 = new Vector3(verticies[i + 3], verticies[i + 4], verticies[i + 5]);
                const v3 = new Vector3(verticies[i + 6], verticies[i + 7], verticies[i + 8]);

                const normal = v2.clone().subtract(v1).cross(v3.clone().subtract(v1)).normalize();

                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
            }
        }

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

    public draw(projectionMatrix: Matrix4, viewMatrix: Matrix4): number {
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0, this._gl.COLOR_ATTACHMENT1, this._gl.COLOR_ATTACHMENT2]);
        this._gl.bindVertexArray(this._vao);
        const modelMatrix = this.generateModelMatrix();
        const pvm = projectionMatrix.clone().multiplyRight(viewMatrix).multiplyRight(modelMatrix)
        this._material.setUniform('u_projectionMatrix', this._gl.FLOAT_MAT4, projectionMatrix);
        this._material.setUniform('u_viewMatrix', this._gl.FLOAT_MAT4, viewMatrix);
        this._material.setUniform('u_modelMatrix', this._gl.FLOAT_MAT4, modelMatrix);
        this._material.setUniform('u_pvmMatrix', this._gl.FLOAT_MAT4, pvm);
        this._material.setUniform('u_previousPvmMatrix', this._gl.FLOAT_MAT4, this._lastPvm);
        this._lastPvm = pvm;

        this._material.use();

        this._gl.drawArrays(this._gl.TRIANGLES, 0, this._vertexCount);
        return this._vertexCount / 3;
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

    public getMaterial(): Material {
        return this._material;
    }

    public setMaterial(material: Material): void {
        this._material = material;
    }
}