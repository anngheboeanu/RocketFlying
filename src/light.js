import * as THREE from 'three';

const directionalLight_1 = {
    position: [0, 10, -5] ,
    color: 0xffffff,
    intensity: 5.5
};

function GetDirectionalThreeJsLight(light) {
    const Light = new THREE.DirectionalLight(
        light.color.value,
        light.intensity.value
    );

    const [x, y, z] = light.position;
    Light.position.set(x, y, z);

    return Light;
}

export function GetLights() {
    let lights = [];

    const dirLight1 = GetDirectionalThreeJsLight(directionalLight_1);
    lights.push(dirLight1);

    return lights;
}