// npm install lil-gui


import { starMaterialUniforms } from './src/starField';


import { CreateScene, scene, camera, renderer } from './src/scene';
import { InputListener } from './src/input';
import { AddGui } from './src/gui';
import { speedLineUniforms } from './src/speedLines';

CreateScene();
const { controls, update } =InputListener(camera, renderer);
AddGui();

function animate(timestamp) {
    update();
    renderer.render(scene, camera);
    starMaterialUniforms.time.value = timestamp;
    speedLineUniforms.time.value = timestamp;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

