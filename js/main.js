const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {willReadFrequently: true});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let form = document.getElementById("command-form");
form.addEventListener("submit", handleCommand);

let mouseDown = false;
let mode = "normal";

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

			drawRect(prevMouseX, prevMouseY, mouseX, mouseY);
		}
		else if(tool === "circle") {
			mouseX = x;
			mouseY = y;

			// save what is currently drawn
			let drawing = drawingStates[drawingStates.length - 1];
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.putImageData(drawing, 0, 0);

			let run = Math.abs(mouseX - prevMouseX);
			let rise = Math.abs(mouseY - prevMouseY); 
			let radius = Math.sqrt(Math.pow(run, 2) + Math.pow(rise, 2));
			drawCircle(prevMouseX, prevMouseY, radius);
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

function drawRect(fromX, fromY, toX, toY) {
	ctx.beginPath();
	ctx.rect(fromX, fromY, toX - fromX, toY - fromY);
	ctx.strokeStyle = document.getElementById("pencolor-input").value;
	ctx.lineWidth = document.getElementById("pen-width").value;
	ctx.stroke();
}

function drawCircle(x, y, radius) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
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

function updateMode() {
	mode = document.getElementById("mode-select").value;

	if(mode === "normal") {
		document.getElementById("normal-controls").style.display = "inline-block";
		document.getElementById("command-controls").style.display = "none";
		document.getElementById("script-controls").style.display = "none";
	}
	else if(mode === "command") {
		document.getElementById("normal-controls").style.display = "none";
		document.getElementById("command-controls").style.display = "inline-block";
		document.getElementById("script-controls").style.display = "none";
	}
	else if(mode === "script") {
		document.getElementById("normal-controls").style.display = "none";
		document.getElementById("command-controls").style.display = "none";
		document.getElementById("script-controls").style.display = "inline-block";
	}
}

function saveDrawing() {
	const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
	window.location.href = image;
}

function runScript() {
	let commands = document.getElementById("script-input").value.split("\n");
	
	commands.forEach(cmd => {
		if(cmd.trim() != "") {
			let tokens = preprocessCommand(cmd);
			parseCommand(tokens);
		}
	});
}

function handleCommand(e) {
	e.preventDefault();

	let command = document.getElementById("command-input").value;
	document.getElementById("command-input").value = "";
	let tokens = preprocessCommand(command);

	parseCommand(tokens);
}

// split string into tokens
function preprocessCommand(command) {
	let parts = command.toLowerCase().split(" ");
	let tokens = [];

	parts.forEach(p => {
		if(p != "") {
			tokens.push(p);
		}
	});

	return tokens;
}

// given a list of tokens, determine what to do
function parseCommand(tokens) {
	let commandSuccess = false;

	switch(tokens[0]) {
		case "line":
			let lineFromX = tokens[1];
			let lineFromY = tokens[2];
			let lineToX = tokens[3];
			let lineToY = tokens[4];
			drawLine(lineFromX, lineFromY, lineToX, lineToY);
			commandSuccess = true;
			break;
		case "rect":
			let rectFromX = tokens[1];
			let rectFromY = tokens[2];
			let rectToX = tokens[3];
			let rectToY = tokens[4];
			drawRect(rectFromX, rectFromY, rectToX, rectToY);
			commandSuccess = true;
			break;
		case "circle":
			let x = tokens[1];
			let y = tokens[2];
			let radius = tokens[3];
			drawCircle(x, y, radius);
			commandSuccess = true;
			break;
		case "linewidth":
			if(parseInt(tokens[1])) {
				document.getElementById("pen-width").value = tokens[1];
			}
			break;
		case "color":
			document.getElementById("pencolor-input").value = tokens[1];
			break;
		case "undo":
			undo();
			break;
		case "clear":
			clearScreen();
			break;
	}

	if(commandSuccess) {
		drawingStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
	}
}
