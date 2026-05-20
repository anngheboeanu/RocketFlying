import * as THREE from 'three';
import { BlockyWingGeometry, MainBodyGeometry, SpaceShipMesh } from './spaceship';
import { StarBackgroundMesh, starMaterialUniforms } from './starField';
import { SetupCamera } from './camera';
import { GetLights } from './light';
import { lights } from 'three/src/nodes/lighting/LightsNode.js';
import { SpeedLineMesh, speedLineUniforms } from './speedLines';
import { SunUniforms, SunMesh} from './sun';


export let starMesh, ship;
export let scene, camera, renderer;

function AddShip(scene)
{
  
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
  
  
  ship = new THREE.Group();
  ship.add( rightWing,leftWing,  mainBodyGroup);
  ship.position.set(0,0,0);
  


  ship.renderOrder = -1;
  
  scene.add(ship);
}

export function worldToScreen(object, camera, renderer) {
    const pos = new THREE.Vector3();

    object.getWorldPosition(pos);

    pos.project(camera);

    const canvas = renderer.domElement;

    return {
        x: (pos.x * 0.5 + 0.5) ,
        y: (pos.y * 0.5 + 0.5),
        visible:
            pos.x >= -1 && pos.x <= 1 &&
            pos.y >= -1 && pos.y <= 1 &&
            pos.z >= -1 && pos.z <= 1
    };
}

export function ChangedShipPos()
{
  
  const screenPos = worldToScreen(ship, camera, renderer);
  speedLineUniforms.center.value.x = screenPos.x;
  speedLineUniforms.center.value.y = screenPos.y;
}

export function RefreshStarBackground(newCount)
{

  scene.remove(starMesh);
  starMesh.geometry.dispose();
  starMesh.material.dispose();

  starMaterialUniforms.totalcount.value = newCount;
  starMesh = StarBackgroundMesh(
    1,
    starMaterialUniforms.totalcount.value,
    starMaterialUniforms.centerPoint.value,
    starMaterialUniforms.halfBoxWidth.value,
    starMaterialUniforms.halfBoxHeight.value,
    starMaterialUniforms.halfBoxDepth.value
  );

  scene.add(starMesh);
}

export const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight
);
export const renderTargetStars = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight
);


export function CreateScene()
{
  scene = new THREE.Scene();
  camera = SetupCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);

  document.body.appendChild(renderer.domElement);
    
  const sunMesh = SunMesh();
  scene.add(sunMesh);
  sunMesh.layers.set(1);
  
  let lights = GetLights();
  console.log(lights);
  for(let i=0;i<lights.length;i++)
  {
    scene.add(lights[i]);
  }
  
  const ambient = new THREE.AmbientLight(0xffffff, 30.5);
  scene.add(ambient);

  starMesh = StarBackgroundMesh(1., 1000000, new  THREE.Vector3(0,0,100), 150, 100, 200);
  scene.add(starMesh);

  
  AddShip(scene);
  ChangedShipPos();

  const speedLines = SpeedLineMesh();
  scene.add(speedLines);
  speedLines.layers.set(1)
  
  return {scene,camera, renderer}
}