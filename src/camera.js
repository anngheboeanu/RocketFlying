import * as THREE from 'three';

const camera = {
    position: new THREE.Vector3(0, 40, -40),
    lookAt: new THREE.Vector3(0, 0, 40),
    fov: 60,
    near:0.1,
    far:1000
};

export function SetupCamera() {
    const _camera = new THREE.PerspectiveCamera(
        camera.fov,
        window.innerWidth / window.innerHeight,
        camera.near,
        camera.far
    );

    _camera.position.copy(camera.position);
    _camera.lookAt(camera.lookAt);

    return _camera;
}