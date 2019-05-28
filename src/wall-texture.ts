export function createWallTexture() {
  const canvasElement = document.createElement("canvas");

  canvasElement.width = 32;
  canvasElement.height = 32;

  const ctx = canvasElement.getContext("2d");

  ctx.fillStyle = "#aaa";
  ctx.fillRect(0, 0, 32, 32);

  const brickColors = [
    "#a43547",
    "#805531",
    "#bb3144",
    "#805531",
  ];

  const brickLengths = [
    [11, 11, 6],
    [10, 7, 11],
    [8, 10, 10],
    [11, 6, 11],
  ];

  let y = 1;

  for (let row = 0; row < 4; row ++) {
    const height = (row === 3) ? 6 : 7;

    let x = 1;

    for (let brick = 0; brick < 3; brick ++) {
      ctx.fillStyle = brickColors[(3 * row + brick) % brickColors.length];
      ctx.fillRect(x, y, brickLengths[row][brick], height);

      x += brickLengths[row][brick] + 1;
    }

    y += height + 1;
  }

  return ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
}
