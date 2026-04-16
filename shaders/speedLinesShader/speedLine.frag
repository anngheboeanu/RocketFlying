
uniform vec2 resolution;
uniform float time;

out vec4 outColor;



uniform float radialScale ;
uniform float lengthScale ;
uniform float speedLineAnimation ;
uniform float speedLinePower ;
uniform float speedLineMap ;

uniform float maskScale ;
uniform float maskHardness ;
uniform float maskPower ;
uniform vec2 center;

void Saturate(inout vec4 Out)
{
    Out = clamp(Out, 0.0, 1.0);
}



float RadialMask(vec2 uv, float scale, float hardness)
{
    // vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center) * scale;
    float mask = 1.0 - smoothstep(1.0 - hardness, 1.0, dist);
    return clamp(mask, 0.0, 1.0);
    // return mask;
    // return uv.x-2.0;
}
float RadialCircle(vec2 uv)
{
    float mask = ( 1.0 - RadialMask(uv, maskScale, maskHardness));
    return pow(mask, maskPower);
}


void PolarCoordinates(vec2 uv, vec2 center, float radialScale, float lengthScale, out vec2 Out )
{

    vec2 delta = uv-center;
    float radius = length(delta) * 2.0 * radialScale;
    float angle = atan(delta.x,delta.y) * 1.0/ 6.28 * lengthScale;
    Out = vec2(radius, angle);

}

float noise_randomValue(vec2 seed)
{
    return fract(sin(dot(seed, vec2(12.9898, 78.233)))*43758.5453);
}

float noise_interpolate(float a, float b, float t)
{
    return (1.0-t)*a + (t*b);
}

float noise_value(vec2 seed)
{
    vec2 i = floor(seed);
    vec2 f = fract(seed);
    f = f*f*(3.0-2.0*f);

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

float simpleNoise(vec2 seed, float scale)
{
    float t = 0.0;
    float freq = pow(2.0, float(0));
    float amp = pow(0.5, float(3-0));

    t += noise_value(vec2(seed.x*scale/freq, seed.y*scale/freq)) * amp;

    freq = pow(2.0, float(1));
    amp = pow(0.5, float(3-1));
    
    t += noise_value(vec2(seed.x*scale/freq, seed.y*scale/freq)) * amp;

    freq = pow(2.0, float(2));
    amp = pow(0.5, float(3-2));
    t += noise_value(vec2(seed.x*scale/freq, seed.y*scale/freq)) * amp;

    return t;
}


vec2 UV()
{
    return gl_FragCoord.xy / resolution.xy;
}


vec4 InverseLerp(vec4 A, vec4 B, vec4 T)
{
    return (T-A)/(B-A);
}


vec2 speedLines(float speedLineAnimation)
{
    return vec2(
        (-speedLineAnimation) * time *0.001,
        0.0
    );
}


void main() {
    
    vec2 uv = UV();

    vec2 polar;
    PolarCoordinates(uv, vec2(0.5, 0.5), radialScale, lengthScale, polar);

    polar = polar + speedLines(speedLineAnimation);
    float noise = simpleNoise(polar, 10.0);
    noise = pow(noise, speedLinePower);
    vec4 color = InverseLerp(vec4(speedLineMap), vec4(0.0), vec4(noise));
    Saturate(color);

    color = color * RadialCircle(uv);

    polar = vec2(noise);
    outColor = vec4(polar.x, polar.y, 1.0, 1.0);
    outColor = color;
}

// uniform vec2 resolution;

// out vec4 outColor;
// void main() {
//         vec2 uv = gl_FragCoord.xy / resolution;

//     // if (uv.x>0.0) {
//     //     discard;
//     // }

//     outColor = vec4(uv,1.0, .5);
// }