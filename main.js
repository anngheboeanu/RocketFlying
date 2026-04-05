// // npm install three-bvh-csg three-mesh-bvh


// import { startAnimation } from "./src/scene";

// startAnimation();
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { BlockyWingGeometry, MainBodyGeometry, SpaceShipMesh } from './src/spaceship';
import { StarBackgroundMesh, starMaterialUniforms } from './src/starField';
import { uniform } from 'three/src/nodes/core/UniformNode.js';
function enableMovement(camera, renderer) {
  const controls = new PointerLockControls(camera, document.body);

  document.addEventListener('click', () => {
    controls.lock();
  });

  const keys = {
    w: false,
    a: false,
    s: false,
    d: false
  };

  document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
  });

  document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
    if(e.key === "+")
    {
      // speed +=1.0;
      starMaterialUniforms.speed.value+=.1;
      starMaterialUniforms.streakCount.value*=2;
      // starMaterialUniforms.halfBoxDepth.value-=20;
      // starMaterialUniforms.halfBoxHeight.value-=2;
      // starMaterialUniforms.halfBoxWidth.value-=2;
    }
    if(e.key === "-")
    {
      // speed -=1.0;
      starMaterialUniforms.speed.value-=.1;
      starMaterialUniforms.streakCount.value*=2;
      // starMaterialUniforms.halfBoxDepth.value+=20;
      // starMaterialUniforms.halfBoxHeight.value*=2;
      // starMaterialUniforms.halfBoxWidth.value+=20;

    }
    if(e.key === "p")
    {
      starMaterialUniforms.speed.value = 0.1;
      starMaterialUniforms.streakCount.value=1;
    }
    if(e.key==="o")
    {
      starMaterialUniforms.speed.value = 0.0;
      starMaterialUniforms.streakCount.value=1;
    }
  });

  const speed = 0.1;

  function update() {
    if (controls.isLocked) {
      if (keys.w) controls.moveForward(speed);
      if (keys.s) controls.moveForward(-speed);
      if (keys.a) controls.moveRight(-speed);
      if (keys.d) controls.moveRight(speed);
    }
  }

  return { controls, update };
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 40, -40);
camera.lookAt(0, 0, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);


const dirLight = new THREE.DirectionalLight(0xffffff, 5.5);
dirLight.position.set(0, 10, -5);


scene.add(dirLight);



const starMesh = StarBackgroundMesh(1., 1000000, new  THREE.Vector3(0,0,100), 150, 100, 200);
starMaterialUniforms.streakCount.value =10
// starMaterialUniforms.speed = 0.0;
scene.add(starMesh);


const mainBodyGroup = MainBodyGeometry();
const rightWing = BlockyWingGeometry(1);
const leftWing = BlockyWingGeometry(-1);

const rightWingBox = new THREE.Box3().setFromObject(rightWing);
const leftWingBox = new THREE.Box3().setFromObject(leftWing);
const mainBodyBox = new THREE.Box3().setFromObject(mainBodyGroup);

const wingWidth = rightWingBox.max.x -rightWingBox.min.x;
const bodyWidth = mainBodyBox.max.x-mainBodyBox.min.x;

rightWing.position.set( 
  bodyWidth/2 + wingWidth/2 + .25,
  0,
  -1.5
);
leftWing.position.set( 
  -(bodyWidth/2 + wingWidth/2 + .25),
  0,
  -1.5
);
mainBodyGroup.position.set(0,0,0);



const ship = new THREE.Group();
ship.add( rightWing,leftWing,  mainBodyGroup);
ship.position.set(0,0,0);
scene.add(ship);


const { controls, update } = enableMovement(camera, renderer);

function animate(timestamp) {
    update();
    renderer.render(scene, camera);
    starMaterialUniforms.time.value = timestamp;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

