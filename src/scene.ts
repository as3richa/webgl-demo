import { mat4, vec3, quat } from "gl-matrix";

import { Shader } from './shader';

type Texture = WebGLTexture;

type Mesh = {
  buffer: WebGLBuffer,
  length: number,
};

export class Scene {
  private gl: WebGLRenderingContext;
  private shader: Shader;
  private models: Set<Model>;
  private projectionMatrix: mat4;
  private viewMatrix: mat4;
  private cameraPosition: vec3;
  private lightPosition: vec3;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.shader = new Shader(gl);
    this.models = new Set();
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.cameraPosition = vec3.create();
    this.lightPosition = vec3.create();

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);
  }

  createMesh(vertices: Float32Array): Mesh {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return { buffer, length: vertices.length / 8 };
  }

  destroyMesh(mesh: Mesh) {
    this.gl.deleteBuffer(mesh.buffer);
  }

  createTexture(data: ImageData): Texture {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  destroyTexture(texture: Texture) {
    this.gl.deleteTexture(texture);
  }

  createModel(mesh: Mesh, texture: Texture, shininess: number) {
    return new Model(mesh, texture, shininess);
  }

  addModel(model: Model) {
    this.models.add(model);
  }

  removeModel(model: Model) {
    this.models.delete(model);
  }

  setViewport(width: number, height: number) {
    this.gl.viewport(0, 0, width, height);
  }

  setCamera(position: vec3, pitch: number, yaw: number) {
    vec3.copy(this.cameraPosition, position);

    const negatedPosition = vec3.negate(vec3.create(), position);
    mat4.fromXRotation(this.viewMatrix, -1 * pitch);
    mat4.rotateY(this.viewMatrix, this.viewMatrix, yaw);
    mat4.translate(this.viewMatrix, this.viewMatrix, negatedPosition);
  }

  setLightPosition(position: vec3) {
    vec3.copy(this.lightPosition, position);
  }

  setProjection(verticalFieldOfView: number, aspectRatio: number) {
    mat4.perspective(this.projectionMatrix, verticalFieldOfView, aspectRatio, 1, 1000);
  }

  render() {
    const gl = this.gl;
    const shader = this.shader;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);

    shader.use();
    shader.setTextureId(0);
    shader.setProjectionMatrix(this.projectionMatrix);
    shader.setViewMatrix(this.viewMatrix);
    shader.setCameraPosition(this.cameraPosition);
    shader.setLightPosition(this.lightPosition);

    for(const model of this.models) {
      shader.bindVertices(model.mesh.buffer);
      shader.bindTexture(model.texture);
      shader.setShininess(model.shininess);

      const [modelMatrix, normalMatrix] = model.modelAndNormalMatrices();
      shader.setModelMatrix(modelMatrix);
      shader.setNormalMatrix(normalMatrix);

      gl.drawArrays(gl.TRIANGLES, 0, model.mesh.length);
    }
  }
}

class Model {
  mesh: Mesh;
  texture: Texture;
  shininess: number;
  position: vec3;
  rotation: quat;
  scale: number;

  constructor(mesh: Mesh, texture: Texture, shininess: number) {
    this.mesh = mesh;
    this.texture = texture;
    this.shininess = shininess;
    this.position = vec3.create();
    this.rotation = quat.create();
    this.scale = 1;
  }

  modelAndNormalMatrices() {
    const scaleVector = vec3.fromValues(this.scale, this.scale, this.scale);
    const modelMatrix = mat4.fromRotationTranslationScale(mat4.create(), this.rotation, this.position, scaleVector);
    const normalMatrix = mat4.invert(mat4.create(), modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    return [modelMatrix, normalMatrix];
  }
}
