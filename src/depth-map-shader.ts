import { mat4, vec3 } from "gl-matrix";

import { Shader } from "./shader";

const VERTEX_SHADER_SOURCE = `
  uniform mat4 lightspaceMatrix;
  uniform mat4 modelMatrix;

  attribute vec3 position;

  void main() {
    gl_Position = lightspaceMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = "void main() { }";

const SIZEOF_FLOAT = 4;

export class DepthMapShader extends Shader {
  private positionAttrib: number;
  private lightspaceMatrixUniform: WebGLUniformLocation;
  private modelMatrixUniform: WebGLUniformLocation;

  constructor(gl: WebGLRenderingContext) {
    super(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

    this.positionAttrib = this.getAttribLocation("position");
    this.lightspaceMatrixUniform = this.getUniformLocation("lightspaceMatrix");
    this.modelMatrixUniform = this.getUniformLocation("modelMatrix");
  }

  public bindVertices(buffer: WebGLBuffer) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(this.positionAttrib);
    gl.vertexAttribPointer(this.positionAttrib, 3, this.gl.FLOAT, false, SIZEOF_FLOAT * 8, 0);
  }

  public setLightspaceMatrix(lightspaceMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.lightspaceMatrixUniform, false, lightspaceMatrix);
  }

  public setModelMatrix(modelMatrix: mat4) {
    this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);
  }
}
