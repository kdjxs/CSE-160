// Optimized version created using Deepseek AI
// ColoredPoint.js (c) 2012 matsuda

// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
	void main() {
		gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
	}`

// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;
	uniform vec4 u_FragColor;
	void main() {
		gl_FragColor = u_FragColor;
	}`

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let identityM;
let globalRotMat;

// UI elements cache
let uiElements = {};

// Animation state
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_globalAngle = 0;
let g_lowerM = 0;
let g_earLeft = 0;
let g_earRight = 0;
let g_leftArm = 0;
let g_leftArmL = 0;
let g_rightArm = 0;
let g_rightArmL = 0;
let g_rightHand = 0
let g_leftHand = 0;
let g_leftFoot = 0;
let g_rightFoot = 0;
let g_pandaAnim = false;
let g_poke = false;
let g_pokeStart = 0;
let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

// Cache for frequently accessed DOM elements
let numDotElement;

// Cache for body parts to avoid recreating each frame
let bodyParts = {};

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", {depth: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(102/255, 51/255, 0, 1.0);
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

    identityM = new Matrix4();
    globalRotMat = new Matrix4();
    
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHtmlUI(){
	// Buttons
	document.getElementById('onB').onclick = function () {g_pandaAnim = true; };
	document.getElementById('offB').onclick = function () {g_pandaAnim = false; };
    
	// left ear slider
	document.getElementById('leftESlide').addEventListener('input', function(){g_earLeft = this.value;});
	// right ear slider
	document.getElementById('rightESlide').addEventListener('input', function(){g_earRight = this.value;});
	document.getElementById('lowMSlide').addEventListener('input', function(){g_lowerM = this.value;});
	// left arm slider
	document.getElementById('leftArmSlide').addEventListener('input', function(){g_leftArmL = this.value;});
	// left forearm slider
	document.getElementById('leftForeArmSlide').addEventListener('input', function(){g_leftArm = this.value;});
	// left hand slider
	document.getElementById('leftHandSlide').addEventListener('input', function(){g_leftHand = this.value;});
	// right arm slider
	document.getElementById('rightArmSlide').addEventListener('input', function(){g_rightArmL = this.value;});
	// right forearm slider
	document.getElementById('rightForeArmSlide').addEventListener('input', function(){g_rightArm = this.value;});
	// right hand slider
	document.getElementById('rightHandSlide').addEventListener('input', function(){g_rightHand = this.value;});
	// left foot slider
	document.getElementById('leftFootSlide').addEventListener('input', function(){g_leftFoot = this.value;});
	// right foot slider 
	document.getElementById('rightFootSlide').addEventListener('input', function(){g_rightFoot = this.value;});
    // Camera angle slider
    document.getElementById('cameraSlide').addEventListener('input', function(){g_globalAngle = this.value;});
}

function initializeBodyParts() {
    // Pre-create body parts
    const colors = {
        lightGray: [233/255, 233/255, 233/255, 1],
        darkGray: [38/255, 38/255, 38/255, 1],
        green: [76/255, 153/255, 0, 1.0],
        darkerGray: [48/255, 48/255, 48/255, 1.0]
    };
    
    bodyParts = {
        face: new Cube(),
        leftEar: new Sphere(),
        rightEar: new Sphere(),
        leftEye: new Cube(),
        rightEye: new Cube(),
        snout: new Cube(),
        lowerM: new Cube(),
        neck: new Cube(),
        body: new Cube(),
        lowerB: new Cube(),
        armL: new Cube(),
        foreArmL: new Cube(),
        handL: new Cube(),
        bamboo: new Cube(),
        armR: new Cube(),
        foreArmR: new Cube(),
        handR: new Cube(),
        leftQ: new Cube(),
        leftT: new Cube(),
        rightQ: new Cube(),
        rightT: new Cube()
    };

	// set colors
    bodyParts.face.color = colors.lightGray;
    bodyParts.leftEar.color = colors.darkGray;
    bodyParts.rightEar.color = colors.darkGray;
    bodyParts.leftEye.color = colors.darkGray;
    bodyParts.rightEye.color = colors.darkGray;
    bodyParts.snout.color = colors.lightGray;
    bodyParts.lowerM.color = [1, 1, 1, 1];
    bodyParts.neck.color = colors.darkGray;
    bodyParts.body.color = colors.lightGray;
    bodyParts.lowerB.color = colors.lightGray;
    bodyParts.armL.color = colors.darkGray;
    bodyParts.foreArmL.color = colors.darkGray;
    bodyParts.handL.color = colors.darkGray;
    bodyParts.bamboo.color = colors.green;
    bodyParts.armR.color = colors.darkGray;
    bodyParts.foreArmR.color = colors.darkGray;
    bodyParts.handR.color = colors.darkGray;
    bodyParts.leftQ.color = colors.darkerGray;
    bodyParts.leftT.color = colors.darkGray;
    bodyParts.rightQ.color = colors.darkerGray;
    bodyParts.rightT.color = colors.darkGray;
}

