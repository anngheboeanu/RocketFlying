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
    center: {value:new THREE.Vector2(0.5, 0.5)},

    startTime: { value: 0 },
    blackHole:{value:false},
    hyper:{value:false},
    duration:{value:10.0},
}
export function SpeedLineMesh()
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
    uniforms: speedLineUniforms,
    depthTest: false,
    depthWrite: false,
            glslVersion: THREE.GLSL3,
                transparent: true,
            });

  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}


export function SetNormalValues()
{
  speedLineUniforms.radialScale.value = 6.2;
  speedLineUniforms.lengthScale.value = 500;

  speedLineUniforms.speedLineAnimation.value = 7.8;
  speedLineUniforms.speedLinePower.value = 0.9;
  
  speedLineUniforms.maskScale.value = 2.0;
  speedLineUniforms.maskHardness.value = 0.3;
  speedLineUniforms.maskPower.value = 2.1;
  
  speedLineUniforms.speedLineMap.value = 0.62;

  
}

export function SetHyperspeed()
{
  speedLineUniforms.radialScale.value = 0.0;
  speedLineUniforms.lengthScale.value = 500;

  speedLineUniforms.speedLineAnimation.value = 12.7;
  speedLineUniforms.speedLinePower.value = 1.5;
  
  speedLineUniforms.maskScale.value = 2.0;
  speedLineUniforms.maskHardness.value = 1.4;
  speedLineUniforms.maskPower.value = 4.1;
  
  speedLineUniforms.speedLineMap.value = 0.51;

}export function SetBlackHoleValue()
{
  speedLineUniforms.radialScale.value = 8.7;
  speedLineUniforms.lengthScale.value = 0;

  speedLineUniforms.speedLineAnimation.value = 4.1;
  speedLineUniforms.speedLinePower.value = 1.0;
  
  speedLineUniforms.maskScale.value = 3.0;
  speedLineUniforms.maskHardness.value = 1.2;
  speedLineUniforms.maskPower.value = 5.0;
  
  speedLineUniforms.speedLineMap.value = 0.4;

}