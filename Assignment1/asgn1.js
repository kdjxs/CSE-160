// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;
	uniform float u_Size;
	void main() {
		gl_Position = a_Position;
		gl_PointSize = u_Size;
	}`

// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;
	uniform vec4 u_FragColor;
	void main() {
		gl_FragColor = u_FragColor;
	}`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');
	//gl = getWebGLContext(canvas);
	gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
}

function connectVariablesToGLSL(){
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
		console.log('Failed to intialize shaders');
		return;
	}
	a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0){
		console.log('Failed to get the storage location of a_Position');
		return;
	}
	u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	if (!u_FragColor){
		console.log('Failed to get the storage location of u_FragColor');
		return;
	}
	u_Size = gl.getUniformLocation(gl.program, 'u_Size');
	if (!u_Size){
		console.log('Failed to get the storage location of u_Size');
		return;
	}
		
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals for UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSeg = 10;

function addActionsForHtmlUI(){
	// Buttons
	document.getElementById('green').onclick = function () {g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
	document.getElementById('red').onclick = function () {g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
	document.getElementById('clear').onclick = function () {g_shapesList = []; renderAllShapes(true);};

	document.getElementById('pointB').onclick = function () {g_selectedType = POINT};
	document.getElementById('triB').onclick = function () {g_selectedType = TRIANGLE};
	document.getElementById('circleB').onclick = function () {g_selectedType = CIRCLE};

	document.getElementById('catB').onclick = function () {drawCat()};
	// Color sliders
	document.getElementById('redSlide').addEventListener('mouseup', function(){g_selectedColor[0] = this.value/100;});
	document.getElementById('greenSlide').addEventListener('mouseup', function(){g_selectedColor[1] = this.value/100;});
	document.getElementById('blueSlide').addEventListener('mouseup', function(){g_selectedColor[2] = this.value/100;});
	// Size slider
	document.getElementById('sizeSlide').addEventListener('mouseup', function(){g_selectedSize = this.value;});

	document.getElementById('circleSlide').addEventListener('mouseup', function() {g_selectedSeg = this.value});
}

function main() {

	setupWebGL();
	addActionsForHtmlUI();
	connectVariablesToGLSL();

	// Register function (event handler) to be called on a mouse press
	canvas.onmousedown = click;
	canvas.onmousemove = function(ev) { if(ev.buttons == 1){ click(ev)}};
	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {
	let [x,y] = convertCoordEventToGL(ev);

	// Create and store new point
	let point;
	if (g_selectedType == POINT){
		point = new Point();
	}
	else if (g_selectedType == CIRCLE){
		point = new Circle();
		point.segments = g_selectedSeg;
	}
	else{
		point = new Triangle();
	}
	point.position=[x,y];
	point.color=g_selectedColor.slice();
	point.size=g_selectedSize;
	g_shapesList.push(point);

	renderAllShapes();
}

function convertCoordEventToGL(ev){
	var x = ev.clientX; // x coordinate of a mouse pointer
	var y = ev.clientY; // y coordinate of a mouse pointer
	var rect = ev.target.getBoundingClientRect();

	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

	return ([x, y]);
}

function renderAllShapes(shouldClear = false){
	var startTime = performance.now();
	// Clear <canvas>
	//gl.clear(gl.COLOR_BUFFER_BIT);
    if (shouldClear) {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

	var len = g_shapesList.length;
	for(var i = 0; i < len; i++) {
		g_shapesList[i].render();
	}
	var duration = performance.now() - startTime;
	sendTextToHTML("numdot: " + len + " ms: "+ Math.floor(duration) + "fps: "+ Math.floor(10000/duration)/10, "numdot" );
}

function sendTextToHTML(text, htmlID){
	var htmlElm = document.getElementById(htmlID);
	if (!htmlElm){
		console.log("Failed to get "+ htmlID + " from HTML");
		return;
	}
	htmlElm.innerHTML = text;
}

function drawCat(){
	g_shapesList = []; 
	renderAllShapes();
	for(let i = 0; i < 25; i++) {
		g_shapesList.push(new Triangle());
	}
// Ears
drawTriangleColor([0.3, 0.8, 0.1, 0.5, 0.3, 0.5], [205.0, 152.0, 6.0, 1.0]);
drawTriangleColor([-0.3, 0.8, -0.1, 0.5, -0.3, 0.5], [205.0, 152.0, 6.0, 1.0]);

// Head
drawTriangleColor([-0.3, 0.3, -0.1, 0.5, -0.3, 0.5], [205.0, 152.0, 6.0, 1.0]);
drawTriangleColor([0.3, 0.3, 0.1, 0.5, 0.3, 0.5], [205.0, 152.0, 6.0, 1.0]);

drawTriangleColor([-0.3, 0.3, -0.1, 0.3, -0.1, 0.5], [255.0, 255.0, 255.0, 1.0]);
drawTriangleColor([0.3, 0.3, 0.1, 0.3, 0.1, 0.5], [255.0, 255.0, 255.0, 1.0]);

drawTriangleColor([-0.1, 0.5, -0.1, 0.3, 0.1, 0.5], [255.0, 255.0, 255.0, 1.0]);
drawTriangleColor([0.1, 0.3, -0.1, 0.3, 0.1, 0.5], [255.0, 255.0, 255.0, 1.0]);

drawTriangleColor([-0.3, 0.3, -0.1, 0.3, -0.1, 0.1], [255.0, 255.0, 255.0, 1.0]);
drawTriangleColor([-0.3, 0.3, -0.3, 0.1, -0.1, 0.1], [205.0, 152.0, 6.0, 1.0]);

drawTriangleColor([-0.1, 0.1, -0.1, 0.3, 0.1, 0.1], [255.0, 255.0, 255.0, 1.0]);
drawTriangleColor([0.1, 0.1, -0.1, 0.3, 0.1, 0.5], [255.0, 255.0, 255.0, 1.0]);

drawTriangleColor([0.1, 0.1, 0.1, 0.3, 0.3, 0.3], [255.0, 255.0, 255.0, 1.0]);
//drawTriangleColor([0.1, 0.1, 0.1, 0.3, -0.1, 0.7], [255.0, 255.0, 255.0, 1.0]);

drawTriangleColor([0.3, 0.1, 0.3, 0.3, 0.1, 0.1], [205.0, 152.0, 6.0, 1.0]);

// Body
drawTriangleColor([-0.3, 0.1, -0.3, -0.6, 0.3, -0.6], [255.0, 255.0, 255.0, 1.0]);
drawTriangleColor([0.3, 0.1, -0.3, -0.6, 0.3, -0.6], [255.0, 255.0, 255.0, 1.0]);

drawTriangleColor([-0.3, 0.1, 0.0, -0.6, 0.3, 0.1], [205.0, 152.0, 6.0, 1.0]);

// Back legs
drawTriangleColor([-0.35, -0.55, -.45, -0.95, -.2, -0.6], [178.0, 132.0, 5.0, 1.0]);
drawTriangleColor([0.35, -0.55, .45, -0.95, .2, -0.6], [178.0, 132.0, 5.0, 1.0]);

// Front legs
drawTriangleColor([-0.3, -0.15, -0.2, -0.8, -0.15, -0.32], [205.0, 152.0, 6.0, 1.0]);
drawTriangleColor([0.3, -0.15, 0.2, -0.8, 0.15, -0.32], [205.0, 152.0, 6.0, 1.0]);

// Tail
drawTriangleColor([0.25, -0.53, 0.4, 0.1, 0.3, -0.55], [255.0, 255.0, 255.0, 1.0]);
drawTriangleColor([0.4, .5, 0.3, -0.55, .45, .45], [205.0, 152.0, 6.0, 1.0]);

// Nose
drawTriangleColor([0.0, 0.25, -0.05, 0.3, 0.05, 0.3], [255.0, 153.0, 204, 1.0]);

// Initials
drawTriangleColor([-.7, 0.5, -0.55, 0.6, -0.7, 0.7], [213.0, 24.0, 81, 1.0]);
drawTriangleColor([-0.67, 0.55, -0.60, 0.6, -0.67, 0.65], [0.0, 0.0, 0, 1.0]);

drawTriangleColor([-.5, 0.5, -0.5, 0.7, -0.47, 0.7], [213.0, 24.0, 81, 1.0]);
drawTriangleColor([-.47, 0.7, -0.43, 0.7, -0.49, 0.68], [213.0, 24.0, 81, 1.0]);
drawTriangleColor([-.47, 0.65, -0.43, 0.65, -0.50, 0.63], [213.0, 24.0, 81, 1.0]);
}
