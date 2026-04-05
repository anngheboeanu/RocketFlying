#version 300 es
precision highp float;

uniform vec2 u_resolution;
// uniform float u_time;

#define MAX_DIST 10000.0
#define EPSILON 0.001
#define PI 3.14159265359

#define MAX_BOUNCES 10 
#define RAYS_PER_PIXEL 8 

struct Ray {
    vec3 origin;
    vec3 dir;
};

struct Material {
    vec3 color;
    vec3 emissionColour;
    float emissionStrength;
};

struct Sphere {
    vec3 center;
    float radius;
    Material material;
};

struct HitInfo {
    bool didHit;
    float dist;
    vec3 hitPoint;
    vec3 normal;
    Material material;
};

#define NUM_SPHERES 4
Sphere spheres[NUM_SPHERES];

void createScene() {

    spheres[0].center = vec3(0.0,   1.5, 2.0);
    spheres[0].radius = 1.0;
    spheres[0].material.color = vec3(1.0, 0.1, 0.1);
    spheres[0].material.emissionStrength = 0.0;

    spheres[1].center = vec3(4.0, 1.0, 2.0); 
    spheres[1].radius = 1.5;
    spheres[1].material.color = vec3(0.0, 0.0, 1.0);
    spheres[1].material.emissionColour = vec3(0.5, 0.8, 1.0);
    spheres[1].material.emissionStrength = 4.0;

    spheres[2].center = vec3(-3.0, 0.0, 2.0);
    spheres[2].radius = 1.3;
    spheres[2].material.color = vec3(0.2, 0.9, 0.2);
    spheres[2].material.emissionStrength = 0.0;
    
    spheres[3].center = vec3(0.0, -101.0, 2.0); 
    spheres[3].radius = 100.0;
    spheres[3].material.color = vec3(0.502, 0.0706, 0.4588);
}

HitInfo RaySphereIntersection(Ray ray, Sphere sphere) {
    HitInfo hitinfo;
    hitinfo.didHit = false;
    hitinfo.dist = MAX_DIST;

    vec3 offsetRayOrigin = ray.origin - sphere.center;

    float a = dot(ray.dir, ray.dir);
    float b = 2.0 * dot(offsetRayOrigin, ray.dir);
    float c = dot(offsetRayOrigin, offsetRayOrigin) - sphere.radius * sphere.radius;

    float discriminant = b * b - 4.0 * a * c;

    if (discriminant >= 0.0) {
        float dist = (-b - sqrt(discriminant)) / (2.0 * a);

        if (dist > EPSILON) { 
            hitinfo.didHit = true;
            hitinfo.dist = dist;
            hitinfo.hitPoint = ray.origin + ray.dir * dist;
            hitinfo.normal = normalize(hitinfo.hitPoint - sphere.center);
        }
    }
    return hitinfo;
}

HitInfo CalculateRayCollision(Ray ray) {
    HitInfo closestHit;
    closestHit.didHit = false;
    closestHit.dist = MAX_DIST;

    for (int i = 0; i < NUM_SPHERES; i++) {
        HitInfo hitinfo = RaySphereIntersection(ray, spheres[i]);
        if (hitinfo.didHit && hitinfo.dist < closestHit.dist) {
            closestHit = hitinfo;
            closestHit.material = spheres[i].material;
        }
    }
    return closestHit;
}

float random(inout vec2 seed) {
    seed = fract(seed * vec2(123.34, 456.21));
    seed += dot(seed, seed + 45.32);
    return fract(seed.x * seed.y);
}

vec3 randomCosineDirection(vec3 normal, inout vec2 seed) {
    float r1 = random(seed);
    float r2 = random(seed);
    
    float phi = 2.0 * PI * r1;
    float sqrtR2 = sqrt(r2);
    
    vec3 localDir = vec3(
        cos(phi) * sqrtR2,
        sin(phi) * sqrtR2,
        sqrt(1.0 - r2) 
    );
    
    vec3 randomVec = abs(normal.z) < 0.999 ? vec3(0,0,1) : vec3(1,0,0);
    vec3 tangent = normalize(cross(normal, randomVec));
    vec3 bitangent = cross(normal, tangent);
    
    return tangent * localDir.x + bitangent * localDir.y + normal * localDir.z;
}



vec3 Trace(Ray ray, inout vec2 seed) {
    vec3 incomingLight = vec3(0.0);
    vec3 rayColour = vec3(1.0);

    for (int i = 0; i < MAX_BOUNCES; i++) {
        HitInfo hitInfo = CalculateRayCollision(ray);
        
        if (hitInfo.didHit) {
            vec3 emittedLight = hitInfo.material.emissionColour * hitInfo.material.emissionStrength;
            incomingLight += emittedLight * rayColour;

            ray.origin = hitInfo.hitPoint + hitInfo.normal * EPSILON;
            
            ray.dir = randomCosineDirection(hitInfo.normal, seed);

            rayColour *= hitInfo.material.color; 
            
            // Russian Roulette to terminate rays early if they have little energy
            // float p = max(rayColour.r, max(rayColour.g, rayColour.b));
            // if (random(seed) > p) break;
            // rayColour *= 1.0/p;
        } else {
            float t = 0.5 * (ray.dir.y + 1.0);
            vec3 skyColor = mix(vec3(0.1), vec3(0.05, 0.05, 0.1), t);
            incomingLight += skyColor * rayColour; 
            break;
        }
    }
    return incomingLight;
}

out vec4 outColor;

// --- Main ---
void main() {
    createScene();
    
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Camera Setup
    vec3 cameraPos = vec3(0.0, 2.0, -8.0);
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    
    vec3 fwd = normalize(lookAt - cameraPos);
    vec3 right = normalize(cross(worldUp, fwd));
    vec3 up = cross(fwd, right);

    vec3 totalIncomingLight = vec3(0.0);
    
    vec2 seed = gl_FragCoord.xy +   71.23456; 

    for(int i = 0; i < RAYS_PER_PIXEL; i++) {
        vec2 jitter = vec2(random(seed), random(seed)) - 0.5;
        vec2 subPixelUV = (gl_FragCoord.xy + jitter - 0.5 * u_resolution.xy) / u_resolution.y;
        
        Ray ray;
        ray.origin = cameraPos;
        ray.dir = normalize(fwd + subPixelUV.x * right + subPixelUV.y * up);
        
        totalIncomingLight += Trace(ray, seed);
    }

    vec3 pixelColor = totalIncomingLight / float(RAYS_PER_PIXEL);

    // Gamma Correction (Linear -> sRGB)
    // Makes dark areas less crushed and colors more vibrant
    pixelColor = pow(pixelColor, vec3(1.0 / 2.2));

    outColor = vec4(pixelColor, 1.0);
}