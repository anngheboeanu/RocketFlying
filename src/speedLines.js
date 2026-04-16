import * as THREE from 'three';
import vertexShader from '../shaders/speedLinesShader/speedLine.vert?raw';
import fragmentShader from '../shaders/speedLinesShader/speedLine.frag?raw';


export const speedLineUniforms = 
{
    radialScale : { value: 5.0},
    lengthScale : { value: 200.0},
    speedLineAnimation:{ value: 10.0},
    speedLinePower:{value:1.0},
    speedLineMap : { value: 0.4},
    maskScale : { value: 3.0},
    maskHardness : { value: 1.2},
    maskPower : { value: 5.0},
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    time: { value: 0 },
    center: {value:new THREE.Vector2(0.5, 0.5)}
}
export function SpeedLineMesh()
{

  const geometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    -1, -1, 0,
     3, -1, 0,
    -1,  3, 0
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: speedLineUniforms,
    depthTest: false,
    depthWrite: false,
            glslVersion: THREE.GLSL3,
                transparent: true,
            });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  return mesh;
}