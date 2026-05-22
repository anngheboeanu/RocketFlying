#ifdef GL_ES
precision mediump float;
#endif

#define SURF_DIST 0.01
#define MAX_STEPS 200
#define MAX_DIST 10000.0
#define SURFACE_DIST 0.0001
#define PI 3.14159265359
uniform vec2 u_resolution;
uniform float u_time;

float sunRadius = 3.0;
vec3 sunPos = vec3(0, 25.0, -60.0);

vec3 normalSunColor = vec3(0.9804, 0.5961, 0.0902);
vec3 normalSunInbetweenColor = vec3(1.0, 0.0, 0.251);
vec3 normalSunDarkSpotColor = vec3(0.8941, 0.5529, 0.1412);
vec3 normalSunInnerShine = vec3(1.0, 0.9176, 0.0);

vec3 blackHole = vec3(1.0);
vec3 blackInbetweenColor = vec3(1.0);
vec3 blackDarkSpotColor = vec3(0.0);
vec3 blackInnerShine = vec3(1.0);

float noiseFreq = 7.0;
float duration = 5.0;

bool sunToBlackHole = true;
bool startChange = false;

float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(.1, .2, .3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {

    vec3 i = floor(x);
    vec3 f = fract(x);

    f = f * f * (3.0 - 2.0 * f);

    float n = mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);

    return n;
}

float sdfSphere(vec3 point, float radius) {
    return length(point) - radius;
}
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}
float getProgress() {

    return 1.0;
    if(!startChange)
        return 0.0;
    float t = clamp(u_time / duration, 0.0, 1.0);
    if(!sunToBlackHole)
        t = 1.0 - t;
    return t;
}

float sdfPlane(vec3 p, vec3 normal, float h) {
    return dot(p, normal) + h;
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float scene(vec3 point) {
    vec3 pt = point - sunPos;

    float sphere = sdfSphere(pt, sunRadius);

    float t = getProgress();
    float realFreq = mix(noiseFreq, 0.0, t);
    float n = noise(pt * realFreq + u_time * 0.5);
    sphere += n * 0.1;

    float innerRadius = sunRadius * 1.0;
    float outerRadius = sunRadius * 2.0;
    float thickness = 0.001;

    vec2 p = pt.xz;
    float distToCenterXZ = length(p);
    float disk = max(distToCenterXZ - outerRadius, innerRadius - distToCenterXZ);

    disk = max(disk, abs(pt.y) - thickness);
    disk = disk + 1.0 * (1.0 - getProgress());

    float stripes = sin(1000.0);
    disk += stripes * 0.01;

    return smin(sphere, disk, 1.0);
}

float glow = 0.0;
float secondaryGlow = 0.0;

float raymarch(vec3 rayOrigin, vec3 rayDirection) {
    float distanceOrigin = 0.0;

    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 point = rayOrigin + rayDirection * distanceOrigin;
        float distanceScene = scene(point);

        glow += pow(0.05, distanceScene * 4.0);
        secondaryGlow += 0.05;
        distanceOrigin += distanceScene;

        if(distanceOrigin > MAX_DIST || distanceScene < SURFACE_DIST) {
            break;
        }
    }
    return distanceOrigin;
}

vec3 getNormal(vec3 point) {
    vec2 e = vec2(0.01, 0.0);
    vec3 n = scene(point) - vec3(scene(point - e.xyy), scene(point - e.yxy), scene(point - e.yyx));
    return normalize(n);
}

vec3 HorizonLine(vec2 uv) {

    float centerY = 0.23;

    float d = abs(uv.y - centerY);
    float line = exp(-d * 120.0);

    float glow = exp(-d * 15.0);

    vec3 col = vec3(1.0) * line +
        vec3(0.0, 0.0, 0.0) * glow;
    return col;
}

vec3 GetSunColor(vec3 currentCol) {

    float t = getProgress();

    vec3 darkSpotColor = mix(normalSunDarkSpotColor, blackDarkSpotColor, t);
    vec3 inbetweenColor = mix(normalSunInbetweenColor, blackInbetweenColor, t);
    vec3 innerShine = mix(normalSunInnerShine, blackInnerShine, t);
    vec3 sunColor = mix(normalSunColor, blackHole, t);

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv -= 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 lightPosition = vec3(100.0, 10.0, 10.0);
    lightPosition = vec3(-10.0, 10.0, 10.0);

    vec3 rayOrigin = vec3(0.0, 0.0, 4.0);
    rayOrigin = vec3(0, 20, -40);
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    float d = raymarch(rayOrigin, rayDirection);
    vec3 p = rayOrigin + rayDirection * d;

    vec3 color = currentCol;
    if(d < MAX_DIST) {

        vec3 normal = getNormal(p);

        float diffuse = max(dot(normal, p), 0.0);
        vec3 fire = mix(darkSpotColor, inbetweenColor, diffuse);
        // fire = mix(inbetweenColor, darkSpotColor, diffuse);
        color = fire;

        // adding innerShine depending on camera pos
        float innerShineExp = max(dot(normal, -rayDirection), 0.0);
        innerShineExp = pow(innerShineExp, 10.0);
        color += innerShine * innerShineExp * 0.9;

        //adding a rim light in similar manner just now we want it where the normal is perpendicular to camera -> edge
        float rim = 1.0 - max(dot(normal, -rayDirection), 0.0); // rim is one when dod is perpendicular
        rim = pow(rim, 7.);
        color += innerShine * rim * 5.0;

    } else {
        color += sunColor * glow;
    }
    color += sunColor * secondaryGlow * 0.2;

    return color;
}

void main() {

    gl_FragColor = vec4(GetSunColor(vec3(0.0, 0.0, 0.0)), 1.0);

}
