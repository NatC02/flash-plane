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

window.addEventListener('mousemove', function (e) {
    // Calc mouse position in normalized device coordinates
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the new mouse position and camera
    raycaster.setFromCamera(mousePosition, camera);

    // Find intersections between the raycaster and the plane mesh
    intersects = raycaster.intersectObject(planeMesh);

    // Check if there is an intersection
    if (intersects.length > 0) {
        // Get the first intersection point
        const intersect = intersects[0];

        // Highlight position by rounding down to the nearest integer and adding 0.5
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5);

        // Set the position of the highlight mesh
        highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);

        // Checks if an object exists at the highlight position
        const objectExist = objects.find(function (object) {
            return (object.position.x === highlightMesh.position.x)
                && (object.position.z === highlightMesh.position.z)
        });

        // Change highlight mesh color based on whether an object exists at the highlight position
        if (!objectExist)
            highlightMesh.material.color.setHex(0xFFFFFF);
        else
            highlightMesh.material.color.setHex(0xFFFF00);
    }
});

let finalSceneLoaded = false;  // Flag to track if the final scene has been loaded

let fadeOverlay;

// Function to initialize the fade-in overlay
function createFadeOverlay() {
    fadeOverlay = document.createElement('div');
    fadeOverlay.style.position = 'absolute';
    fadeOverlay.style.top = 0;
    fadeOverlay.style.left = 0;
    fadeOverlay.style.width = '100%';
    fadeOverlay.style.height = '100%';
    fadeOverlay.style.backgroundColor = 'white';
    fadeOverlay.style.opacity = 0; // Initially fully transparent
    fadeOverlay.style.transition = 'opacity 1.5s'; // Fade-in transition effect
    fadeOverlay.style.pointerEvents = 'none';  // Allow mouse events to pass through (bug where overlay blocked the interaction)
    document.body.appendChild(fadeOverlay);
}

// Function to replace the scene with a fullscreen video after the fade-in effect
function replaceSceneWithVideo() {
    // fade-in overlay if it doesn't exist
    if (!fadeOverlay) {
        createFadeOverlay();
    }

    // trigger fade-in effect
    fadeOverlay.style.opacity = 1;

    // audio element and set up its properties
    const audioElement = document.createElement('audio');
    audioElement.src = './grenade.mp3'; // Replace with your actual audio file path
    audioElement.autoplay = true; // Start playing as soon as it loads
    audioElement.loop = false; // Ensure it doesn't loop
    audioElement.muted = false; // Optional: Mute the audio if you don't want sound

    // Append audio and play in the background
    document.body.appendChild(audioElement);

    // After the fade-in is complete, clear all objects from the scene and show the video
    setTimeout(() => {
        // Clear all objects from the scene
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }

        // video element for the fullscreen video
        const videoElement = document.createElement('video');
        videoElement.src = './video.mp4';
        videoElement.autoplay = true;
        videoElement.loop = false;
        videoElement.muted = false;
        videoElement.style.position = 'absolute';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        document.body.appendChild(videoElement);

        // final scene has loaded
        finalSceneLoaded = true;



        // **REPEAT VIDEO OPTIONAL**
        let playCount = 0;
        videoElement.addEventListener('ended', function () {
            playCount++;
            if (playCount >= 1) {
                videoElement.pause();
            } else {
                videoElement.play();
            }
        });
        // **REPEAT VIDEO OPTIONAL**



        // Fade out the overlay after the scene has been replaced
        setTimeout(() => {
            fadeOverlay.style.opacity = 0; // Fade out
        }, 500); // Delay fade-out until the new model is loaded
    }, 1500); // Wait for the fade-in effect to complete before replacing the scene
}

// Not used on startup, but you can by calling the func
createFadeOverlay();

// Handle mouse click to add/remove grenades
window.addEventListener('mousedown', function () {

    if (finalSceneLoaded) {
        // don't allow placing new grenades in final scene
        return;
    }

    // Check if all grid positions are filled 
    if (objects.length === 4) {
        return; // Prevent any further interaction with the grid
    }

    const objectExist = objects.find(function (object) {
        return (object.position.x === highlightMesh.position.x)
            && (object.position.z === highlightMesh.position.z)
    });

    if (!objectExist) {
        loader.load(modelURL, function (gltf) {
            const model = gltf.scene;
            model.scale.set(.6, .6, .6);
            model.position.copy(highlightMesh.position);
            model.userData = { animationStartTime: performance.now() };

            // Add the loaded model to the scene
            scene.add(model);
            objects.push(model);

            // Create an AnimationMixer for the model
            const mixer = new THREE.AnimationMixer(model);

            // if model imported has animations, then play them
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity).play();

                // Control the speed of the animation here
                action.timeScale = .5; // Adjust animation speed
            });

            // Store the mixer in the model's userData for future reference
            model.userData.mixer = mixer;

            highlightMesh.material.color.setHex(0xFFFF00);

            // Check if all grid positions are filled
            if (objects.length === 4) {
                setTimeout(() => {
                    replaceSceneWithVideo();
                }, 200);
            }
        });
    } else {
        // Only allow removal if the grid is not full
        if (objects.length < 4) {
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
    }
});


// Animation loop
function animate(time) {
    highlightMesh.material.opacity = 1 + Math.sin(time / 120);

    objects.forEach(function (object) {
        // Calc individual object animation based on when it was added
        const timeSinceAdded = (time - object.userData.animationStartTime) / 1000; // Time since the object was added

        // Apply rotation and movement
        object.rotation.x = timeSinceAdded;
        object.rotation.z = timeSinceAdded;

        // Make object bounce on its Y position
        object.position.y = 0.5 + 0.5 * Math.abs(Math.sin(timeSinceAdded));

        // Update animation mixers
        if (object.userData.mixer) {
            object.userData.mixer.update(time * 0.001);  // Update animation mixer (time is in ms, so multiply by 0.001)
        }
    });

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Handle window resize
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});