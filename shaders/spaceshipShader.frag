#ifdef GL_ES
precision mediump float;
#endif


#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURFACE_DIST 0.01
#define PI 3.14159265359

uniform vec2 u_resolution;
uniform float u_time;

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}

vec3 colors[100];


struct RayMarchResult{
    float distance;
    int id;

};



RayMarchResult min(RayMarchResult a, RayMarchResult b)
{
    if (a.distance < b.distance)
    {
        return a;
    }
    return b;   
}
RayMarchResult max(RayMarchResult a, RayMarchResult b)
{
    if (a.distance > b.distance)
    {
        return a;
    }
    return b;   
}

RayMarchResult smoothmin(RayMarchResult a, RayMarchResult b, float k)
{
    float h = clamp(0.5 + 0.5 * (b.distance - a.distance)/k, 0.0, 1.0);
    float distance = mix(b.distance, a.distance, h) - k * h * (1.0 - h);
    int id = (a.distance < b.distance) ? a.id : b.id;
    return RayMarchResult(distance, id);
}


RayMarchResult scene(vec3 point)
{
    RayMarchResult distance;
    return distance;  
  
}

RayMarchResult raymarch(vec3 rayOrigin, vec3 rayDirection)
{
    float distanceOrigin = 0.0;
    int id = -1;

    for (int i = 0; i < MAX_STEPS; i++)
    {
        vec3 point = rayOrigin + rayDirection * distanceOrigin;
        float distanceScene = scene(point).distance;
        id = scene(point).id;
        distanceOrigin += distanceScene;

        if (distanceOrigin > MAX_DIST || distanceScene < SURFACE_DIST)
        {
            break;
        }
    }
    return RayMarchResult(distanceOrigin, id);
}

vec3 getNormal(vec3 point)
{
    vec2 e = vec2(0.01, 0.0);
    vec3 n = scene(point).distance - vec3(
        scene(point - e.xyy).distance,
        scene(point - e.yxy).distance,
        scene(point - e.yyx).distance
    );
    return normalize(n);
}


void main() {

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv -= 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 lightPosition = vec3(-10.0 , 10.0, 10.0);

    vec3 rayOrigin = vec3(0.0, 0.0, 5.0 );
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    RayMarchResult result = raymarch(rayOrigin, rayDirection);
    float d = result.distance;
    vec3 p = rayOrigin + rayDirection * d;

    vec3 color = vec3(1.0);

    if (d < MAX_DIST)
    {
        vec3 normal = getNormal(p);
        vec3 lightDirection = normalize(lightPosition - p);

        float diffuse = max(dot(normal, lightDirection), 0.0);
    }
    gl_FragColor = vec4(color, 1.0);

}
