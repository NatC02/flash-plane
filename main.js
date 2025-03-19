import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';  // Import GLTFLoader

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// scene, camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    20,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(5, 10, -4);
camera.lookAt(0, 0, 0);

// orbit controls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// limits camera's vertical rotation (pitch)
orbit.minPolarAngle = 0;  // Prevent camera from going below the horizon
orbit.maxPolarAngle = Math.PI * 69 / 180;  // Limit vertical rotation to 69 degrees (in radians)

orbit.minDistance = 1;  // prevents the camera from getting too close to the floor
orbit.maxDistance = 100;  // Optional: Limit the zoom distance if desired

// plane mesh, add to scene
const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
        visible: false
    })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

// grid scene
const grid = new THREE.GridHelper(2, 2);
scene.add(grid);

// highlight mesh and add to scene
const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    })
);

// left fluorescent light
const leftLight = new THREE.DirectionalLight(0xFFFFFF, 1); 
leftLight.position.set(-10, 10, 10);
leftLight.target.position.set(0, 0, 0);
scene.add(leftLight);
scene.add(leftLight.target);

// right fluorescent light
const rightLight = new THREE.DirectionalLight(0xFFFFFF, 1);
rightLight.position.set(10, 10, 10);
rightLight.target.position.set(0, 0, 0);
scene.add(rightLight);
scene.add(rightLight.target);

// ambient light to soften the scene a bit
const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
scene.add(ambientLight);

highlightMesh.rotateX(-Math.PI / 2);
highlightMesh.position.set(0.5, 0, 0.5);
scene.add(highlightMesh);

// raycaster for mouse interaction
const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

const objects = [];

const loader = new GLTFLoader();
const modelURL = './grenade.glb';

