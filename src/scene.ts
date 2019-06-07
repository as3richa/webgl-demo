import { mat4, quat, vec3 } from "gl-matrix";

import { PhongShader } from "./phong-shader";
import { DepthMapShader } from "./depth-map-shader";

const DEPTH_MAP_SIZE = 1600;
const LIGHT_PROJECTION_MATRIX = mat4.perspective(mat4.create(), Math.PI / 2, 1, 1, 100);

const ORIGIN = vec3.create();
const UP = vec3.fromValues(0, 1, 0);

type Texture = WebGLTexture;

type Mesh = {
  buffer: WebGLBuffer,
  length: number,
};

export class Scene {
  private gl: WebGLRenderingContext;
  private phongShader: PhongShader;
  private depthMapShader: DepthMapShader;

  private viewportWidth: number;
  private viewportHeight: number;

  private models: Set<Model>;

  private projectionMatrix: mat4;
  private viewMatrix: mat4;
  private cameraPosition: vec3;
  private lightPosition: vec3;

  private depthMapFrameBuffer;
  private depthMapTexture;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.phongShader = new PhongShader(gl);
    this.depthMapShader = new DepthMapShader(gl);
    this.models = new Set();
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.cameraPosition = vec3.create();
    this.lightPosition = vec3.create();
    this.depthMapFrameBuffer = gl.createFramebuffer();
    this.depthMapTexture = gl.createTexture();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 1);

    if (gl.getExtension("WEBGL_depth_texture") === null) {
      throw new Error("WEBGL_depth_texture isn't supported by this browser");
    }

    gl.bindTexture(gl.TEXTURE_2D, this.depthMapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, DEPTH_MAP_SIZE, DEPTH_MAP_SIZE, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthMapFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthMapTexture, 0);

    const frameBufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (frameBufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Errroneous framebuffer status '${frameBufferStatus.toString()}'`);
    }
  }

  public createMesh(vertices: Float32Array): Mesh {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return { buffer, length: vertices.length / 8 };
  }

  public destroyMesh(mesh: Mesh) {
    this.gl.deleteBuffer(mesh.buffer);
  }

  public createTexture(data: ImageData): Texture {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  public destroyTexture(texture: Texture) {
    this.gl.deleteTexture(texture);
  }

  public createModel(mesh: Mesh, texture: Texture, shininess: number) {
    return new Model(mesh, texture, shininess);
  }

  public addModel(model: Model) {
    this.models.add(model);
  }

  public removeModel(model: Model) {
    this.models.delete(model);
  }

  public setViewport(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public setCamera(position: vec3, pitch: number, yaw: number) {
    vec3.copy(this.cameraPosition, position);

    const negatedPosition = vec3.negate(vec3.create(), position);
    mat4.fromXRotation(this.viewMatrix, -1 * pitch);
    mat4.rotateY(this.viewMatrix, this.viewMatrix, yaw);
    mat4.translate(this.viewMatrix, this.viewMatrix, negatedPosition);
  }

  public setLightPosition(position: vec3) {
    vec3.copy(this.lightPosition, position);
  }

  public setProjection(verticalFieldOfView: number, aspectRatio: number) {
    mat4.perspective(this.projectionMatrix, verticalFieldOfView, aspectRatio, 1, 1000);
  }

  public render() {
    const gl = this.gl;
    const phongShader = this.phongShader;
    const depthMapShader = this.depthMapShader;

    const modelsAndMatrices = [];

    for(const model of this.models) {
      const [modelMatrix, normalMatrix] = model.modelAndNormalMatrices();
      modelsAndMatrices.push([model, modelMatrix, normalMatrix]);
    }

    const lightViewMatrix = mat4.lookAt(mat4.create(), this.lightPosition, ORIGIN, UP);
    const lightspaceMatrix = mat4.mul(mat4.create(), LIGHT_PROJECTION_MATRIX, lightViewMatrix);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthMapFrameBuffer);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, DEPTH_MAP_SIZE, DEPTH_MAP_SIZE);
    gl.cullFace(gl.FRONT);

    depthMapShader.use();
    depthMapShader.setLightspaceMatrix(lightspaceMatrix);

    for (const [model, modelMatrix] of modelsAndMatrices) {
      depthMapShader.bindVertices(model.mesh.buffer);
      depthMapShader.setModelMatrix(modelMatrix)
      gl.drawArrays(gl.TRIANGLES, 0, model.mesh.length);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
    gl.cullFace(gl.BACK);

    phongShader.use();
    phongShader.setTextureId(0);
    phongShader.setShadowMapId(1);
    phongShader.setProjectionMatrix(this.projectionMatrix);
    phongShader.setViewMatrix(this.viewMatrix);
    phongShader.setLightspaceMatrix(lightspaceMatrix);
    phongShader.setCameraPosition(this.cameraPosition);
    phongShader.setLightPosition(this.lightPosition);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.depthMapTexture);

    for (const [model, modelMatrix, normalMatrix] of modelsAndMatrices) {
      phongShader.bindVertices(model.mesh.buffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, model.texture);
      phongShader.setShininess(model.shininess);
      phongShader.setModelMatrix(modelMatrix);
      phongShader.setNormalMatrix(normalMatrix);
      gl.drawArrays(gl.TRIANGLES, 0, model.mesh.length);
    }
  }
}

class Model {
  public mesh: Mesh;
  public texture: Texture;
  public shininess: number;
  public position: vec3;
  public rotation: quat;
  public scale: number;

  constructor(mesh: Mesh, texture: Texture, shininess: number) {
    this.mesh = mesh;
    this.texture = texture;
    this.shininess = shininess;
    this.position = vec3.create();
    this.rotation = quat.create();
    this.scale = 1;
  }

  public modelAndNormalMatrices() {
    const scaleVector = vec3.fromValues(this.scale, this.scale, this.scale);
    const modelMatrix = mat4.fromRotationTranslationScale(mat4.create(), this.rotation, this.position, scaleVector);
    const normalMatrix = mat4.invert(mat4.create(), modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    return [modelMatrix, normalMatrix];
  }
}
