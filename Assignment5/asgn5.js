import * as THREE from 'three';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js'; 
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

function main() {
    const canvas = document.querySelector('#c');

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene(); 
    {
        const cubeLoader = new THREE.CubeTextureLoader(); 
        const textureSky = cubeLoader.load([
            'images/side.png', // left
            'images/side.png', // right
            'images/sky.JPG', // up
            'images/ground.png', // down
            'images/side.png', // back
            'images/side.png', // front
        ]);
        scene.background = textureSky;
    }

    const loader = new THREE.TextureLoader();

    const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
    camera.position.set(0, 1, 5);

    class MinMaxGUIHelper {
        constructor(obj, minProp, maxProp, minDif) {
            this.obj = obj;
            this.minProp = minProp;
            this.maxProp = maxProp;
            this.minDif = minDif;
        }
        get min() {
            return this.obj[this.minProp];
        }
        set min(v) {
            this.obj[this.minProp] = v;
            this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
        }
        get max() {
            return this.obj[this.maxProp];
        }
        set max(v) {
            this.obj[this.maxProp] = v;
            this.min = this.min;  // this will call the min setter
        }
    }
    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }
        get value() {
            return '#' + this.object[this.prop].getHexString();
        }
        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }
    function loadColorTexture(path) {
        const texture = loader.load(path);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    const gltfLoader = new GLTFLoader();

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.5, 0);
    controls.update();

    // Audio
    const listener = new THREE.AudioListener();
    camera.add( listener );
    const sound = new THREE.Audio( listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'Audio/song.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.5 );
    });
    document.getElementById('startBtn').addEventListener('click', () => {
        sound.play();
        document.getElementById('startBtn').style.display = 'none';
    });


    // Plane stage
    const geometry = new THREE.PlaneGeometry(15, 15);
    const material = new THREE.MeshBasicMaterial({map: loadColorTexture('images/top.jpg')});
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.z = -5;
    plane.position.y = -0.001;
    scene.add(plane);

    // Plane front
    const planeGeo = new THREE.PlaneGeometry(50, 25);
    const planeLarge = new THREE.Mesh(planeGeo, material);
    planeLarge.rotation.x = -Math.PI / 2;
    planeLarge.position.z = 10;
    scene.add(planeLarge);

    // Plane left 
    const planeFGeo = new THREE.PlaneGeometry(26, 10);
    const planeF = new THREE.Mesh(planeFGeo, material);
    planeF.rotation.x = -Math.PI / 2;
    planeF.position.z = -7.5;
    planeF.position.x = -12;
    planeF.position.y = 0.001;
    scene.add(planeF);

    // Plane right
    const planeRGeo = new THREE.PlaneGeometry(26, 10);
    const planeR = new THREE.Mesh(planeRGeo, material);
    planeR.rotation.x = -Math.PI / 2;
    planeR.position.z = -7.5;
    planeR.position.x = 12;
    planeR.position.y = 0.01;
    scene.add(planeR);

    // Reflection back
    const refGeo = new THREE.PlaneGeometry( 20, 20 );
    const reflector = new Reflector( refGeo, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xc1cbcb
    } );
    reflector.position.x = -15;
    reflector.position.z = -12;
    scene.add(reflector);

    const reflector2 = new Reflector( refGeo, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xc1cbcb
    } );
    reflector2.position.x;
    reflector2.position.z = -12;
    scene.add(reflector2);

    const reflector3 = new Reflector( refGeo, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xc1cbcb
    } );
    reflector3.position.x = 15;
    reflector3.position.z = -12;
    scene.add(reflector3);

    // Not complete commented out to prevent lag
    // // Reflection side right
    // const reflectorSR = new Reflector( refGeo, {
    //     clipBias: 0.003,
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    //     color: 0xc1cbcb
    // } );
    // reflectorSR.rotation.y = -Math.PI/2;
    // reflectorSR.position.x = 25;
    // reflectorSR.position.z = -8;
    // scene.add(reflectorSR);
    // const reflectorSR2 = new Reflector( refGeo, {
    //     clipBias: 0.003,
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    //     color: 0xc1cbcb
    // } );
    // reflectorSR2.rotation.y = -Math.PI/2;
    // reflectorSR2.position.x = 25;
    // reflectorSR2.position.z;
    // scene.add(reflectorSR2);
    // const reflectorSR3 = new Reflector( refGeo, {
    //     clipBias: 0.003,
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    //     color: 0xc1cbcb
    // } );
    // reflectorSR3.rotation.y = -Math.PI/2;
    // reflectorSR3.position.x = 25;
    // reflectorSR3.position.z = 14;
    // scene.add(reflectorSR3);

    // // Reflection side left
    // const reflectorSL = new Reflector( refGeo, {
    //     clipBias: 0.003,
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    //     color: 0xc1cbcb
    // } );
    // reflectorSL.rotation.y = Math.PI/2;
    // reflectorSL.position.x = -25;
    // reflectorSL.position.z = -8;
    // scene.add(reflectorSL);
    // const reflectorSL2 = new Reflector( refGeo, {
    //     clipBias: 0.003,
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    //     color: 0xc1cbcb
    // } );
    // reflectorSL.rotation.y = -Math.PI/2;
    // reflectorSL.position.x = 10;
    // reflectorSL.position.z;
    // scene.add(reflectorSL);
    // const reflectorSL3 = new Reflector( refGeo, {
    //     clipBias: 0.003,
    //     textureWidth: window.innerWidth * window.devicePixelRatio,
    //     textureHeight: window.innerHeight * window.devicePixelRatio,
    //     color: 0xc1cbcb
    // } );
    // reflectorSR3.rotation.y = -Math.PI/2;
    // reflectorSR3.position.x = 25;
    // reflectorSR3.position.z = 14;
    // scene.add(reflectorSR3);


    // Song background
    const cubeGeo = new THREE.BoxGeometry(8, 4.5, .01);
    const cubeMat = new THREE.MeshBasicMaterial({map: loadColorTexture('images/kokoro.jpg')});
    const cubeA = new THREE.Mesh(cubeGeo, cubeMat);
    cubeA.position.z = -11;
    cubeA.position.y = 3;
    scene.add(cubeA);

    // Ambient light
    const ambColor = 0xFFFFFF;
    const ambIntensity = .25;
    const ambientLight = new THREE.AmbientLight(ambColor, ambIntensity);
    scene.add(ambientLight);

    // Directional light 
    const dirColor = 0xFFFFFF;
    const dirIntensity = 1;
    const directionalLight = new THREE.DirectionalLight(dirColor, dirIntensity);
    directionalLight.position.set(0, 1, 0);
    directionalLight.target.position.set(2, 10, 1.5);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // Point light
    const pointColor = 0x00688f;
    const pointInt = 250;
    const pointLight = new THREE.PointLight(pointColor, pointInt);
    scene.add(pointLight);
    const helper = new THREE.PointLightHelper(pointLight);
    pointLight.position.set(0, 10, -5);
    scene.add(helper);

    const gui = new GUI();

    // Camera
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera, 'fov', 1, 180).onChange(() => {
        camera.updateProjectionMatrix();
    });
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    cameraFolder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near');
    cameraFolder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far');

    // Ambient Light
    const ambFolder = gui.addFolder('Ambient Light');
    ambFolder.addColor(
        new ColorGUIHelper(ambientLight, 'color'),
        'value'
    ).name('color');
    ambFolder.add(ambientLight, 'intensity', 0, 5, 0.01);

    // Directional Light
    const dirFolder = gui.addFolder('Directional Light');
    dirFolder.addColor(
        new ColorGUIHelper(directionalLight, 'color'),
        'value'
    ).name('color');
    dirFolder.add(directionalLight, 'intensity', 0, 5, 0.01);
    dirFolder.add(directionalLight.target.position, 'x', 0, 10);
    dirFolder.add(directionalLight.target.position, 'y', 0, 10);
    dirFolder.add(directionalLight.target.position, 'z', -0.5, 10);

    // Point Light
    const pointFolder = gui.addFolder('Point Light');
    pointFolder.addColor(
        new ColorGUIHelper(pointLight, 'color'),
        'value'
    ).name('color');
    pointFolder.add(pointLight, 'intensity', 0, 250, 1);
    pointFolder.add(pointLight, 'distance', 0, 40).onChange(updateLight);
    makeXYZGUI(pointFolder, pointLight.position, 'position', updateLight);

    // Cage
    gltfLoader.load('Models/scene.gltf', (gltf) => {
        const root = gltf.scene;
        scene.add(root);
        root.position.y = 1;
        root.position.z = -5;
    });

    // Ado
    gltfLoader.load('Models/ado.gltf', (gltf) => {
        const root2 = gltf.scene;
        scene.add(root2);
        root2.position.y = 2;
        root2.position.z = -5;
    });

    // Stage
    gltfLoader.load('Models/concert.gltf', (gltf) => {
        const root3 = gltf.scene;
        root3.scale.set(.5,.5,.5);
        scene.add(root3);
        root3.position.z = -6;
    });

    gltfLoader.load('Models/spotLight.gltf', (gltf) => {
        const root4 = gltf.scene;
        root4.scale.set(.25,.25,.25);
        scene.add(root4);
        root4.position.z = -2.5;
        root4.position.y = 1.2;
        root4.position.x = -3;
        root4.rotation.y = Math.PI / 2;
    });
    gltfLoader.load('Models/spotLight.gltf', (gltf) => {
        const root5 = gltf.scene;
        root5.scale.set(.25,.25,.25);
        scene.add(root5);
        root5.position.z = -2.5;
        root5.position.y = 1.2;
        root5.position.x = -1;
        root5.rotation.y = Math.PI / 2;
    });
    gltfLoader.load('Models/spotLight.gltf', (gltf) => {
        const root6 = gltf.scene;
        root6.scale.set(.25,.25,.25);
        scene.add(root6);
        root6.position.z = -2.5;
        root6.position.y = 1.2;
        root6.position.x = 1;
        root6.rotation.y = Math.PI / 2;
    });
    gltfLoader.load('Models/spotLight.gltf', (gltf) => {
        const root7 = gltf.scene;
        root7.scale.set(.25,.25,.25);
        scene.add(root7);
        root7.position.z = -2.5;
        root7.position.y = 1.2;
        root7.position.x = 3;
        root7.rotation.y = Math.PI / 2;
    });


    const logoGeo = new THREE.BoxGeometry(2, 1, .1);
    const logoMat = new THREE.MeshBasicMaterial({map: loadColorTexture('images/logo.jpg')});
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(0, 5.5, -.9);
    scene.add(logo);

    // Audience
    const count = 1000;
    const audGeo = new THREE.SphereGeometry(.25, 4, 4);
    const audMat = new THREE.MeshPhongMaterial({ color: 0x787878 });
    const Audience = new THREE.InstancedMesh(audGeo, audMat, count);
    const temp = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        temp.position.set((Math.random() - 0.5) * 12, 0.25, Math.random() * 8 + -.5);
        temp.updateMatrix();
        Audience.setMatrixAt(i, temp.matrix);
    }
    scene.add(Audience);
    // Animate audience
    const startPosition = [];
    for (let i = 0; i < count; i++) {
        temp.position.set((Math.random() - 0.5) * 50, 0.25, Math.random() * 22 + -.5);
        temp.updateMatrix();
        Audience.setMatrixAt(i, temp.matrix);
        startPosition.push(temp.position.clone()); // store original position
    }
    const jumpers = new Set();
    while (jumpers.size < count * .5) {
        jumpers.add(Math.floor(Math.random() * count));
    }
    const jumpPhases = Array.from({length: count}, () => Math.random() * Math.PI * 2);

    // Audience left
    const leftCount = 200;
    const leftStartPosition = [];
    const leftAud = new THREE.InstancedMesh(audGeo, audMat, leftCount);
    for (let i = 0; i < leftCount; i++) {
        temp.position.set(Math.random() * 20 - 25, 0.25, Math.random() * -11);
        temp.updateMatrix();
        leftAud.setMatrixAt(i, temp.matrix);
        leftStartPosition.push(temp.position.clone());
    }
    scene.add(leftAud);
    const leftJumpers = new Set();
    while (leftJumpers.size < leftCount * 0.5) {
        leftJumpers.add(Math.floor(Math.random() * leftCount));
    }
    const leftJumpPhases = Array.from({length: leftCount}, () => Math.random() * Math.PI * 2);
    const leftStickPhases = Array.from({length: leftCount}, () => Math.random() * Math.PI * 2);

    // Audience right
    const rightCount = 200;
    const rightStartPosition = [];
    const rightAud = new THREE.InstancedMesh(audGeo, audMat, rightCount);
    for (let i = 0; i < rightCount; i++) {
        temp.position.set(Math.random() * 20 + 5, 0.25, Math.random() * -11);
        temp.updateMatrix();
        rightAud.setMatrixAt(i, temp.matrix);
        rightStartPosition.push(temp.position.clone());
    }
    scene.add(rightAud);
    const rightJumpers = new Set();
    while (rightJumpers.size < rightCount * 0.5) {
        rightJumpers.add(Math.floor(Math.random() * rightCount));
    }
    const rightJumpPhases = Array.from({length: rightCount}, () => Math.random() * Math.PI * 2);
    const rightStickPhases = Array.from({length: rightCount}, () => Math.random() * Math.PI * 2);
    
    // Glowsticks
    const stickCount = 1000;
    const stickGeo = new THREE.CapsuleGeometry(0.03, 0.3, 4, 8);
    const stickTemp = new THREE.Object3D();
    const stickMat = new THREE.MeshStandardMaterial({
        color: 0x00688f,
        emissive: 0x00688f,
        emissiveIntensity: 2,
    });
    const GlowSticks = new THREE.InstancedMesh(stickGeo, stickMat, stickCount);

    const stickPhases = [];
    for (let i = 0; i < stickCount; i++) {
        const pos = startPosition[i];
        temp.position.set(pos.x + 0.2, pos.y + 0.2, pos.z - 0.2);
        temp.rotation.set(0, 0, Math.random() * Math.PI); // random initial tilt
        temp.updateMatrix();
        GlowSticks.setMatrixAt(i, temp.matrix);
        stickPhases.push(Math.random() * Math.PI * 2); // random wave phase
    }
    scene.add(GlowSticks);

    // Left glowsticks
    const GlowSticksL = new THREE.InstancedMesh(stickGeo, stickMat, leftCount);
    for (let i = 0; i < leftCount; i++) {
        const pos = leftStartPosition[i];
        stickTemp.position.set(pos.x + 0.2, pos.y + 0.2, pos.z - 0.2);
        stickTemp.rotation.set(0, 0, Math.random() * Math.PI);
        stickTemp.updateMatrix();
        GlowSticksL.setMatrixAt(i, stickTemp.matrix);
    }
    scene.add(GlowSticksL);

    // Right glowsticks
    const GlowSticksR = new THREE.InstancedMesh(stickGeo, stickMat, rightCount);
    for (let i = 0; i < rightCount; i++) {
        const pos = rightStartPosition[i];
        stickTemp.position.set(pos.x - 0.4, pos.y + 0.2, pos.z - 0.2);
        stickTemp.rotation.set(0, 0, Math.random() * Math.PI);
        stickTemp.updateMatrix();
        GlowSticksR.setMatrixAt(i, stickTemp.matrix);
    }
    scene.add(GlowSticksR);

    // Particles
    const particleCount = 2000;
    const partGeo = new THREE.SphereGeometry(0.02, 4, 4);
    const partMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0x00688f,
        emissiveIntensity: 2,
    });
    const particles = new THREE.InstancedMesh(partGeo, partMat, particleCount);
    const partTemp = new THREE.Object3D();
    const particlePositions = [];
    const particlePhases = [];

    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 50;
        const y = Math.random() * 10;
        const z = (Math.random() - 0.5) * 50;

        particlePositions.push({ x, y, z });
        particlePhases.push(Math.random() * Math.PI * 2);

        partTemp.position.set(x, y, z);
        partTemp.updateMatrix();
        particles.setMatrixAt(i, partTemp.matrix);
    }
    scene.add(particles);


    function resizeRendererToDisplaySize( renderer ) { 
        const canvas = renderer.domElement; const width = canvas.clientWidth; 
        const height = canvas.clientHeight; 
        const needResize = canvas.width !== width || canvas.height !== height; 
        if ( needResize ) { 
            renderer.setSize( width, height, false ); 
        } 
        return needResize; 
    }

    function updateLight() {
        helper.update();
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
        const folder = gui.addFolder(name);
        folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
        folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
        folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
        folder.open();
    }

    function render(time) {
        time *= 0.001;
        jumpers.forEach(i => {
            const jumpHeight = Math.max(0, Math.sin(time * 3 + jumpPhases[i])) * 0.6;

            // Audience sphere
            temp.position.set(startPosition[i].x, startPosition[i].y + jumpHeight, startPosition[i].z); // Make audience jump
            temp.rotation.set(0, 0, 0);
            temp.updateMatrix();
            Audience.setMatrixAt(i, temp.matrix);

            // Glow stick
            stickTemp.position.set(startPosition[i].x + 0.2, startPosition[i].y + jumpHeight +0.2, startPosition[i].z - 0.2); // Move stick as audience jumps
            stickTemp.rotation.set(0, 0, Math.sin(time * 3 + stickPhases[i]) * 0.8); // Move side to side
            stickTemp.updateMatrix();
            GlowSticks.setMatrixAt(i, stickTemp.matrix);
        });

        // Non jumping audience members with glow sticks
        for (let i = 0; i < stickCount; i++) {
            if (jumpers.has(i)) continue;
            const pos = startPosition[i];
            stickTemp.position.set(pos.x+ 0.2, pos.y+ 0.2, pos.z- 0.2); // Position of stick
            stickTemp.rotation.set(0, 0, Math.sin(time * 1.5 + stickPhases[i]) * 0.3); // Move side to side
            stickTemp.updateMatrix();
            GlowSticks.setMatrixAt(i, stickTemp.matrix);
        }
        // Left jumpers
        leftJumpers.forEach(i => {
            const jumpHeight = Math.max(0, Math.sin(time * 3 + leftJumpPhases[i])) * 0.6;
            temp.position.set(leftStartPosition[i].x, leftStartPosition[i].y + jumpHeight, leftStartPosition[i].z);
            temp.rotation.set(0, 0, 0);
            temp.updateMatrix();
            leftAud.setMatrixAt(i, temp.matrix);

            stickTemp.position.set(leftStartPosition[i].x + 0.2, leftStartPosition[i].y + jumpHeight + 0.2, leftStartPosition[i].z - 0.2);
            stickTemp.rotation.set(0, 0, Math.sin(time * 3 + leftStickPhases[i]) * 0.8);
            stickTemp.updateMatrix();
            GlowSticksL.setMatrixAt(i, stickTemp.matrix);
        });
        for (let i = 0; i < leftCount; i++) {
            if (leftJumpers.has(i)) continue;
            const pos = leftStartPosition[i];
            stickTemp.position.set(pos.x + 0.2, pos.y + 0.2, pos.z - 0.2);
            stickTemp.rotation.set(0, 0, Math.sin(time * 1.5 + leftStickPhases[i]) * 0.3);
            stickTemp.updateMatrix();
            GlowSticksL.setMatrixAt(i, stickTemp.matrix);
        }

        // Right jumpers
        rightJumpers.forEach(i => {
            const jumpHeight = Math.max(0, Math.sin(time * 3 + rightJumpPhases[i])) * 0.6;
            temp.position.set(rightStartPosition[i].x, rightStartPosition[i].y + jumpHeight, rightStartPosition[i].z);
            temp.rotation.set(0, 0, 0);
            temp.updateMatrix();
            rightAud.setMatrixAt(i, temp.matrix);

            stickTemp.position.set(rightStartPosition[i].x - 0.2, rightStartPosition[i].y + jumpHeight + 0.2, rightStartPosition[i].z - 0.2);
            stickTemp.rotation.set(0, 0, Math.sin(time * 3 + rightStickPhases[i]) * 0.8);
            stickTemp.updateMatrix();
            GlowSticksR.setMatrixAt(i, stickTemp.matrix);
        });
        for (let i = 0; i < rightCount; i++) {
            if (rightJumpers.has(i)) continue;
            const pos = rightStartPosition[i];
            stickTemp.position.set(pos.x - 0.2, pos.y + 0.2, pos.z - 0.2);
            stickTemp.rotation.set(0, 0, Math.sin(time * 1.5 + rightStickPhases[i]) * 0.3);
            stickTemp.updateMatrix();
            GlowSticksR.setMatrixAt(i, stickTemp.matrix);
        }
        GlowSticks.instanceMatrix.needsUpdate = true;
        Audience.instanceMatrix.needsUpdate = true;

        GlowSticksL.instanceMatrix.needsUpdate = true;
        leftAud.instanceMatrix.needsUpdate = true;

        GlowSticksR.instanceMatrix.needsUpdate = true;
        rightAud.instanceMatrix.needsUpdate = true;

        // Particle movement
        for (let i = 0; i < particleCount; i++) {
            const p = particlePositions[i];
            const phase = particlePhases[i];

            partTemp.position.set(
                p.x + Math.sin(time * 0.3 + phase) * 0.2,
                p.y + Math.sin(time * 0.4 + phase) * 0.15,
                p.z + Math.sin(time * 0.2 + phase) * 0.25
            );

            partTemp.updateMatrix();
            particles.setMatrixAt(i, partTemp.matrix);
        }

        particles.instanceMatrix.needsUpdate = true;

        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
main();