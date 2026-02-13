uniform sampler2D uTexture;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uTint;

varying vec2 vUv;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);

  // Scanlines
  float scanline = sin(vUv.y * 200.0 + uTime * 2.0) * 0.08;

  // Flicker
  float flicker = 0.95 + 0.05 * sin(uTime * 15.0 + sin(uTime * 3.0) * 5.0);

  // Chromatic aberration
  float offset = 0.003 * sin(uTime * 1.5);
  float r = texture2D(uTexture, vUv + vec2(offset, 0.0)).r;
  float g = texColor.g;
  float b = texture2D(uTexture, vUv - vec2(offset, 0.0)).b;

  vec3 color = vec3(r, g, b) * uTint;
  color += scanline;
  color *= flicker;

  float alpha = texColor.a * uOpacity * flicker;
  gl_FragColor = vec4(color, alpha);
}
