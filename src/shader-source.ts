export const vertexShaderSource = `
  uniform mat4 proj;
  uniform mat4 view;
  uniform mat4 model;
  attribute vec3 position;

  void main() {
    gl_Position = proj * view * model * vec4(position, 1.0);
  }
`;

export const fragmentShaderSource = `
  precision highp float;

  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;
