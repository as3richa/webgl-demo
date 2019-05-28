import { mat4, vec3, quat } from "gl-matrix";

import { Scene } from './scene';
import { createWallTexture } from "./wall-texture";
import { VERTICES } from "./cube";

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
  const cubeModel = scene.createModel(cubeMesh, cubeTexture, 32);
  quat.fromEuler(cubeModel.rotation, 45, 45, 45);
  scene.addModel(cubeModel);

  let lightTexture;

  {
    const canvasElement = document.createElement("canvas");
    canvasElement.width = 1;
    canvasElement.height = 1;
    const ctx = canvasElement.getContext("2d");
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1);
    lightTexture = scene.createTexture(data);
  }

  const lightModel = scene.createModel(cubeMesh, lightTexture, 1);
  lightModel.scale = 0.2;
  scene.addModel(lightModel);

  scene.setCamera([0, 0, 10], 0, 0);

  const animationStartedAt = performance.now();

  const drawFrame = () => {
    const lightPosition = vec3.fromValues(0, 0, 3);
    vec3.rotateY(lightPosition, lightPosition, [0, 0, 0], (animationStartedAt - performance.now()) / 5000 * 2 * Math.PI);

    lightModel.position = lightPosition;

    scene.setLightPosition(lightPosition);
    scene.setProjection(Math.PI / 6, canvasElement.width / canvasElement.height);
    scene.render()
    requestAnimationFrame(drawFrame);
  };
  drawFrame();

  document.body.appendChild(canvasElement);
});
