import { starMaterialUniforms } from './src/starField';
import { CreateScene, scene, camera, renderer, renderTarget, renderTargetStars, RefreshStarBackground } from './src/scene';
import { InputListener } from './src/input';
import { AddGui } from './src/gui';
import { speedLineUniforms, SetNormalValues, SetHyperspeed, SetBlackHoleValue } from './src/speedLines';
import {SunUniforms} from './src/sun'
import vertexShader from './shaders/sun/sun.vert?raw';
import fragmentShader from './shaders/sun/sun.frag?raw';
import * as THREE from 'three';

CreateScene();
const { controls, update } =InputListener(camera, renderer);
// AddGui();

const music = document.getElementById("backgroundMusic");
music.src = "muzica/herta_space_station.mp3.wav";
music.play();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "1") { 



   if (!SunUniforms.change.value)
   {   
        SunUniforms.duration.value = 10.0;

        speedLineUniforms.startTime.value = performance.now()*0.001;
        speedLineUniforms.hyper.value = true;
        speedLineUniforms.blackHole.value = false;
        speedLineUniforms.duration.value = 5.0;

        music.src = "muzica/hyperspace.wav";
        music.load();
        music.play();
        
        setTimeout(() => {
            music.src = "muzica/star_wars.wav";
            music.load();
            music.play();

            SetHyperspeed();
            speedLineUniforms.hyper.value = false;
            speedLineUniforms.blackHole.value = true;
            speedLineUniforms.startTime.value = performance.now()*0.001;
            speedLineUniforms.duration.value = 3.5;

            }, 6500);

        setTimeout(() => {
            SetBlackHoleValue();
            }, 10000);
            
    }
    else
    {   

        speedLineUniforms.startTime.value = performance.now()*0.001;
        speedLineUniforms.hyper.value = true;
        speedLineUniforms.blackHole.value = false;
        speedLineUniforms.duration.value = 8.0;



        SunUniforms.duration.value = 15.0;
        music.src = "muzica/on_the_run.mp3.wav";
        music.load();
        music.play();
        
        setTimeout(() => {
            music.src = "muzica/herta_space_station.mp3.wav";
            music.load();
            music.play();  
            SetHyperspeed();
            speedLineUniforms.hyper.value = false;
            speedLineUniforms.blackHole.value = false;
            speedLineUniforms.startTime.value = performance.now()*0.001;
            speedLineUniforms.duration.value = 5.0;

            }, 10000);
        
        setTimeout(() => {
            SetNormalValues();
            }, 15000);
    }
   


   SunUniforms.startChange.value = true;
   SunUniforms.change.value = !SunUniforms.change.value;
   SunUniforms.startTime.value =  performance.now() * 0.001;


   console.log("Changed");
   console.log(SunUniforms.startChange.value);
  }
});


let blackHoleStreakCount = 100000.0;
let normalStarStreakCount = 1.0;
function ChangeStars()
{
    if (SunUniforms.change.value)
    {
        let step = 1.0;

        if (starMaterialUniforms.streakCount.value + step <  blackHoleStreakCount)
            starMaterialUniforms.streakCount.value = starMaterialUniforms.streakCount.value+step;
        else
            starMaterialUniforms.streakCount.value = blackHoleStreakCount;
    }
    else
    {
        let step = 1.0;

        if (starMaterialUniforms.streakCount.value - step >normalStarStreakCount)
            starMaterialUniforms.streakCount.value = starMaterialUniforms.streakCount.value - step;
        else
            starMaterialUniforms.streakCount.value = normalStarStreakCount;
    }
}

SetNormalValues();
function animate(timestamp) {

    let globalTime = performance.now()* 0.001;
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
    speedLineUniforms.time.value = globalTime;

    SunUniforms.time.value = globalTime;
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

    ChangeStars();
    
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);