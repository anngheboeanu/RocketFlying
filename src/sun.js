import * as THREE from 'three';
import vertexShader from '../shaders/sun/sun.vert?raw';
import fragmentShader from '../shaders/sun/sun.frag?raw';


export const SunUniforms = {
    time: { value: 0 },
    startTime: { value: 0 },
    startChange:{value:false},
    change:{value:false},
    duration:{value:10.0},

    tScene: { value: null },

    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  
  cameraPos: { value: new THREE.Vector3() },
  forward:{value: new THREE.Vector3() },
  right:{value: new THREE.Vector3() },
  up:{value: new THREE.Vector3() }
};

export function SunMesh()
{

  const geometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    -100, -100, 0,
     300, -100, 0,
    -100,  300, 0
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: SunUniforms,
            glslVersion: THREE.GLSL3,
                transparent: true,
            });

  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}