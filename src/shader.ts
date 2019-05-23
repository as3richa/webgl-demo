import { mat4, vec3 } from "gl-matrix";

const VERTEX_SHADER_SOURCE = `
  uniform mat4 proj;
  uniform mat4 view;
  uniform mat4 model;
  attribute vec3 position;

  void main() {
    gl_Position = proj * view * model * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class Shader {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionAttr: number;
  private projUniform: WebGLUniformLocation;
  private viewUniform: WebGLUniformLocation;
  private modelUniform: WebGLUniformLocation;
  private colorUniform: WebGLUniformLocation;

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

    this.positionAttr = gl.getAttribLocation(program, "position");

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

    this.projUniform = getUniformLocation("proj");
    this.viewUniform = getUniformLocation("view");
    this.modelUniform = getUniformLocation("model");
    this.colorUniform = getUniformLocation("color");
  }

  public use() {
    this.gl.useProgram(this.program);
  }

  public setProjection(verticalFieldOfView: number, aspectRatio: number) {
    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, verticalFieldOfView, aspectRatio, 1, 1000);
    this.gl.uniformMatrix4fv(this.projUniform, false, projMatrix);
  }

  public setCamera(position: vec3, pitch: number, yaw: number) {
    const negatedPosition = vec3.negate(vec3.create(), position);
    const translationMatrix = mat4.fromTranslation(mat4.create(), negatedPosition);

    const pitchMatrix = mat4.fromXRotation(mat4.create(), -1 * pitch);
    const yawMatrix = mat4.fromYRotation(mat4.create(), yaw);

    const viewMatrix = pitchMatrix;
    mat4.mul(viewMatrix, viewMatrix, yawMatrix);
    mat4.mul(viewMatrix, viewMatrix, translationMatrix);

    this.gl.uniformMatrix4fv(this.viewUniform, false, viewMatrix);
  }

  public setModelMatrix(modelMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.modelUniform, false, modelMatrix);
  }

  public setColor(red: number, green: number, blue: number) {
    this.gl.uniform3f(this.colorUniform, red, green, blue);
  }

  public bindPosition() {
    this.gl.enableVertexAttribArray(this.positionAttr);
    this.gl.vertexAttribPointer(this.positionAttr, 3, this.gl.FLOAT, false, 0, 0);
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
