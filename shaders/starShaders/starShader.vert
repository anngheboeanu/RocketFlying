uniform float halfBoxWidth;
uniform float halfBoxHeight;
uniform float halfBoxDepth;
uniform vec3 centerPoint;
uniform float time;
uniform float streakCount;
uniform float speed;

float toSinRange(float nr) {
    return (nr * 2.0) - 1.0;
}
float rand(inout vec2 seed) {
    vec3 p3 = fract(vec3(seed.xyx) * .1031);

    p3 += dot(p3, p3.yzx + 33.33);

    seed = vec2(fract((p3.x + p3.y) * p3.z));
    return toSinRange(fract((p3.x + p3.y) * p3.z));
}

out vec2 vUv;
out float instanceId;
out vec4 pos;
vec3 getInstancePosition(int instanceNumber) {
    vec2 seed = vec2(instanceNumber);
    float widthOffset = rand(seed);
    float heightOffset = rand(seed);
    float depthOffset = rand(seed);

    vec3 offsetFromCenter = vec3(widthOffset * halfBoxWidth, heightOffset * halfBoxHeight, depthOffset * halfBoxDepth);
    return centerPoint + offsetFromCenter;
}

void main() {
    vUv = uv;

    instanceId = float(gl_InstanceID);
    int InstanceNumber = int(float(gl_InstanceID) / streakCount);
    float segmentIndex = float(gl_InstanceID) - float(InstanceNumber) * streakCount;
    float offsetSegment = 0.1 * segmentIndex;

    float centerZ = centerPoint.z;
    vec3 finalPos = position + getInstancePosition(InstanceNumber);
    finalPos.z = mod(finalPos.z - centerZ - time * speed + halfBoxDepth * 2.0, halfBoxDepth * 2.0) + centerZ - halfBoxDepth;

    vec4 viewPos = modelViewMatrix * vec4(finalPos, 1.0);

    pos = projectionMatrix * viewPos;
    gl_Position = projectionMatrix * viewPos;
}