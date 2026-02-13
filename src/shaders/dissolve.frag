uniform float uProgress;
uniform vec3 uOrigin;
uniform vec3 uColor;
uniform vec3 uEdgeColor;
uniform float uEdgeWidth;

varying vec3 vWorldPosition;
varying vec2 vUv;

// Simplex-like 3D noise (hash-based)
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise3d(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                     dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                     dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                     dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                     dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

void main() {
  // Distance-based dissolve from origin
  float dist = length(vWorldPosition - uOrigin);
  float noiseVal = noise3d(vWorldPosition * 3.0) * 0.5 + 0.5;

  // Threshold combines distance and noise
  float threshold = uProgress * 6.0; // Scale progress to cover cube radius
  float dissolveEdge = dist - noiseVal * 1.5;

  if (dissolveEdge < threshold - uEdgeWidth) {
    discard;
  }

  // Edge glow
  float edgeFactor = smoothstep(threshold - uEdgeWidth, threshold, dissolveEdge);
  vec3 finalColor = mix(uEdgeColor, uColor, edgeFactor);
  float alpha = edgeFactor < 1.0 ? 1.0 : 1.0;

  // Emit glow at the dissolve edge
  float glowIntensity = (1.0 - edgeFactor) * 2.0;

  gl_FragColor = vec4(finalColor + uEdgeColor * glowIntensity, alpha);
}
