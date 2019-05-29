import { mat4, vec3 } from "gl-matrix";

import { Shader } from "./shader";

const VERTEX_SHADER_SOURCE = `
  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 modelMatrix;
  uniform mat4 normalMatrix;
  uniform mat4 lightspaceMatrix;

  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 textureCoord;

  varying highp vec3 worldspacePosition;
  varying highp vec4 lightspacePosition;
  varying highp vec3 transformedNormal;
  varying highp vec2 vTextureCoord;

  void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    worldspacePosition = (modelMatrix * vec4(position, 1.0)).xyz;
    lightspacePosition = lightspaceMatrix * modelMatrix * vec4(position, 1.0);
    transformedNormal = normalize((normalMatrix * vec4(normal, 1.0)).xyz);
    vTextureCoord = textureCoord;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform vec3 cameraPosition;
  uniform vec3 lightPosition;
  uniform float shininess;
  uniform sampler2D textureId;
  uniform sampler2D shadowMapId;

  varying highp vec3 worldspacePosition;
  varying highp vec4 lightspacePosition;
  varying highp vec3 transformedNormal;
  varying highp vec2 vTextureCoord;

  void main() {
    vec3 ambientColor = texture2D(textureId, vTextureCoord).rgb;
    vec3 lightColor = vec3(1, 1, 0.95);
    vec3 lightDirection = normalize(lightPosition - worldspacePosition);
    vec3 viewDirection = normalize(cameraPosition - worldspacePosition);
    vec3 reflectedLightDirection = reflect(-lightDirection, transformedNormal);

    vec3 projectedLightspacePosition = 0.5 * (lightspacePosition.xyz / lightspacePosition.w) + 0.5;
    float depth = projectedLightspacePosition.z;
    float closestDepthToLight = texture2D(shadowMapId, projectedLightspacePosition.xy).r;
    float fragIsLit = (depth <= closestDepthToLight + 1e-3)? 1.0 : 0.0;

    float ambientStrength = 0.2;
    float diffuseStrength = fragIsLit * 0.5 * max(dot(transformedNormal, lightDirection), 0.0);
    float specularStrength = fragIsLit * 0.5 * pow(max(dot(viewDirection, reflectedLightDirection), 0.0), shininess);
    vec3 color = (ambientStrength + diffuseStrength + specularStrength) * lightColor * ambientColor;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const SIZEOF_FLOAT = 4;

export class PhongShader extends Shader {
  private positionAttrib: number;
  private normalAttrib: number;
  private textureCoordAttrib: number;

  private projectionMatrixUniform: WebGLUniformLocation;
  private viewMatrixUniform: WebGLUniformLocation;
  private modelMatrixUniform: WebGLUniformLocation;
  private normalMatrixUniform: WebGLUniformLocation;
  private lightspaceMatrixUniform: WebGLUniformLocation;

  private cameraPositionUniform: WebGLUniformLocation;
  private lightPositionUniform: WebGLUniformLocation;

  private shininessUniform: WebGLUniformLocation;

  private textureIdUniform: WebGLUniformLocation;
  private shadowMapIdUniform: WebGLUniformLocation;

  constructor(gl: WebGLRenderingContext) {
    super(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

    this.positionAttrib = this.getAttribLocation("position");
    this.normalAttrib = this.getAttribLocation("normal");
    this.textureCoordAttrib = this.getAttribLocation("textureCoord");

    this.projectionMatrixUniform = this.getUniformLocation("projectionMatrix");
    this.viewMatrixUniform = this.getUniformLocation("viewMatrix");
    this.modelMatrixUniform = this.getUniformLocation("modelMatrix");
    this.normalMatrixUniform = this.getUniformLocation("normalMatrix");
    this.lightspaceMatrixUniform = this.getUniformLocation("lightspaceMatrix");

    this.cameraPositionUniform = this.getUniformLocation("cameraPosition");
    this.lightPositionUniform = this.getUniformLocation("lightPosition");
    this.shininessUniform = this.getUniformLocation("shininess");
    this.textureIdUniform = this.getUniformLocation("textureId");
    this.shadowMapIdUniform = this.getUniformLocation("shadowMapId");
  }

  public setProjectionMatrix(projectionMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.projectionMatrixUniform, false, projectionMatrix);
  }

  public setViewMatrix(viewMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.viewMatrixUniform, false, viewMatrix);
  }

  public setModelMatrix(modelMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);
  }

  public setNormalMatrix(normalMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix);
  }

  public setLightspaceMatrix(lightspaceMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.lightspaceMatrixUniform, false, lightspaceMatrix);
  }

  public setCameraPosition(cameraPosition: vec3) {
    this.gl.uniform3fv(this.cameraPositionUniform, cameraPosition);
  }

  public setLightPosition(lightPosition: vec3) {
    this.gl.uniform3fv(this.lightPositionUniform, lightPosition);
  }

  public setShininess(shininess: number) {
    this.gl.uniform1f(this.shininessUniform, shininess);
  }

  public setTextureId(textureId: number) {
    this.gl.uniform1i(this.textureIdUniform, textureId);
  }

  public setShadowMapId(shadowMapId: number) {
    this.gl.uniform1i(this.shadowMapIdUniform, shadowMapId);
  }

  public bindVertices(buffer: WebGLBuffer) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const attributes = [
      [this.positionAttrib, 3, 0],
      [this.normalAttrib, 3, 3],
      [this.textureCoordAttrib, 2, 6]
    ];

    for(const [location, size, offset] of attributes) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, SIZEOF_FLOAT * 8, SIZEOF_FLOAT * offset);
    }
  }
}
