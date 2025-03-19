import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    20,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(5, 10, -4);
camera.lookAt(0, 0, 0);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

orbit.minPolarAngle = 0;
orbit.maxPolarAngle = Math.PI * 69 / 180;

orbit.minDistance = 1;
orbit.maxDistance = 100;

const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
        visible: false
    })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

const grid = new THREE.GridHelper(2, 2);
scene.add(grid);

const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    })
);

const leftLight = new THREE.DirectionalLight(0xFFFFFF, 1);
leftLight.position.set(-10, 10, 10);
leftLight.target.position.set(0, 0, 0);
scene.add(leftLight);
scene.add(leftLight.target);

const rightLight = new THREE.DirectionalLight(0xFFFFFF, 1);
rightLight.position.set(10, 10, 10);
rightLight.target.position.set(0, 0, 0);
scene.add(rightLight);
scene.add(rightLight.target);

const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
scene.add(ambientLight);

highlightMesh.rotateX(-Math.PI / 2);
highlightMesh.position.set(0.5, 0, 0.5);
scene.add(highlightMesh);

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

const objects = [];

const loader = new GLTFLoader();
const modelURL = './grenade.glb';

window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mousePosition, camera);

    intersects = raycaster.intersectObject(planeMesh);

    if (intersects.length > 0) {
        const intersect = intersects[0];

        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5);

        highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);

        const objectExist = objects.find(function (object) {
            return (object.position.x === highlightMesh.position.x)
                && (object.position.z === highlightMesh.position.z)
        });

        if (!objectExist)
            highlightMesh.material.color.setHex(0xFFFFFF);
        else
            highlightMesh.material.color.setHex(0xFFFF00);
    }
});

let finalSceneLoaded = false;

let fadeOverlay;

function createFadeOverlay() {
    fadeOverlay = document.createElement('div');
    fadeOverlay.style.position = 'absolute';
    fadeOverlay.style.top = 0;
    fadeOverlay.style.left = 0;
    fadeOverlay.style.width = '100%';
    fadeOverlay.style.height = '100%';
    fadeOverlay.style.backgroundColor = 'white';
    fadeOverlay.style.opacity = 0;
    fadeOverlay.style.transition = 'opacity 1.5s';
    fadeOverlay.style.pointerEvents = 'none';
    document.body.appendChild(fadeOverlay);
}

function replaceSceneWithModel() {
    if (!fadeOverlay) {
        createFadeOverlay();
    }

    fadeOverlay.style.opacity = 1;

    setTimeout(() => {
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }

        scene.background = new THREE.Color(0xFFFFFF);

        loader.load('./explosion.glb', function (gltf) {
            const finalModel = gltf.scene;
            finalModel.scale.set(3, 3, 3);
            finalModel.position.set(0, 0, 0);

            scene.add(finalModel);

            camera.position.set(90, -40, 0);
            camera.lookAt(finalModel.position);
        });

        const newLight = new THREE.PointLight(0xFFFFFF, 60, 9000);
        newLight.position.set(5, 5, 10);
        scene.add(newLight);

        finalSceneLoaded = true;

        setTimeout(() => {
            fadeOverlay.style.opacity = 0;
        }, 500);
    }, 1500);
}

createFadeOverlay();

window.addEventListener('mousedown', function () {
    if (finalSceneLoaded) {
        return;
    }

    const objectExist = objects.find(function (object) {
        return (object.position.x === highlightMesh.position.x)
            && (object.position.z === highlightMesh.position.z)
    });

    if (!objectExist) {
        loader.load(modelURL, function (gltf) {
            const model = gltf.scene;
            model.scale.set(.8, .8, .8);
            model.position.copy(highlightMesh.position);
            model.userData = { animationStartTime: performance.now() };

            scene.add(model);
            objects.push(model);

            const mixer = new THREE.AnimationMixer(model);

            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity).play();

                action.timeScale = .5;
            });

            model.userData.mixer = mixer;

            highlightMesh.material.color.setHex(0xFF0000);

            if (objects.length === 4) {
                setTimeout(() => {
                    replaceSceneWithModel();
                }, 200);
            }
        });
    } else {
        const objectToRemove = objects.find(function (object) {
            return (object.position.x === highlightMesh.position.x)
                && (object.position.z === highlightMesh.position.z)
        });

        if (objectToRemove) {
            scene.remove(objectToRemove);
            const index = objects.indexOf(objectToRemove);
            if (index > -1) {
                objects.splice(index, 1);
            }
            highlightMesh.material.color.setHex(0xFFFFFF);
        }
    }
});

function animate(time) {
    highlightMesh.material.opacity = 1 + Math.sin(time / 120);

    objects.forEach(function (object) {
        const timeSinceAdded = (time - object.userData.animationStartTime) / 1000;

        object.rotation.x = timeSinceAdded;
        object.rotation.z = timeSinceAdded;

        object.position.y = 0.5 + 0.5 * Math.abs(Math.sin(timeSinceAdded));

        if (object.userData.mixer) {
            object.userData.mixer.update(time * 0.001);
        }
    });

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});