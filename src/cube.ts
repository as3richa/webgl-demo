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

const FACE_VERTEX_TEXTURE_COORDINATES = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

let glVertices = [];

for(let face of CUBE_FACES) {
  for(let i of [0, 1, 2, 1, 2, 3]) {
    const index = face.vertices[i];
    glVertices = glVertices.concat(CUBE_VERTICES[index].map(component => component - 0.5));
    glVertices = glVertices.concat(face.normal);
    glVertices = glVertices.concat(FACE_VERTEX_TEXTURE_COORDINATES[i]);
  }
}

export const VERTICES = Float32Array.from(glVertices);
