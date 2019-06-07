const FACES = [
  {
    vertices: [
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
    ],
    normal: [1, 0, 0],
  },
  {
    vertices: [
      [-0.5, 0.5, -0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, -0.5, 0.5],
      [-0.5, -0.5, -0.5],
    ],
    normal: [-1, 0, 0],
  },
  {
    vertices: [
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
    ],
    normal: [0, 1, 0],
  },
  {
    vertices: [
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
    ],
    normal: [0, -1, 0],
  },
  {
    vertices: [
      [-0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [0.5, -0.5, 0.5],
      [-0.5, -0.5, 0.5],
    ],
    normal: [0, 0, 1],
  },
  {
    vertices: [
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
    ],
    normal: [0, 0, -1],
  },
];

const TEXTURE_COORDINATES = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

let cubeVertices = [];

for (const { vertices, normal } of FACES) {
  for(const index of [0, 2, 1, 0, 3, 2]) {
    cubeVertices = cubeVertices.concat(vertices[index], normal, TEXTURE_COORDINATES[index]);
  } 
}

export const VERTICES = Float32Array.from(cubeVertices);
