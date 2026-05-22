uniform vec2 resolution;
uniform float time;
out vec4 outColor;

uniform float radialScale;
uniform float lengthScale;
uniform float speedLineAnimation;
uniform float speedLinePower;
uniform float speedLineMap;

uniform float maskScale;
uniform float maskHardness;
uniform float maskPower;

uniform vec2 center;

float normalRadialScale = 6.2;
float normalLengthScale = 500.0;
float normalSpeedLineAnim = 7.8;
float normalSpeedLinePower = 0.9;
float normalMaskScale = 2.0;
float normalMaskHardness = 0.3;
float normalMaskPower = 2.1;
float normalSpeedLineMap = .62;

float hyperRadialScale = 0.0;
float hyperLengthScale = 500.0;
float hyperSpeedLineAnim = 12.7;
float hyperSpeedLinePower = 1.5;
float hyperMaskScale = 2.0;
float hyperMaskHardness = 1.4;
float hyperMaskPower = 4.1;
float hyperSpeedLineMap = .51;

float blackHoleRadialScale = 8.7;
float blackHoleLengthScale = 0.0;
float blackHoleSpeedLineAnim = 4.1;
float blackHoleSpeedLinePower = 1.0;
float blackHoleMaskScale = 3.0;
float blackHoleMaskHardness = 1.2;
float blackHoleMaskPower = 5.0;
float blackHoleSpeedLineMap = .4;

uniform bool blackHole;
uniform bool hyper;

void Saturate(inout vec4 Out) {
    Out = clamp(Out, 0.0, 1.0);
}

float RadialMask(vec2 uv, float scale, float hardness) {
    float dist = distance(uv, center) * scale;
    float mask = 1.0 - smoothstep(1.0 - hardness, 1.0, dist);
    return clamp(mask, 0.0, 1.0);
}

uniform float duration;

uniform float startTime;
uniform bool startChange;
uniform bool change;
float getProgress() {
    float t = clamp((time - startTime) / duration, 0.0, 1.0);
    return t;
    // if(!change) {
    //     return 1.0 - t;
    // } else {
    //     return t;
    // }
}

float RadialCircle(vec2 uv) {
    float _maskScale = maskScale;
    float _maskHardness = maskHardness;
    float _maskPower = maskPower;
    float t = getProgress();
    if(blackHole) {
        _maskScale = mix(maskScale, blackHoleMaskScale, t);
        _maskHardness = mix(maskHardness, blackHoleMaskHardness, t);
        _maskPower = mix(maskPower, blackHoleMaskPower, t);
    } else if(hyper) {
        _maskScale = mix(maskScale, hyperMaskScale, t);
        _maskHardness = mix(maskHardness, hyperMaskHardness, t);
        _maskPower = mix(maskPower, hyperMaskPower, t);
    } else {
        _maskScale = mix(maskScale, normalMaskScale, t);
        _maskHardness = mix(maskHardness, normalMaskHardness, t);
        _maskPower = mix(maskPower, normalMaskPower, t);
    }
    float mask = (1.0 - RadialMask(uv, _maskScale, _maskHardness));
    return pow(mask, maskPower);
}

void PolarCoordinates(vec2 uv, vec2 center, float radialScale, float lengthScale, out vec2 Out) {

    vec2 delta = uv - center;
    float radius = length(delta) * 2.0 * radialScale;
    float angle = atan(delta.x, delta.y) * 1.0 / 6.28 * lengthScale;
    Out = vec2(radius, angle);

}

float noise_randomValue(vec2 seed) {
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise_interpolate(float a, float b, float t) {
    return (1.0 - t) * a + (t * b);
}

float noise_value(vec2 seed) {
    vec2 i = floor(seed);
    vec2 f = fract(seed);
    f = f * f * (3.0 - 2.0 * f);

    seed = abs(fract(seed) - 0.5);
    vec2 c0 = i + vec2(0.0);
    vec2 c1 = i + vec2(1.0, 0.0);
    vec2 c2 = i + vec2(0.0, 1.0);
    vec2 c3 = i + vec2(1.0, 1.0);

    float r0 = noise_randomValue(c0);
    float r1 = noise_randomValue(c1);
    float r2 = noise_randomValue(c2);
    float r3 = noise_randomValue(c3);

    float bottomOfGrid = noise_interpolate(r0, r1, f.x);
    float topOfGrid = noise_interpolate(r2, r3, f.x);

    float t = noise_interpolate(bottomOfGrid, topOfGrid, f.y);
    return t;
}

float simpleNoise(vec2 seed, float scale) {
    float t = 0.0;
    float freq = pow(2.0, float(0));
    float amp = pow(0.5, float(3 - 0));

    t += noise_value(vec2(seed.x * scale / freq, seed.y * scale / freq)) * amp;

    freq = pow(2.0, float(1));
    amp = pow(0.5, float(3 - 1));

    t += noise_value(vec2(seed.x * scale / freq, seed.y * scale / freq)) * amp;

    freq = pow(2.0, float(2));
    amp = pow(0.5, float(3 - 2));
    t += noise_value(vec2(seed.x * scale / freq, seed.y * scale / freq)) * amp;

    return t;
}

vec2 UV() {
    return gl_FragCoord.xy / resolution.xy;
}

vec4 InverseLerp(vec4 A, vec4 B, vec4 T) {
    return (T - A) / (B - A);
}

vec2 speedLines(float speedLineAnimation) {
    return vec2((-speedLineAnimation) * time * 2.0, 0.0);
}

void main() {

    float _radialScale = radialScale;
    float _lengthScale = lengthScale;
    float _speedLineAnimation = speedLineAnimation;
    float _speedLinePower = speedLinePower;
    float _speedLineMap = speedLineMap;
    float t = getProgress();
    if(blackHole) {
        _radialScale = mix(radialScale, blackHoleRadialScale, t);
        _lengthScale = mix(lengthScale, blackHoleLengthScale, t);
        _speedLineAnimation = mix(speedLineAnimation, blackHoleSpeedLineAnim, t);
        _speedLinePower = mix(speedLinePower, blackHoleSpeedLinePower, t);
        _speedLineMap = mix(speedLineMap, blackHoleSpeedLineMap, t);
    } else if(hyper) {
        _radialScale = mix(radialScale, hyperRadialScale, t);
        _lengthScale = mix(lengthScale, hyperLengthScale, t);
        _speedLineAnimation = mix(speedLineAnimation, hyperSpeedLineAnim, t);
        _speedLinePower = mix(speedLinePower, hyperSpeedLinePower, t);
        _speedLineMap = mix(speedLineMap, hyperSpeedLineMap, t);
    } else {
        _radialScale = mix(radialScale, normalRadialScale, t);
        _lengthScale = mix(lengthScale, normalLengthScale, t);
        _speedLineAnimation = mix(speedLineAnimation, normalSpeedLineAnim, t);
        _speedLinePower = mix(speedLinePower, normalSpeedLinePower, t);
        _speedLineMap = mix(speedLineMap, normalSpeedLineMap, t);
    }

    vec2 uv = UV();

    vec2 polar;
    PolarCoordinates(uv, vec2(0.5, 0.5), _radialScale, _lengthScale, polar);

    polar = polar + speedLines(_speedLineAnimation);
    float noise = simpleNoise(polar, 10.0);
    noise = pow(noise, _speedLinePower);
    vec4 color = InverseLerp(vec4(_speedLineMap), vec4(0.0), vec4(noise));
    Saturate(color);

    color = color * RadialCircle(uv);

    polar = vec2(noise);
    outColor = vec4(polar.x, polar.y, 1.0, 1.0);
    outColor = color;
}
