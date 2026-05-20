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
            tScene: { value: null },
            streakCount:{value:1},
            totalcount:{value:10000},
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight)  }
}


export function StarBackgroundMesh(size=1, count = 10000.0, center = new  THREE.Vector3(0,0,0), halfWidth = 100, halfHeight = 100, halfDepth = 100)
{
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    
    starMaterialUniforms.totalcount.value = count;
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
    
    
    starMaterial.depthWrite = false;
    starMaterial.depthTest = true;
    starMaterial.blending = THREE.AdditiveBlending;
    starMaterial.side = THREE.DoubleSide;

    const stars = new THREE.InstancedMesh(planeGeometry, starMaterial, count);   
    stars.frustumCulled = false;
    return stars;
}