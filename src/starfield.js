import * as THREE from 'three';
import vertexShader from '../shaders/starShaders/starShader.vert?raw';
import fragmentShader from '../shaders/starShaders/starShader.frag?raw';


export const starMaterialUniforms = {
            halfBoxWidth: { value: 100 },
            halfBoxHeight: { value: 100 },
            halfBoxDepth: { value:100 },
            centerPoint: {value: new THREE.Vector3(0,0,-400)},
            time:   {value: 0.0},
            speed:{value:.1},
            streakCount:{value:1000}
}

export function StarBackgroundMesh(size=1, count = 10000.0, center = new  THREE.Vector3(0,0,0), halfWidth = 100, halfHeight = 100, halfDepth = 100)
{
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    

    starMaterialUniforms.centerPoint.value.copy( center );
    starMaterialUniforms.halfBoxDepth.value = halfDepth;
    starMaterialUniforms.halfBoxHeight.value = halfHeight;
    starMaterialUniforms.halfBoxWidth.value = halfWidth;

    const starMaterial = new THREE.ShaderMaterial({
        uniforms:starMaterialUniforms,
        vertexShader,
        fragmentShader,
        glslVersion: THREE.GLSL3,
            transparent: true,
        });
    starMaterial.side = THREE.DoubleSide;

    const stars = new THREE.InstancedMesh(planeGeometry, starMaterial, count);   
    stars.frustumCulled = false;
    return stars;
}