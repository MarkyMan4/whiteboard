const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {willReadFrequently: true});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouseDown = false;

// keep track of whether something is currently being drawn, used for knowing whether to add to state list on mouseup
let isDrawing = false; 
let prevMouseX = 0;
let prevMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let tool = "pen";
let drawingStates = [ctx.getImageData(0, 0, canvas.width, canvas.height)]; // stack representing states of canvas, can be used for undo operation

window.addEventListener("resize", (event) => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

document.addEventListener("mousedown", (event) => {
	mouseDown = true;
});

document.addEventListener("mouseup", (event) => {
	mouseDown = false;

	if(isDrawing) {
		drawingStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); // mouseup adds to state stack
		isDrawing = false;
	}
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

	if(isDrawing) {
		drawingStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); // mouseup adds to state stack
		isDrawing = false;
	}
});

document.addEventListener('touchmove', (event) => {
	document.body.addEventListener('touchmove', preventDefault, { passive: false });
	handleMouseMove(event.targetTouches[0].screenX, event.targetTouches[0].screenY);
});

function handleMouseMove(x, y) {
	if(mouseDown) {
		isDrawing = true;

		if(tool === "pen") {
			updateMousePos(x, y);
			drawLine(prevMouseX, prevMouseY, mouseX, mouseY);
		}
		else if(tool === "eraser") {
			updateMousePos(x, y);
			clearCircle();
		}
		else if(tool === "line") {
			mouseX = x;
			mouseY = y;

			// save what is currently drawn
			let drawing = drawingStates[drawingStates.length - 1];
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			// restore what was drawn prior to starting to draw a line, then draw the line on top of it
			ctx.putImageData(drawing, 0, 0);
			drawLine(prevMouseX, prevMouseY, mouseX, mouseY);
		}
		else if(tool === "rect") {
			mouseX = x;
			mouseY = y;

			// save what is currently drawn
			let drawing = drawingStates[drawingStates.length - 1];
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.putImageData(drawing, 0, 0);
			ctx.beginPath();
			ctx.rect(prevMouseX, prevMouseY, mouseX - prevMouseX, mouseY - prevMouseY);
			ctx.strokeStyle = document.getElementById("pencolor-input").value;
			ctx.lineWidth = document.getElementById("pen-width").value;
			ctx.stroke();
		}
	}
	else {
		prevMouseX = x;
		prevMouseY = y;
		mouseX = x;
		mouseY = y;
	}
}

function updateMousePos(x, y) {
	prevMouseX = mouseX;
	prevMouseY = mouseY;
	mouseX = x;
	mouseY = y;
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
	drawingStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undo() {
	// should always have one item on stack (initial state)
	// clicking undo added one item, so pop it and return
	if(drawingStates.length <= 1) {
		return;
	}

	// pop the last item off state, then revert to the last item in the state list
	// need to pop twice since clicking undo adds to stack
	drawingStates.pop();

	ctx.putImageData(drawingStates[drawingStates.length - 1], 0, 0);
}

function updateCanvasColor() {
	canvas.style.backgroundColor = document.getElementById("canvascolor-input").value;
}

function updateSelectedTool() {
	tool = document.getElementById("tool-select").value;
}
