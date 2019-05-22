import { mat4, vec3, vec4 } from "gl-matrix";

import { fragmentShaderSource, vertexShaderSource } from "./shader-source";

window.addEventListener("load", () => {
  const canvasElement = document.createElement("canvas");

  document.body.appendChild(canvasElement);

  const gl = canvasElement.getContext("webgl");

  if (gl === null) {
    console.error("canvas.getContext('webgl') returned null; WebGL isn't supported by this browser");
    return;
  }

  const resizeCanvasElement = () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
  };
  resizeCanvasElement();
  window.addEventListener("resize", resizeCanvasElement);

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  if (vertexShader === null) {
    return;
  }

  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (fragmentShader === null) {
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shader program failed to link");
    return;
  }

  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error("ERROR validating program!", gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  const positionAttr = gl.getAttribLocation(program, "position");
  const projUniform = gl.getUniformLocation(program, "proj");
  const viewUniform = gl.getUniformLocation(program, "view");
  const modelUniform = gl.getUniformLocation(program, "model");
  const colorUniform = gl.getUniformLocation(program, "color");

  console.log([
    positionAttr,
    projUniform,
    viewUniform,
    modelUniform,
    colorUniform,
  ]);

  const vertexBuffer = gl.createBuffer();

  const cubeVertices = Float32Array.from([
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5,
    0.5, 0.5, -0.5,
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttr);

  const indexBuffer = gl.createBuffer();

  const cubeIndices = Uint8Array.from([
    0, 1,
    0, 2,
    0, 4,
    1, 3,
    1, 5,
    2, 3,
    2, 6,
    3, 7,
    4, 5,
    4, 6,
    5, 7,
    6, 7,
  ]);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

  const origin = vec3.create();
  const up = vec3.fromValues(0, 1, 0);

  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, vec3.fromValues(3, 2.5, 2.2), origin, up);
  gl.uniformMatrix4fv(viewUniform, false, viewMatrix);
  gl.uniform3f(colorUniform, 0, 0, 0);

  const animationStartedAt = performance.now();

  const drawFrame = () => {
    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, Math.PI / 6, canvasElement.width / canvasElement.height, 1, 1000);
    gl.uniformMatrix4fv(projUniform, false, projMatrix);

    const rotation = (performance.now() - animationStartedAt) / 3000 * 2 * Math.PI;
    const modelMatrix = mat4.create();
    mat4.rotate(modelMatrix, modelMatrix, rotation, vec3.fromValues(0, 1, 0));
    gl.uniformMatrix4fv(modelUniform, false, modelMatrix);

    gl.drawElements(gl.LINES, cubeIndices.length, gl.UNSIGNED_BYTE, 0);
    requestAnimationFrame(drawFrame);
  };
  drawFrame();
});

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader failed to compile.");
    console.error(`== Source ==\n${source}`);
    console.error(`== Logs ==\n${gl.getShaderInfoLog(shader)}`);
    return null;
  }

  return shader;
}

function getAttributeLocations(gl: WebGLRenderingContext, program: WebGLProgram, attributeNames: string[]) {
  const result = [];

  for (const name of attributeNames) {
    const location = gl.getAttribLocation(program, name);

    if (location === -1) {
      console.log(`Failed to find location of attribute '${name}' in shader program`);
      return null;
    }

    result[name] = location;
  }

  return result;
}

function getUniformLocations(gl: WebGLRenderingContext, program: WebGLProgram, uniformNames: string[]) {
  const result = {};

  for (const name of uniformNames) {
    const location = gl.getUniformLocation(program, name);

    if (location === -1) {
      console.log(`Failed to find location of uniform '${name}' in shader program`);
      return null;
    }

    result[name] = location;
  }

  return result;
}
