import { mat4, vec3 } from "gl-matrix";

const VERTEX_SHADER_SOURCE = `
  uniform mat4 projMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 modelMatrix;
  uniform mat4 normalMatrix;

  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 textureCoord;

  varying highp vec3 fragWorldspacePosition;
  varying highp vec3 fragNormal;
  varying highp vec2 fragTextureCoord;

  void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    fragWorldspacePosition = (modelMatrix * vec4(position, 1.0)).xyz;
    fragNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
    fragTextureCoord = textureCoord;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform vec3 cameraPosition;
  uniform vec3 lightPosition;
  uniform sampler2D textureId;

  varying highp vec3 fragWorldspacePosition;
  varying highp vec3 fragNormal;
  varying highp vec2 fragTextureCoord;

  void main() {
    vec3 lightColor = vec3(1, 1, 0.95);

    vec3 baseColor = texture2D(textureId, fragTextureCoord).xyz;

    float ambientStrength = 0.45;

    vec3 lightDirection = normalize(lightPosition - fragWorldspacePosition);
    float diffuseStrength = 0.75 * max(dot(fragNormal, lightDirection), 0.0);

    vec3 viewDirection = normalize(cameraPosition - fragWorldspacePosition);
    vec3 reflectedLightDirection = reflect(-lightDirection, fragNormal);
    float specularStrength = 0.7 * pow(max(dot(viewDirection, reflectedLightDirection), 0.0), 32.0);

    vec3 light = (ambientStrength + diffuseStrength + specularStrength) * lightColor;

    gl_FragColor = vec4(light * baseColor, 1.0);
  }
`;

export class Shader {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionAttr: number;
  private normalAttr: number;
  private textureCoordAttr: number;
  private projMatrixUniform: WebGLUniformLocation;
  private viewMatrixUniform: WebGLUniformLocation;
  private modelMatrixUniform: WebGLUniformLocation;
  private normalMatrixUniform: WebGLUniformLocation;
  private cameraPositionUniform: WebGLUniformLocation;
  private lightPositionUniform: WebGLUniformLocation;
  private textureIdUniform: WebGLUniformLocation;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const logs = gl.getShaderInfoLog(vertexShader);
      throw new ShaderError("Vertex shader failed to compile", VERTEX_SHADER_SOURCE, logs);
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const logs = gl.getShaderInfoLog(fragmentShader);
      throw new ShaderError("Fragment shader failed to compile", FRAGMENT_SHADER_SOURCE, logs);
    }

    const program = gl.createProgram();
    this.program = program;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new ShaderError("Shader program failed to link", null, gl.getProgramInfoLog(program));
    }

    gl.validateProgram(program);

    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      throw new ShaderError("Shader program failed to validate", null, gl.getProgramInfoLog(program));
    }

    const getAttrLocation = (name: string) => {
      const location = gl.getAttribLocation(program, name);
      if (location === -1) {
        throw new ShaderError(`Couldn't find attribute location for '${name}'`);
      }
      return location;
    };

    this.positionAttr = getAttrLocation("position");
    this.normalAttr = getAttrLocation("normal");
    this.textureCoordAttr = getAttrLocation("textureCoord");

    if (this.positionAttr === -1) {
      throw new ShaderError("Couldn't find attribute location for 'position'");
    }

    const getUniformLocation = (name: string) => {
      const location = gl.getUniformLocation(program, name);
      if (location === null) {
        throw new ShaderError(`Couldn't find uniform location for '${name}'`);
      }
      return location;
    };

    this.projMatrixUniform = getUniformLocation("projMatrix");
    this.viewMatrixUniform = getUniformLocation("viewMatrix");
    this.modelMatrixUniform = getUniformLocation("modelMatrix");
    this.normalMatrixUniform = getUniformLocation("normalMatrix");
    this.cameraPositionUniform = getUniformLocation("cameraPosition");
    this.lightPositionUniform = getUniformLocation("lightPosition");
    this.textureIdUniform = getUniformLocation("textureId");
  }

  public use() {
    this.gl.useProgram(this.program);
  }

  public setProjection(verticalFieldOfView: number, aspectRatio: number) {
    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, verticalFieldOfView, aspectRatio, 1, 1000);
    this.gl.uniformMatrix4fv(this.projMatrixUniform, false, projMatrix);
  }

  public setCamera(position: vec3, pitch: number, yaw: number) {
    this.gl.uniform3fv(this.cameraPositionUniform, position);

    const negatedPosition = vec3.negate(vec3.create(), position);
    const translationMatrix = mat4.fromTranslation(mat4.create(), negatedPosition);

    const pitchMatrix = mat4.fromXRotation(mat4.create(), -1 * pitch);
    const yawMatrix = mat4.fromYRotation(mat4.create(), yaw);

    const viewMatrix = pitchMatrix;
    mat4.mul(viewMatrix, viewMatrix, yawMatrix);
    mat4.mul(viewMatrix, viewMatrix, translationMatrix);

    this.gl.uniformMatrix4fv(this.viewMatrixUniform, false, viewMatrix);
  }

  public setModelMatrix(modelMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);

    const normalMatrix = mat4.invert(mat4.create(), modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    this.gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix);
  }

  public setLightPosition(lightPosition: vec3) {
    this.gl.uniform3fv(this.lightPositionUniform, lightPosition);
  }

  public setTextureId(textureId: number) {
    this.gl.uniform1i(this.textureIdUniform, textureId);
  }

  public bindVertices(buffer: WebGLBuffer) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

    this.gl.enableVertexAttribArray(this.positionAttr);
    this.gl.vertexAttribPointer(this.positionAttr, 3, this.gl.FLOAT, false, 6 * 4, 0);

    this.gl.enableVertexAttribArray(this.normalAttr);
    this.gl.vertexAttribPointer(this.normalAttr, 3, this.gl.FLOAT, false, 6 * 4, 3 * 4);
  }

  public bindTextureCoordinates(buffer: WebGLBuffer) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.enableVertexAttribArray(this.textureCoordAttr);
    this.gl.vertexAttribPointer(this.textureCoordAttr, 2, this.gl.FLOAT, false, 0, 0);
  }
}

class ShaderError extends Error {
  constructor(message: string, shaderSource?: string, logs?: string) {
    let fullMessage = message;

    if (shaderSource) {
      fullMessage += `\n== Shader Source ==\n${shaderSource}`;
    }

    if (logs) {
      fullMessage += `\n== Logs ==\n${logs}`;
    }

    super(fullMessage);
  }
}
