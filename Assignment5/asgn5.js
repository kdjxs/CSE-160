import * as THREE from 'three';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js'; 
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

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

    // Plane
    const geometry = new THREE.PlaneGeometry(15, 20);
    const material = new THREE.MeshBasicMaterial({map: loadColorTexture('images/top.jpg')});
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.z = -2;
    scene.add(plane);

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
    const count = 250;
    const audGeo = new THREE.SphereGeometry(.25, 16, 16);
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
        temp.position.set((Math.random() - 0.5) * 12, 0.25, Math.random() * 8 + -.5);
        temp.updateMatrix();
        Audience.setMatrixAt(i, temp.matrix);
        startPosition.push(temp.position.clone()); // store original position
    }
    const jumpers = new Set();
    while (jumpers.size < count * .5) {
        jumpers.add(Math.floor(Math.random() * count));
    }
    const jumpPhases = Array.from({length: count}, () => Math.random() * Math.PI * 2);

    // Glowsticks
    const stickCount = 250;
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

    // Particles
    const particleCount = 500;
    const partGeo = new THREE.SphereGeometry(0.02, 16, 16);
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
        const x = (Math.random() - 0.5) * 24;
        const y = Math.random() * 10;
        const z = (Math.random() - 0.5) * 26;

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

        GlowSticks.instanceMatrix.needsUpdate = true;
        Audience.instanceMatrix.needsUpdate = true;

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