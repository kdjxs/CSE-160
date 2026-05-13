// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main(){
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform sampler2D u_Sampler4;
    uniform sampler2D u_Sampler5;
    uniform int u_whichTexture;
    void main(){
        if (u_whichTexture == -2){
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1){
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        } else if (u_whichTexture == 0){
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1){
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        } else if (u_whichTexture == 2){
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        } else if (u_whichTexture == 3){
            gl_FragColor = texture2D(u_Sampler3, v_UV);
        } else if (u_whichTexture == 4){
            gl_FragColor = texture2D(u_Sampler4, v_UV);
        } else if (u_whichTexture == 5){
            gl_FragColor = texture2D(u_Sampler5, v_UV);
        } else {
            gl_FragColor = vec4(1, .2, .2, 1);
        }
    }`

// Global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_Sampler5;

let globalRotMat;
let camera;
let g_world;
let numDotElement;

let g_globalAngle = 0;
let g_gameWon = false;

// Mouse look state
let g_mouseDown = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", {depth: true});
    if (!gl) { console.log('Failed to get WebGL context'); return; }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders'); return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
    u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');

    var identityM = new Matrix4();
    globalRotMat = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix,        false, identityM.elements);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ViewMatrix,         false, identityM.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix,   false, identityM.elements);
}

function addActionsForHtmlUI() {
    document.getElementById('cameraSlide').addEventListener('input', function () {
        g_globalAngle = this.value;
        renderAllShapes();
    });

    document.addEventListener('keydown', keydown);

    // Mouse look: click canvas to lock pointer, then drag
    canvas.addEventListener('click', () => canvas.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            document.addEventListener('mousemove', onMouseMove);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
        }
    });
}

function onMouseMove(ev) {
    camera.mouseLook(-ev.movementX, -ev.movementY);
    renderAllShapes();
}

function initTextures() {
    var image0 = new Image();
    image0.onload = function () { loadTexture(image0, 0); }
    image0.src = 'images/placedObj.jpg';

    var image1 = new Image();
    image1.onload = function () { loadTexture(image1, 1); }
    image1.src = 'images/floor.jpg';

    var image2 = new Image();
    image2.onload = function () { loadTexture(image2, 2); }
    image2.src = 'images/sky.jpg';

    var image3 = new Image();
    image3.onload = function () { loadTexture(image3, 3); }
    image3.src = 'images/walls.jpg';

    var image4 = new Image();
    image4.onload = function () { loadTexture(image4, 4); }
    image4.src = 'images/fire.jpg';

    var image5 = new Image();
    image5.onload = function () { loadTexture(image5, 5); }
    image5.src = 'images/flag.jpg';
    return true;
}

function loadTexture(image, texUnit) {
    var texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (texUnit === 0) gl.uniform1i(u_Sampler0, 0);
    if (texUnit === 1) gl.uniform1i(u_Sampler1, 1);
    if (texUnit === 2) gl.uniform1i(u_Sampler2, 2);
    if (texUnit === 3) gl.uniform1i(u_Sampler3, 3);
    if (texUnit === 4) gl.uniform1i(u_Sampler4, 4);
    if (texUnit === 5) gl.uniform1i(u_Sampler5, 5);
    renderAllShapes();
}

function keydown(ev) {
    if (g_gameWon) return;

    if (ev.key === 'd') camera.moveRight();
    if (ev.key === 'a') camera.moveLeft();
    if (ev.key === 'w') camera.moveForward();
    if (ev.key === 's') camera.moveBackwards();
    if (ev.key === 'q') camera.panLeft(5);
    if (ev.key === 'e') camera.panRight(5);

    if (ev.key === 'f' || ev.key === 'F') {
        let placed = g_world.placeBlock(camera);
    }
    if (ev.key === 'g' || ev.key === 'G') {
        let removed = g_world.removeBlock(camera);
    }

    renderAllShapes();
    ev.preventDefault();
}


function renderAllShapes() {
    var startTime = performance.now();

    var projMat = new Matrix4();
    projMat.setPerspective(50, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();
    viewMat.setLookAt(
        camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
        camera.at.elements[0],  camera.at.elements[1],  camera.at.elements[2],
        camera.up.elements[0],  camera.up.elements[1],  camera.up.elements[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky box
    var sky = new Cube();
    sky.color = [1.0, 0.0, 0.0, 1.0];
    sky.textureNum = 2;
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(-.5, -.5, -.5);
    sky.render();

    g_world.drawMap();

    const duration = performance.now() - startTime;
    if (numDotElement) {
        numDotElement.innerHTML = `Render: ${Math.floor(duration)}ms | FPS: ${Math.floor(1000 / Math.max(duration, 1))}`;
    }
}

function tick() {
    renderAllShapes();
    requestAnimationFrame(tick);
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();

    camera  = new Camera(canvas);
    g_world = new World();

    camera.eye.elements[0] = -12; 
    camera.eye.elements[1] = 0.5;
    camera.eye.elements[2] = 0;
    camera.at.elements[0]  = 0;
    camera.at.elements[1]  = 0.5;
    camera.at.elements[2]  = 0;

    addActionsForHtmlUI();
    initTextures();

    numDotElement = document.getElementById('numdot');
    gl.clearColor(0.1, 0.1, 0.2, 1);

    requestAnimationFrame(tick);
}