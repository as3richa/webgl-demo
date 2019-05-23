import { mat4, vec3 } from "gl-matrix";

import { Shader } from "./shader";

window.addEventListener("load", () => {
  const canvasElement = document.createElement("canvas");

  document.body.appendChild(canvasElement);

  const gl = canvasElement.getContext("webgl");

  if (gl === null) {
    throw new Error("canvas.getContext('webgl') returned null; WebGL isn't supported by this browser");
  }

  const resizeCanvasElement = () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
  };
  resizeCanvasElement();
  window.addEventListener("resize", resizeCanvasElement);

  const shader = new Shader(gl);
  shader.use();

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

  shader.setColor(0, 0, 0);
  shader.bindPosition();

  const animationStartedAt = performance.now();

  const drawFrame = () => {
    const deltaTime = performance.now() - animationStartedAt;
    const modelYRotation = 2 * Math.PI * deltaTime / 6000;
    const cameraPitch = 0.1 * Math.sin(2 * Math.PI * deltaTime / 5000);
    const cameraYaw = 0.1 * Math.cos(2 * Math.PI * deltaTime / 10000);

    shader.setProjection(Math.PI / 6, canvasElement.width / canvasElement.height);
    shader.setCamera(vec3.fromValues(0, 0, 10), cameraPitch, cameraYaw);
    shader.setModelMatrix(mat4.fromYRotation(mat4.create(), modelYRotation));

    gl.drawElements(gl.LINES, cubeIndices.length, gl.UNSIGNED_BYTE, 0);

    requestAnimationFrame(drawFrame);
  };
  drawFrame();
});