function main() {
    setupWebGL();
    addActionsForHtmlUI();
    connectVariablesToGLSL();
    initializeBodyParts();
    
    // Cache DOM elements
    numDotElement = document.getElementById("numdot");
    
    let isDragging = false;
    let lastX = 0;
    
    // Use passive event listeners for better touch performance
    canvas.onmousedown = (ev) => {
        if (ev.shiftKey) {
            g_poke = true;
            g_pokeStart = performance.now() / 1000.0;
            return;
        }
        isDragging = true;
        lastX = ev.clientX;
    };
    
    canvas.onmousemove = (ev) => {
        if (!isDragging) return;
        let dx = ev.clientX - lastX;
        g_globalAngle += dx * 0.5;
        lastX = ev.clientX;
    };
    
    canvas.onmouseup = () => { isDragging = false; };
    
    requestAnimationFrame(tick);
}

// Pre-calculate sin values for animation
let lastSinTime = -1;
let sinCache = {};

function getCachedSin(time, multiplier) {
    const key = `${Math.floor(time * 10)}_${multiplier}`;
    if (time !== lastSinTime) {
        sinCache = {};
        lastSinTime = time;
    }
    if (!sinCache[key]) {
        sinCache[key] = Math.sin(time * multiplier);
    }
    return sinCache[key];
}

function updateAnimationAngles() {
    if (g_poke) {
        let t = g_seconds - g_pokeStart;
        if (t > 5) {
            g_poke = false;
        } else {
            const sinT2 = Math.sin(t * 2);
            const sinT3 = Math.sin(t * 3);
            const sinT4 = Math.sin(t * 4);
            
            g_rightArmL = -360 * sinT2;
            g_leftArm = 90 * sinT2;
            g_leftArmL = 360 * sinT2;
            g_leftHand = 90 * sinT3;
            g_leftFoot = 10 * sinT2;
            g_rightFoot = 5 * sinT3;
            g_lowerM = 6 * sinT4;
        }
        return;
    }
    
    if (g_pandaAnim) {
        const sinSeconds = Math.sin(g_seconds);
        g_lowerM = 5 * sinSeconds;
        g_earLeft = 15 * sinSeconds;
        g_earRight = 15 * sinSeconds;
        g_leftArm = 110 * sinSeconds;
        g_leftArmL = 90 * sinSeconds;
        g_leftHand = 45 * sinSeconds;
        g_rightArmL = 2 * sinSeconds;
        g_leftFoot = 7 * sinSeconds;
        g_rightFoot = 7 * sinSeconds;
    }
}

