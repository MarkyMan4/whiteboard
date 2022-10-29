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

// text variables
let isTyping = false;
let textTyped = ""; // keeps track of what characters were entered
let textX = 0;
let textY = 0;

window.addEventListener("resize", (event) => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

document.addEventListener("mousedown", (event) => {
	mouseDown = true;

	if(tool === "text") {
		isTyping = true;
		textTyped = "";
		textX = event.x;
		textY = event.y;
	}
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

document.addEventListener("keydown", (event) => {
	if(isTyping) {
		if(event.key === "Enter") {
			drawText();
			isTyping = false;
			drawingStates.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
		}
		else if(event.key.length === 1) {
			textTyped += event.key;
		}
	}
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
		else if(tool === "arrow") {
			mouseX = x;
			mouseY = y;

			// save what is currently drawn
			let drawing = drawingStates[drawingStates.length - 1];
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			// restore what was drawn prior to starting to draw a line, then draw the line on top of it
			ctx.putImageData(drawing, 0, 0);
			drawArrow(prevMouseX, prevMouseY, mouseX, mouseY);
		}
		else if(tool === "rect") {
			mouseX = x;
			mouseY = y;

			// save what is currently drawn
			let drawing = drawingStates[drawingStates.length - 1];
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.putImageData(drawing, 0, 0);

			drawRect(prevMouseX, prevMouseY, mouseX - prevMouseX, mouseY - prevMouseY);
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

function drawArrow(fromX, fromY, toX, toY) {
	// draw the main line
	drawLine(fromX, fromY, toX, toY);
	let rise = toY - fromY;
	let run = toX - fromX;

	let length = Math.sqrt(Math.pow(rise, 2) + Math.pow(run, 2));

	// normalize and scale to 10
	rise = (rise / length) * 15;
	run = (run / length) * 15;

	// translate to mouse position so it is the origin
	// rotate and draw supporting lines
	ctx.translate(toX, toY);
	ctx.rotate(150 * Math.PI / 180);
	drawLine(0, 0, run, rise);

	ctx.rotate(-300 * Math.PI / 180);
	drawLine(0, 0, run, rise);
	ctx.translate(-toX, -toY);

	ctx.setTransform(1,0,0,1,0,0);
}

function drawText() {
	let fontSize = document.getElementById("font-size").value;
	ctx.beginPath();
	ctx.font = `${fontSize}px Arial`;
	ctx.fillStyle = document.getElementById("pencolor-input").value;
	ctx.fillText(textTyped, textX, textY);

	// reset text after displaying
	textTyped = "";
}

// either ctx.stroke() or ctx.fill() based on what is selected
function strokeOrFillShape() {
	const isFilled = document.getElementById("fill-input").checked;

	if(isFilled) {
		ctx.fillStyle = document.getElementById("pencolor-input").value;
		ctx.fill();
	}
	else {
		ctx.strokeStyle = document.getElementById("pencolor-input").value;
		ctx.lineWidth = document.getElementById("pen-width").value;
		ctx.stroke();
	}
}

function drawRect(fromX, fromY, width, height) {
	ctx.beginPath();
	ctx.rect(fromX, fromY, width, height);
	strokeOrFillShape();
}

function drawCircle(x, y, radius) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
	strokeOrFillShape();
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

	// show font input if text tool selected
	if(tool === "text") {
		document.getElementById("font-input").style.display = "inline-block";
	}
	else {
		document.getElementById("font-input").style.display = "none";
	}
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
		document.getElementById("script-controls").style.display = "block";
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
			evalLine(tokens[1], tokens[2], tokens[3], tokens[4]);
			commandSuccess = true;
			break;
		case "rect":
			evalRect(tokens[1], tokens[2], tokens[3], tokens[4]);
			commandSuccess = true;
			break;
		case "square":
			evalSquare(tokens[1], tokens[2], tokens[3]);
			commandSuccess = true;
			break;
		case "csquare":
			evalSquare(tokens[1], tokens[2], tokens[3], true);
			commandSuccess = true;
			break;
		case "circle":
			evalCircle(tokens[1], tokens[2], tokens[3]);
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
		case "stroke":
			document.getElementById("fill-input").checked = false;
			break;
		case "fill":
			document.getElementById("fill-input").checked = true;
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

function evalLine(fromX, fromY, toX, toY) {
	let fromXVals = [fromX];
	let fromYVals = [fromY];
	let toXVals = [toX];
	let toYVals = [toY];

	if(fromX.includes(":")) {
		fromXVals = evalRange(fromX);
	}

	if(fromY.includes(":")) {
		fromYVals = evalRange(fromY);
	}

	if(toX.includes(":")) {
		toXVals = evalRange(toX);
	}

	if(toY.includes(":")) {
		toYVals = evalRange(toY);
	}

	for(let i = 0; i < fromXVals.length; i++) {
		for(let j = 0; j < fromYVals.length; j++) {
			for(let k = 0; k < toXVals.length; k++) {
				for(let l = 0; l < toYVals.length; l++) {
					drawLine(fromXVals[i], fromYVals[j], toXVals[k], toYVals[l]);
				}
			}
		}
	}
}

function evalRect(fromX, fromY, width, height) {
	let fromXVals = [fromX];
	let fromYVals = [fromY];
	let widthVals = [width];
	let heightVals = [height];

	if(fromX.includes(":")) {
		fromXVals = evalRange(fromX);
	}

	if(fromY.includes(":")) {
		fromYVals = evalRange(fromY);
	}

	if(width.includes(":")) {
		widthVals = evalRange(width);
	}

	if(height.includes(":")) {
		heightVals = evalRange(height);
	}

	for(let i = 0; i < fromXVals.length; i++) {
		for(let j = 0; j < fromYVals.length; j++) {
			for(let k = 0; k < widthVals.length; k++) {
				for(let l = 0; l < heightVals.length; l++) {
					drawRect(fromXVals[i], fromYVals[j], widthVals[k], heightVals[l]);
				}
			}
		}
	}
}

function evalSquare(x, y, size, centered=false) {
	let xVals = [x];
	let yVals = [y];
	let sizeVals = [size];

	if(x.includes(":")) {
		xVals = evalRange(x);
	}

	if(y.includes(":")) {
		yVals = evalRange(y);
	}

	if(size.includes(":")) {
		sizeVals = evalRange(size);
	}

	for(let i = 0; i < xVals.length; i++) {
		for(let j = 0; j < yVals.length; j++) {
			for(let k = 0; k < sizeVals.length; k++) {
				if(centered) {
					let halfSize = parseInt(sizeVals[k]) / 2;
					let startX = parseInt(xVals[i]) - halfSize;
					let startY = parseInt(yVals[j]) - halfSize;

					drawRect(startX, startY, sizeVals[k], sizeVals[k]);
				}
				else {
					drawRect(xVals[i], yVals[j], sizeVals[k], sizeVals[k]);
				}
			}
		}
	}
}

function evalCircle(x, y, radius) {
	let xVals = [x];
	let yVals = [y];
	let radiusVals = [radius];

	if(x.includes(":")) {
		xVals = evalRange(x);
	}

	if(y.includes(":")) {
		yVals = evalRange(y);
	}

	if(radius.includes(":")) {
		radiusVals = evalRange(radius);
	}

	for(let i = 0; i < xVals.length; i++) {
		for(let j = 0; j < yVals.length; j++) {
			for(let k = 0; k < radiusVals.length; k++) {
				drawCircle(xVals[i], yVals[j], radiusVals[k]);
			}
		}
	}
}

/*
	range expression is <start>:<end>:<increment>
	e.g. circle 10 10 10:100:10 draws 10 circles at (10, 10) with radius 10, 20, ..., 100
	
	returns list for range. e.g. 0:3 -> [0,1,2,3], 0:10:2 -> [0,2,4,6,8,10]
*/
function evalRange(rangeExpression) {
	let parts = rangeExpression.split(":");
	let start = 0;
	let end = 0;
	let increment = 1; // default increment is one
	
	if(parts.length == 1) {
		return parts[0];
	}
	
	if(parts.length >= 2) {
		start = parseInt(parts[0]);
		end = parseInt(parts[1]);
	}

	if(parts.length == 3) {
		increment = parseInt(parts[2]);
	}

	let vals = [];

	if(increment >= 0) {
		for(let i = start; i <= end; i += increment) {
			vals.push(i);
		}
	}
	else {
		for(let i = start; i >= end; i += increment) {
			vals.push(i);
		}
	}

	return vals;
}
