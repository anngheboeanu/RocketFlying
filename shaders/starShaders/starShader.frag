// #version 300 es
in vec2 vUv;
out vec4 outColor;
in float instanceId;

uniform float time;

float rand(inout vec2 seed) {
    vec3 p3  = fract(vec3(seed.xyx) * .1031);
    
    p3 += dot(p3, p3.yzx + 33.33);
    
    seed = vec2(fract((p3.x + p3.y) * p3.z));
    return fract((p3.x + p3.y) * p3.z);
}


void main() {
  
    float opacity = float(0.1)/length(vUv-0.5) - 0.2;

    vec2 seed = vec2(instanceId);
    vec3 color = vec3(1.0, 1.0, 1.0);
    // color = vec3(rand(seed),rand(seed),rand(seed))  ;
    opacity*=2.0;
    
    outColor = vec4(color, opacity) ;
}