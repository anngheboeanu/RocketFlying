import { starMaterialUniforms } from './src/starField';
import { CreateScene, scene, camera, renderer, renderTarget, renderTargetStars } from './src/scene';
import { InputListener } from './src/input';
import { AddGui } from './src/gui';
import { speedLineUniforms } from './src/speedLines';
import {SunUniforms} from './src/sun'
import vertexShader from './shaders/sun/sun.vert?raw';
import fragmentShader from './shaders/sun/sun.frag?raw';
import * as THREE from 'three';

CreateScene();
const { controls, update } =InputListener(camera, renderer);
AddGui();


function animate(timestamp) {
    update();
    camera.layers.set(0);

    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, camera);


    camera.layers.set(1);

    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);



    starMaterialUniforms.time.value = timestamp;
    starMaterialUniforms.tScene.value = renderTargetStars;
    speedLineUniforms.time.value = timestamp;

    SunUniforms.time.value = timestamp;
    SunUniforms.cameraPos.value.copy(camera.position);
    
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    const right = new THREE.Vector3()
    .crossVectors(forward, camera.up)
    .normalize();

    const up = new THREE.Vector3()
    .crossVectors(right, forward)
    .normalize();
    SunUniforms.forward.value = forward;
    SunUniforms.right.value = right;
    SunUniforms.up.value = up;
    SunUniforms.tScene.value = renderTarget.texture;

    
    
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);