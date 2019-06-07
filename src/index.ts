import { mat4, quat, vec3 } from "gl-matrix";

import { VERTICES } from "./cube";
import { Scene } from "./scene";
import { createWallTexture } from "./wall-texture";

window.addEventListener("load", () => {
  const canvasElement = document.createElement("canvas");

  let scene;

  {
    const gl = canvasElement.getContext("webgl");

    if (gl === null) {
      throw new Error("canvas.getContext('webgl') returned null; WebGL isn't supported by this browser");
    }

    scene = new Scene(gl);
  }

  const resizeCanvasElement = () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    scene.setViewport(canvasElement.width, canvasElement.height);
  };
  resizeCanvasElement();
  window.addEventListener("resize", resizeCanvasElement);

  const cubeMesh = scene.createMesh(VERTICES);
  const cubeTexture = scene.createTexture(createWallTexture());

  for(let i = 0; i < 4; i ++) {
    for(let j = 0; j < 4; j ++) {
      const cubeModel = scene.createModel(cubeMesh, cubeTexture, 32);
      vec3.copy(cubeModel.position, [2 * i - 3, 0, 2 * j - 3]);
      scene.addModel(cubeModel);
    }
  }

  let solidWhiteTexture;

  {
    const canvasElement = document.createElement("canvas");
    canvasElement.width = 1;
    canvasElement.height = 1;
    const ctx = canvasElement.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1);
    solidWhiteTexture = scene.createTexture(data);
  }

  const floorVertices = new Float32Array([
    -0.5, 0, -0.5, 0, 1, 0, 0, 0,
    -0.5, 0, 0.5, 0, 1, 0, 0, 1,
    0.5, 0, -0.5, 0, 1, 0, 1, 0,
    0.5, 0, -0.5, 0, 1, 0, 1, 0,
    -0.5, 0, 0.5, 0, 1, 0, 0, 1,
    0.5, 0, 0.5, 0, 1, 0, 1, 1,
  ]);

  const floorMesh = scene.createMesh(floorVertices);
  const floorModel = scene.createModel(floorMesh, solidWhiteTexture, 64);
  vec3.copy(floorModel.position, [0, -5, 0]);
  floorModel.scale = 100;
  scene.addModel(floorModel);

  scene.setCamera([3, 10, 3], -Math.PI / 2, -Math.PI / 3);
  scene.setLightPosition([0, 5, 1]);

  const animationStartedAt = performance.now();

  const drawFrame = () => {
    scene.setProjection(Math.PI / 6, canvasElement.width / canvasElement.height);
    scene.render();
    requestAnimationFrame(drawFrame);
  };
  drawFrame();

  document.body.appendChild(canvasElement);
});
