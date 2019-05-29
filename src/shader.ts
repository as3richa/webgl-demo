export class Shader {
  protected gl: WebGLRenderingContext;
  private program: WebGLProgram;

  constructor(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
    this.gl = gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const logs = gl.getShaderInfoLog(vertexShader);
      const message = `Vertex shader failed to compile. Source:\n${vertexShaderSource}\nLogs:\n${logs}`;
      throw new Error(message);
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const logs = gl.getShaderInfoLog(fragmentShader);
      const message = `Fragment shader failed to compile. Source:\n${fragmentShaderSource}\nLogs:\n${logs}`;
      throw new Error(message);
    }

    const program = gl.createProgram();
    this.program = program;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const logs = gl.getProgramInfoLog(program);
      throw new Error(`Shader program failed to link. Logs:\n${logs}`);
    }

    gl.validateProgram(program);

    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      const logs = gl.getProgramInfoLog(program);
      throw new Error(`Shader program failed to validate. Logs:\n${logs}`);
    }
  }

  public use() {
    this.gl.useProgram(this.program);
  }

  protected getAttribLocation(name: string) {
    const location = this.gl.getAttribLocation(this.program, name);
    if (location === -1) {
      throw new Error(`Couldn't find attribute location for '${name}'`);
    }
    return location;
  }

  protected getUniformLocation(name: string) {
    const location = this.gl.getUniformLocation(this.program, name);
    if (location === null) {
      throw new Error(`Couldn't find uniform location for '${name}'`);
    }
    return location;
  }
}
