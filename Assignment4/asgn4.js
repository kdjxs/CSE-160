// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main(){
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        v_Normal = normalize(vec3(u_normalMatrix * vec4(a_Normal,1)));
        // v_Normal = normalize(vec3(u_ModelMatrix * vec4(a_Normal, 1)));
        v_VertPos = u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    uniform vec4 u_FragColor;
    uniform vec3 u_cameraPos;
    uniform sampler2D u_Sampler0;
    uniform vec3 u_lightPos;
    uniform bool u_lightOn;
    uniform vec3 u_spotPos;
    uniform vec3 u_spotDir;
    uniform float u_spotCutoff;
    uniform bool u_spotOn;
    varying vec4 v_VertPos;
    uniform int u_whichTexture;
    void main(){
        if (u_whichTexture == -3){
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -2){
            gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
        } else if (u_whichTexture == -1){
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        } else if (u_whichTexture == 0){
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else {
            gl_FragColor = vec4(1, .2, .2, 1);
        }

        vec3 baseColor = vec3(gl_FragColor);
        vec3 N = normalize(v_Normal);
        vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

        // Point light
        vec3 pointResult = baseColor * 0.3; // ambient only by default
        if (u_lightOn) {
            vec3 L = normalize(u_lightPos - vec3(v_VertPos));
            float nDotL = max(dot(N, L), 0.0);
            vec3 R = reflect(-L, N);
            float spec = pow(max(dot(E, R), 0.0), 10.0);
            vec3 diffuse = baseColor * nDotL;
            vec3 ambient = baseColor * 0.3;
            pointResult = diffuse + ambient + spec * 0.3;
        }

        //Spot light
        vec3 spotResult = vec3(0.0);
        if (u_spotOn) {
            vec3 toFrag = normalize(vec3(v_VertPos) - u_spotPos);
            vec3 spotDirN = normalize(u_spotDir);
            float angle = dot(toFrag, spotDirN);
            float cutoff = cos(radians(u_spotCutoff));
            if (angle > cutoff) {
                vec3 L = normalize(u_spotPos - vec3(v_VertPos));
                float nDotL = max(dot(N, L), 0.0);
                vec3 R = reflect(-L, N);
                float spec = pow(max(dot(E, R), 0.0), 10.0);
                float intensity = (angle - cutoff) / (1.0 - cutoff);
                spotResult = (baseColor * nDotL + spec * 0.5) * intensity;
            }
        }

        gl_FragColor = vec4(pointResult + spotResult, 1.0);
    }`

// Global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
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
let g_animOn = false;

let g_lightOn = false;

let u_normalMatrix;

let g_normalOn = false;

let g_lightPos = [0, 1, -2];

let u_spotPos;
let u_spotDir;
let u_spotCutoff;
let u_spotOn;
let g_spotPos = [0, 2, 0];
let g_spotDir = [0, -1, 0];
let g_spotOn  = false;

let g_lowerM = 0;
let g_earLeft = 0;
let g_earRight = 0;
let g_leftArm = 0;
let g_leftArmL = 0;
let g_rightArm = 0;
let g_rightArmL = 0;
let g_rightHand = 0;
let g_leftHand = 0;
let g_leftFoot = 0;
let g_rightFoot = 0;
let g_pandaAnim = false;
let g_poke = false;
let g_pokeStart = 0;

let g_model;
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
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    u_normalMatrix = gl.getUniformLocation(gl.program, 'u_normalMatrix');
    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    u_spotPos = gl.getUniformLocation(gl.program, 'u_spotPos');
    u_spotDir = gl.getUniformLocation(gl.program, 'u_spotDir');
    u_spotCutoff = gl.getUniformLocation(gl.program, 'u_spotCutoff');
    u_spotOn = gl.getUniformLocation(gl.program, 'u_spotOn');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
    u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');

    var identityM = new Matrix4();
    globalRotMat = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {
    // Button events
    document.getElementById('normOn').onclick = function() {g_normalOn=true};
    document.getElementById('normOff').onclick = function() {g_normalOn=false};
    document.getElementById('animOn').onclick = function() {g_animOn=true};
    document.getElementById('animOff').onclick = function() {g_animOn=false};
    document.getElementById('lightOn').onclick = function() {g_lightOn=true};
    document.getElementById('lightOff').onclick = function() {g_lightOn=false};

    document.getElementById('spotOn').onclick  = function() { g_spotOn = true; };
    document.getElementById('spotOff').onclick = function() { g_spotOn = false; };

    document.getElementById('onB').onclick  = function() { g_pandaAnim = true; };
    document.getElementById('offB').onclick = function() { g_pandaAnim = false; };
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

    // Light slider
    document.getElementById('lightSlideX').addEventListener('mousemove', function (ev) { if (ev.buttons == 1) { g_lightPos[0] = this.value/100;renderAllShapes();}});
    document.getElementById('lightSlideY').addEventListener('mousemove', function (ev) { if (ev.buttons == 1) { g_lightPos[1] = this.value/100;renderAllShapes();}});
    document.getElementById('lightSlideZ').addEventListener('mousemove', function (ev) { if (ev.buttons == 1) { g_lightPos[2] = this.value/100;renderAllShapes();}});

    document.getElementById('cameraSlide').addEventListener('input', function () {
        g_globalAngle = this.value;
        renderAllShapes();
    });

}

var g_startTime = performance.now()/1000.0;

var g_seconds = performance.now()/1000.0-g_startTime;

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

function updateAnimationAngles(){
    if (!g_animOn) return;
    seconds = performance.now() / 1000.0 - g_startTime;
    g_lightPos[0] = 3 * Math.cos(seconds);
    // poke animation
    if (g_poke) {
        let t = performance.now() / 1000.0 - g_pokeStart;
        if (t > 5) {
            g_poke = false;
        } else {
            g_rightArmL = -360 * Math.sin(t * 2);
            g_leftArm   =   90 * Math.sin(t * 2);
            g_leftArmL  =  360 * Math.sin(t * 2);
            g_leftHand  =   90 * Math.sin(t * 3);
            g_leftFoot  =   10 * Math.sin(t * 2);
            g_rightFoot =    5 * Math.sin(t * 3);
            g_lowerM    =    6 * Math.sin(t * 4);
        }
        return;
    }

    // panda idle animation
    if (g_pandaAnim) {
        var seconds = performance.now() / 1000.0 - g_startTime;
        const s = Math.sin(seconds);
        g_lowerM    =   5 * s;
        g_earLeft   =  15 * s;
        g_earRight  =  15 * s;
        g_leftArm   = 110 * s;
        g_leftArmL  =  90 * s;
        g_leftHand  =  45 * s;
        g_rightArmL =   2 * s;
        g_leftFoot  =   7 * s;
        g_rightFoot =   7 * s;
    }
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

    Object.values(bodyParts).forEach(p => p.textureNum = -3);
}


function renderAllShapes() {
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

    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(new Matrix4());
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_normalMatrix, false, normalMatrix.elements);

    globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.uniform3f(u_spotPos, g_spotPos[0], g_spotPos[1], g_spotPos[2]);
    gl.uniform3f(u_spotDir, g_spotDir[0], g_spotDir[1], g_spotDir[2]);
    gl.uniform1f(u_spotCutoff, 40.0);
    gl.uniform1i(u_spotOn, g_spotOn);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(u_cameraPos, 
    camera.eye.elements[0], 
    camera.eye.elements[1], 
    camera.eye.elements[2]);

    gl.uniform1i(u_lightOn, g_lightOn);
    // light
    var light = new Cube();
    light.color = [2, 2, 0, 1];
    light.textureNum = -3;
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-.1, -.1, -.1);
    light.matrix.translate(-.5, -.5, -.5);
    light.render();

    g_model.matrix.setIdentity();
    g_model.color = [1.0, 1.0, 1.0, 1.0];
    g_model.matrix.translate(-1, 0, 0);
    g_model.matrix.scale(0.1, 0.1, 0.1);
    g_model.render();
    // floor
    // var body = new Cube();
    // body.color = [1.0, 0.0, 0.0, 1.0];
    // body.textureNum = -3;
    // body.matrix.translate(0, -2.49, 0.0);
    // body.matrix.scale(10, 0.01, 10);
    // body.matrix.translate(-.5, 0, -.5);
    // body.render();

    // // sky
    // var sky = new Cube();
    // sky.color = [.8, 0.8, 0.8, 1.0];
    // sky.textureNum = -3;
    // if (g_normalOn) sky.textureNum = -2;
    // sky.matrix.translate(0, -2.49, 0.0);
    // sky.matrix.scale(-5, -5, -5);
    // sky.matrix.translate(-.5, -.5, -.5);
    // sky.render();

    // let cube = new Cube();
    // cube.matrix.scale(.5,.5,.5);
    // cube.matrix.translate(-1, -5, -1);
    // //cube.render();

    // let sphere = new Sphere();
    // sphere.color = [0, 0, 0, 1.0];
    // if (g_normalOn) sphere.textureNum = -2;
    // sphere.matrix.scale(.5,.5,.5);
    // sphere.matrix.translate(-1, -4, -1);
    // sphere.render();

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

    const duration = performance.now() - g_startTime;
    if (numDotElement) {
        numDotElement.innerHTML = `Render: ${Math.floor(duration)}ms | FPS: ${Math.floor(1000 / Math.max(duration, 1))}`;
    }
}

function tick() {
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();

    g_model = new Model();
    g_model.color = [0.8, 0.5, 0.3, 1.0];
    g_model.loadFromURL('lib/bunny.obj');

    camera  = new Camera(canvas);

    camera.eye.elements[0] = -2.5; 
    camera.eye.elements[1] = 0;
    camera.eye.elements[2] = 5;
    camera.at.elements[0]  = 0;
    camera.at.elements[1]  = 0;
    camera.at.elements[2]  = 0;

    initializeBodyParts();
    addActionsForHtmlUI();

    numDotElement = document.getElementById('numdot');
    gl.clearColor(0.1, 0.1, 0.2, 1);

    requestAnimationFrame(tick);
}