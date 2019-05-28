import { mat4, vec3 } from "gl-matrix";

const VERTEX_SHADER_SOURCE = `
  uniform mat4 projectionMatrix;
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
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    fragWorldspacePosition = (modelMatrix * vec4(position, 1.0)).xyz;
    fragNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
    fragTextureCoord = textureCoord;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform vec3 cameraPosition;
  uniform vec3 lightPosition;
  uniform float shininess;
  uniform sampler2D textureId;

  varying highp vec3 fragWorldspacePosition;
  varying highp vec3 fragNormal;
  varying highp vec2 fragTextureCoord;

  void main() {
    vec3 ambientColor = texture2D(textureId, fragTextureCoord).xyz;
    vec3 lightColor = vec3(1, 1, 0.95);
    vec3 lightDirection = normalize(lightPosition - fragWorldspacePosition);
    vec3 viewDirection = normalize(cameraPosition - fragWorldspacePosition);
    vec3 reflectedLightDirection = reflect(-lightDirection, fragNormal);

    float ambientStrength = 0.2;
    float diffuseStrength = 0.4 * max(dot(fragNormal, lightDirection), 0.0);
    float specularStrength = 0.7 * pow(max(dot(viewDirection, reflectedLightDirection), 0.0), shininess);
    vec3 color = (ambientStrength + diffuseStrength + specularStrength) * lightColor * ambientColor;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const SIZEOF_FLOAT = 4;

export class Shader {
  private gl: WebGLRenderingContext;

  private program: WebGLProgram;

  private positionAttr: number;
  private normalAttr: number;
  private textureCoordAttr: number;

  private projectionMatrixUniform: WebGLUniformLocation;
  private viewMatrixUniform: WebGLUniformLocation;
  private modelMatrixUniform: WebGLUniformLocation;
  private normalMatrixUniform: WebGLUniformLocation;

  private cameraPositionUniform: WebGLUniformLocation;
  private lightPositionUniform: WebGLUniformLocation;

  private shininessUniform: WebGLUniformLocation;

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
      gl.enableVertexAttribArray(location);
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

    this.projectionMatrixUniform = getUniformLocation("projectionMatrix");
    this.viewMatrixUniform = getUniformLocation("viewMatrix");
    this.modelMatrixUniform = getUniformLocation("modelMatrix");
    this.normalMatrixUniform = getUniformLocation("normalMatrix");
    this.cameraPositionUniform = getUniformLocation("cameraPosition");
    this.lightPositionUniform = getUniformLocation("lightPosition");
    this.shininessUniform = getUniformLocation("shininess")
    this.textureIdUniform = getUniformLocation("textureId");
  }

  public use() {
    this.gl.useProgram(this.program);
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

  public bindVertices(buffer: WebGLBuffer) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.vertexAttribPointer(this.positionAttr, 3, this.gl.FLOAT, false, SIZEOF_FLOAT * 8, 0);
    this.gl.vertexAttribPointer(this.normalAttr, 3, this.gl.FLOAT, false, SIZEOF_FLOAT * 8, SIZEOF_FLOAT * 3);
    this.gl.vertexAttribPointer(this.textureCoordAttr, 2, this.gl.FLOAT, false, SIZEOF_FLOAT * 8, SIZEOF_FLOAT * 6);
  }

  public bindTexture(texture: WebGLTexture) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
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
