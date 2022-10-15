const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouseDown = false;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let tool = "pen";

window.addEventListener("resize", (event) => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

document.addEventListener("mousedown", (event) => {
	mouseDown = true;
});

document.addEventListener("mouseup", (event) => {
	mouseDown = false;
});

document.addEventListener("mousemove", (event) => {
	handleMouseMove(event.x, event.y);
});

function preventDefault(e) {
	e.preventDefault();
}

document.addEventListener('touchstart', (event) => {
  document.body.addEventListener('touchmove', preventDefault, { passive: false });
  mouseDown = true;
	prevMouseX = event.targetTouches[0].screenX;
	prevMouseY = event.targetTouches[0].screenY;
	mouseX = event.targetTouches[0].screenX;
	mouseY = event.targetTouches[0].screenY;
});

document.addEventListener('touchend', (event) => {
  mouseDown = false;
});

document.addEventListener('touchmove', (event) => {
  document.body.addEventListener('touchmove', preventDefault, { passive: false });
	handleMouseMove(event.targetTouches[0].screenX, event.targetTouches[0].screenY);
});

function handleMouseMove(x, y) {
	if(mouseDown) {
		prevMouseX = mouseX;
		prevMouseY = mouseY;
		mouseX = x;
		mouseY = y;

		if(tool === "pen") {
			drawLine(prevMouseX, prevMouseY, mouseX, mouseY);
		}
		else if(tool === "eraser") {
			clearCircle();
		}
	}
	else {
		prevMouseX = x;
		prevMouseY = y;
		mouseX = x;
		mouseY = y;
	}
}

function drawLine(fromX, fromY, toX, toY) {
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.lineCap = "round";
	ctx.strokeStyle = document.getElementById("pencolor-input").value;
	ctx.lineWidth = document.getElementById("pen-width").value;
	ctx.stroke();
}

function clearCircle() {
	let radius = document.getElementById("pen-width").value;
	ctx.save();
	ctx.beginPath();
	ctx.arc(mouseX, mouseY, radius, 0, 2 * Math.PI, true);
	ctx.clip();
	ctx.clearRect(mouseX - radius, mouseY - radius, radius * 2, radius * 2);
	ctx.restore();
}

function clearScreen() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateCanvasColor() {
	canvas.style.backgroundColor = document.getElementById("canvascolor-input").value;
}

function updateSelectedTool() {
	tool = document.getElementById("tool-select").value;
}
