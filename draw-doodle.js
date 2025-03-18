export const canvas = document.getElementById('canvas');

const context = canvas.getContext('2d');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function startDrawing(event) {
  isDrawing = true;
  [lastX, lastY] = [event.offsetX, event.offsetY];
}

function draw(event) {
  if (!isDrawing) return;
  const x = event.offsetX;
  const y = event.offsetY;
  context.beginPath();
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.stroke();
  [lastX, lastY] = [x, y];
}

function stopDrawing() {
  isDrawing = false;
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);

export { clearCanvas };