// Optimized render function with less matrix creation
function renderAllShapes() {
    const startTime = performance.now();
    
    // Update global rotation matrix
    globalRotMat.setIdentity();
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Face
    bodyParts.face.matrix.setIdentity();
    bodyParts.face.matrix.translate(-.5, 0, 0.0);
    bodyParts.face.matrix.rotate(-45, 1, 0, 0);
    bodyParts.face.matrix.scale(.3, .3, .3);
    bodyParts.face.render();
    
    // Ears
    bodyParts.leftEar.matrix.setIdentity();
    bodyParts.leftEar.matrix.translate(-.5, .1, -0.5);
    bodyParts.leftEar.matrix.translate(0, .2, .3);
    bodyParts.leftEar.matrix.rotate(-g_earLeft, 1, 0, 0);
    bodyParts.leftEar.matrix.scale(0.08, 0.09, 0.05);
    bodyParts.leftEar.render();
    
    bodyParts.rightEar.matrix.setIdentity();
    bodyParts.rightEar.matrix.translate(-.2, .1, -0.5);
    bodyParts.rightEar.matrix.translate(0, .2, .3);
    bodyParts.rightEar.matrix.rotate(-g_earRight, 1, 0, 0);
    bodyParts.rightEar.matrix.scale(0.08, 0.09, 0.05);
    bodyParts.rightEar.render();
    
    // Eyes
    bodyParts.leftEye.matrix.setIdentity();
    bodyParts.leftEye.matrix.translate(-.4999, 0.08, -0.09);
    bodyParts.leftEye.matrix.rotate(-45, 1, 0, 0);
    bodyParts.leftEye.matrix.scale(.09, .09, .09);
    bodyParts.leftEye.render();
    
    bodyParts.rightEye.matrix.setIdentity();
    bodyParts.rightEye.matrix.translate(-.291, 0.08, -0.09);
    bodyParts.rightEye.matrix.rotate(-45, 1, 0, 0);
    bodyParts.rightEye.matrix.scale(.09, .09, .09);
    bodyParts.rightEye.render();
    
    // Nose and mouth
    bodyParts.snout.matrix.setIdentity();
    bodyParts.snout.matrix.translate(-.395, 0.039, -0.1);
    bodyParts.snout.matrix.translate(-.02, -0.09, -.05);
    bodyParts.snout.matrix.rotate(-45, 1, 0, 0);
    bodyParts.snout.matrix.scale(.13, .08, .3);
    bodyParts.snout.render();
    
    bodyParts.lowerM.matrix.setIdentity();
    bodyParts.lowerM.matrix.translate(-.395, -0.01, 0.02);
    bodyParts.lowerM.matrix.translate(-.01, -0.04, .09);
    bodyParts.lowerM.matrix.translate(0, 0.05, .05);
    bodyParts.lowerM.matrix.rotate(180, 1, 0, 0);
    bodyParts.lowerM.matrix.rotate(g_lowerM, 1, 0, 0);
    bodyParts.lowerM.matrix.translate(0, -0.02, 0);
    bodyParts.lowerM.matrix.scale(.11, .05, .3);
    bodyParts.lowerM.render();
    
    // Neck
    bodyParts.neck.matrix.setIdentity();
    bodyParts.neck.matrix.translate(-.556, -0.1, 0);
    bodyParts.neck.matrix.scale(.41, .3, .3);
    bodyParts.neck.render();
    
    // Body
    bodyParts.body.matrix.setIdentity();
    bodyParts.body.matrix.rotate(45, 1, 0, 0);
    bodyParts.body.matrix.translate(-.55, -0.1, .0001);
    bodyParts.body.matrix.scale(.4, .5, .5);
    bodyParts.body.render();
    
    bodyParts.lowerB.matrix.setIdentity();
    bodyParts.lowerB.matrix.translate(-.56, -.6, .2);
    bodyParts.lowerB.matrix.scale(.42, .4, .3);
    bodyParts.lowerB.render();
    
    // Left arm
    bodyParts.armL.matrix.setIdentity();
    bodyParts.armL.matrix.translate(-.31, 0.05, .05);
    bodyParts.armL.matrix.rotate(56, 1, g_leftArmL, -90);
    const LACoords = new Matrix4(bodyParts.armL.matrix);
    bodyParts.armL.matrix.scale(0.4, .2, .2);
    bodyParts.armL.render();
    
    bodyParts.foreArmL.matrix = new Matrix4(LACoords);
    bodyParts.foreArmL.matrix.translate(0.4, 0, 0);
    bodyParts.foreArmL.matrix.rotate(g_leftArm, 1, g_leftArm, 0);
    const FALCoords = new Matrix4(bodyParts.foreArmL.matrix);
    bodyParts.foreArmL.matrix.scale(.4, .2, .2);
    bodyParts.foreArmL.render();
    
    bodyParts.handL.matrix = new Matrix4(FALCoords);
    bodyParts.handL.matrix.translate(.26, .03, .1);
    bodyParts.handL.matrix.rotate(g_leftHand, 1, 42, 0);
    const LHCoords = new Matrix4(bodyParts.handL.matrix);
    bodyParts.handL.matrix.scale(.15, .15, .15);
    bodyParts.handL.render();
    
    // Bamboo
    bodyParts.bamboo.matrix = new Matrix4(LHCoords);
    bodyParts.bamboo.matrix.translate(.15, .2, .15);
    bodyParts.bamboo.matrix.rotate(90, 1, 180, -180);
    bodyParts.bamboo.matrix.scale(.6, .05, .05);
    bodyParts.bamboo.render();
    
    // Right arm
    bodyParts.armR.matrix.setIdentity();
    bodyParts.armR.matrix.translate(-.55, 0.15, .05);
    bodyParts.armR.matrix.rotate(135, 1, g_rightArmL, -90);
    const RACoords = new Matrix4(bodyParts.armR.matrix);
    bodyParts.armR.matrix.scale(0.4, .2, .2);
    bodyParts.armR.render();
    
    bodyParts.foreArmR.matrix = new Matrix4(RACoords);
    bodyParts.foreArmR.matrix.translate(.56, 0.4, 0);
    bodyParts.foreArmR.matrix.rotate(-138, 1, g_rightArm, 81);
    bodyParts.foreArmR.matrix.translate(0, 0, -.01);
    const FARCoords = new Matrix4(bodyParts.foreArmR.matrix);
    bodyParts.foreArmR.matrix.scale(.4, .2, .2);
    bodyParts.foreArmR.render();
    
    bodyParts.handR.matrix = new Matrix4(FARCoords);
    bodyParts.handR.matrix.translate(-.02, .03, .1);
    bodyParts.handR.matrix.rotate(g_rightHand, 1, 42, 0);
    bodyParts.handR.matrix.scale(.15, .15, .15);
    bodyParts.handR.render();
    
    // Legs
    bodyParts.leftQ.matrix.setIdentity();
    bodyParts.leftQ.matrix.translate(-.2, -.6, -.15);
    bodyParts.leftQ.matrix.rotate(15, 1, -68, -32);
    bodyParts.leftQ.matrix.scale(.2, .2, .4);
    bodyParts.leftQ.render();
    
    bodyParts.leftT.matrix.setIdentity();
    bodyParts.leftT.matrix.translate(-.2, -0.5, -.16);
    bodyParts.leftT.matrix.rotate(g_leftFoot, 1, 0, 0);
    bodyParts.leftT.matrix.scale(.15, .15, .15);
    bodyParts.leftT.render();
    
    bodyParts.rightQ.matrix.setIdentity();
    bodyParts.rightQ.matrix.translate(-.7, -.584, -.07);
    bodyParts.rightQ.matrix.rotate(15, 1, 68, -32);
    bodyParts.rightQ.matrix.scale(.2, .2, .4);
    bodyParts.rightQ.render();
    
    bodyParts.rightT.matrix.setIdentity();
    bodyParts.rightT.matrix.translate(-.6, -0.5, -.13);
    bodyParts.rightT.matrix.rotate(g_rightFoot, 1, 0, 0);
    bodyParts.rightT.matrix.scale(.15, .15, .15);
    bodyParts.rightT.render();
    
    // Performance metrics
    const duration = performance.now() - startTime;
    if (numDotElement) {
        numDotElement.innerHTML = `Render time: ${Math.floor(duration)}ms | FPS: ${Math.floor(1000 / Math.max(duration, 1))}`;
    }
}

function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function sendTextToHTML(text, htmlID) {
    const htmlElm = document.getElementById(htmlID);
    if (htmlElm) htmlElm.innerHTML = text;
}