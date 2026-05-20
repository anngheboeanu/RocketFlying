// #version 300 es
in vec2 vUv;
out vec4 outColor;
in float instanceId;
in vec4 pos;
uniform sampler2D tScene;

uniform float time;

float rand(inout vec2 seed) {
    vec3 p3 = fract(vec3(seed.xyx) * .1031);

    p3 += dot(p3, p3.yzx + 33.33);

    seed = vec2(fract((p3.x + p3.y) * p3.z));
    return fract((p3.x + p3.y) * p3.z);
}

void main() {

    vec2 uv = vUv;

    vec2 center = vec2(0.5);

    float dist = length(uv - center);

    float radius = .3;

    if(dist > radius) {
        discard;
    }

    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}