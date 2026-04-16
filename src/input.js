import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { starMaterialUniforms } from './starField';
import { ChangedShipPos } from './scene';

export function InputListener(camera, renderer) {
  const controls = new PointerLockControls(camera, document.body);

    controls.addEventListener('change', () => {
      ChangedShipPos();
    });

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
      starMaterialUniforms.speed.value+=.1;
    }
    if(e.key === "-")
    {
      starMaterialUniforms.speed.value-=.1;

    }
    if(e.key === "p")
    {
      starMaterialUniforms.speed.value = 0.1;
    }
    if(e.key==="o")
    {
      starMaterialUniforms.speed.value = 0.0;
    }
  });

  const speed = 0.1;

  function update() {
    if (controls.isLocked) {
      if (keys.w) 
        {controls.moveForward(speed);ChangedShipPos();}
      if (keys.s){ controls.moveForward(-speed);ChangedShipPos();}
      if (keys.a){ controls.moveRight(-speed);ChangedShipPos();}
      if (keys.d){ controls.moveRight(speed);;ChangedShipPos();}
    }
  }

  return { controls, update };
}