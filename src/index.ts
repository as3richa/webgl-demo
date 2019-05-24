import { mat4, vec3 } from "gl-matrix";

import { Shader } from "./shader";
import { createWallTexture } from "./wall-texture";
import { VERTICES, TEXTURE_COORDINATES} from "./cube";

window.addEventListener("load", () => {
  const canvasElement = document.createElement("canvas");

  document.body.appendChild(canvasElement);

  const gl = canvasElement.getContext("webgl");

  if (gl === null) {
    throw new Error("canvas.getContext('webgl') returned null; WebGL isn't supported by this browser");
  }

  gl.enable(gl.DEPTH_TEST);

  const resizeCanvasElement = () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
  };
  resizeCanvasElement();
  window.addEventListener("resize", resizeCanvasElement);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

  const textureCoordinateBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, TEXTURE_COORDINATES, gl.STATIC_DRAW);

  const wallTexture = createWallTexture(gl);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);

  const shader = new Shader(gl);
  shader.use();
  shader.setTextureId(0);
  shader.bindVertices(vertexBuffer);
  shader.bindTextureCoordinates(textureCoordinateBuffer);

  shader.setCamera([0, 1, 10], 0, 0);
  shader.setLightPosition([0, 20, 20]);

  const animationStartedAt = performance.now();

  const drawFrame = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT);
    shader.setProjection(Math.PI / 6, canvasElement.width / canvasElement.height);
    shader.setModelMatrix(mat4.fromYRotation(mat4.create(), 2 * Math.PI * (performance.now() - animationStartedAt) / 6000));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    requestAnimationFrame(drawFrame);
  };
  drawFrame();
});
