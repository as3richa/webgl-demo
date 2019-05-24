const CUBE_VERTICES = [
  [0, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 0, 0],
  [1, 0, 1],
  [1, 1, 0],
  [1, 1, 1],
];

const CUBE_FACES = [
  {
    vertices: [0, 1, 2, 3],
    normal: [-1, 0, 0],
  },
  {
    vertices: [4, 5, 6, 7],
    normal: [1, 0, 0],
  },
  {
    vertices: [0, 1, 4, 5],
    normal: [0, -1, 0],
  },
  {
    vertices: [2, 3, 6, 7],
    normal: [0, 1, 0],
  },
  {
    vertices: [0, 2, 4, 6],
    normal: [0, 0, -1],
  },
  {
    vertices: [1, 3, 5, 7],
    normal: [0, 0, 1],
  },
];

let glVertices = [];

for(let face of CUBE_FACES) {
  for(let i of [0, 1, 2, 1, 2, 3]) {
    const index = face.vertices[i];
    glVertices = glVertices.concat(CUBE_VERTICES[index].map(component => component - 0.5));
    glVertices = glVertices.concat(face.normal);
  }
}

let textureCoordinates = [];

for(let i = 0; i < 6; i ++) {
  textureCoordinates = textureCoordinates.concat([0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1]);
}

export const VERTICES = Float32Array.from(glVertices);
export const TEXTURE_COORDINATES = Float32Array.from(textureCoordinates);
