// Rizona Studio · variant "vloeibaar". Eén klein WebGL-gereedschap en drie scènes:
// de hero (metaal, drieluik, baan, stijgende plas), de gietmal (piek) en de spiegel (slot).
// Alles wordt live getekend; er zijn geen beeldbestanden nodig. Kleuren komen uit de huisstijltokens.

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const COMMON = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uDpr;
const vec3 AMBER  = vec3(1.0, 0.816, 0.471);
const vec3 AMBERD = vec3(0.937, 0.714, 0.290);
const vec3 CYAN   = vec3(0.424, 0.820, 0.980);
const vec3 SILVER = vec3(0.788, 0.839, 0.890);
const vec3 INK    = vec3(0.929, 0.953, 0.984);
const vec3 CANVAS = vec3(0.031, 0.043, 0.055);
const vec3 NAVY   = vec3(0.012, 0.035, 0.071);
const vec3 GOOD   = vec3(0.435, 0.878, 0.651);

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
             mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < OCT; i++) { s += a * gnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; }
  return s;
}
float sdRound(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdSeg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
// Een donkere studio in Orbit-licht: een koele witte softbox linksboven, een cyaan strip rechts,
// een lange lichtstreep en hooguit een vleug amber.
vec3 studio(vec3 R, float key, float cool){
  vec3 c = vec3(0.008, 0.014, 0.026);
  float w = dot(R, normalize(vec3(-0.55, 0.62, 0.56)));
  c += mix(INK, CYAN, 0.3) * (smoothstep(0.86, 0.985, w) * 1.3 + smoothstep(0.42, 0.95, w) * 0.12) * key;
  float k = dot(R, normalize(vec3(0.86, -0.14, 0.50)));
  c += CYAN * (smoothstep(0.88, 0.995, k) * 0.7 + smoothstep(0.45, 0.95, k) * 0.06) * cool;
  c += SILVER * smoothstep(0.05, 0.0, abs(R.y - 0.30 + 0.18 * R.x)) * 0.24;
  c += AMBER * smoothstep(0.93, 0.995, dot(R, normalize(vec3(0.25, 0.9, 0.35)))) * 0.10 * key;
  c += vec3(0.03, 0.06, 0.10) * smoothstep(-0.1, -0.9, R.y);
  return c;
}
vec3 metal(vec3 N, vec3 base, float warm, float cool){
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float fres = pow(1.0 - clamp(N.z, 0.0, 1.0), 2.2);
  return base * (0.4 + 0.6 * N.z) + studio(R, warm, cool) * (0.85 + 0.9 * fres);
}
`;

// ---------------------------------------------------------------- hero ----
const HERO_SCENE = `#define OCT 4
${COMMON}
uniform vec2 uPtr; uniform float uPtrAmt; uniform float uExit; uniform float uShift;
uniform vec4 uTile[5]; uniform vec3 uTint[5]; uniform float uHover[5]; uniform float uTileR;
uniform sampler2D uAtlas; uniform sampler2D uOrbTex; uniform vec4 uOrb; uniform float uOrbOn;

vec2 foldWarp(vec2 uv, float t){ return 0.7 * vec2(fbm(uv * 0.9 + vec2(0.0, t)), fbm(uv * 0.9 + vec2(5.2, -0.8 * t))); }
float foldBands(vec2 q, float t){
  float a = sin(q.x * 2.3 + q.y * 1.2 + t * 1.7);
  float b = sin(q.x * -1.2 + q.y * 2.7 - t * 1.2);
  float h = 0.5 + 0.5 * mix(a, b, 0.35);
  return h * h * (3.0 - 2.0 * h);
}
float bump(vec2 uv){ vec2 d = uv - uPtr / uRes.y; return uPtrAmt * 0.16 * exp(-dot(d, d) * 26.0); }

vec3 background(vec2 fc){
  float H = uRes.y;
  vec2 uv = (fc + vec2(0.0, uShift)) / H;
  float t = uTime * 0.045;
  float e = 1.6 * uDpr / H;
  vec2 w = foldWarp(uv, t);
  float h0 = foldBands(uv + w, t) + bump(uv);
  float hx = foldBands(uv + vec2(e, 0.0) + w, t) + bump(uv + vec2(e, 0.0));
  float hy = foldBands(uv + vec2(0.0, e) + w, t) + bump(uv + vec2(0.0, e));
  vec2 g = vec2(hx - h0, hy - h0) / e;
  vec3 N = normalize(vec3(-g * 0.34, 1.0));
  vec3 col = metal(N, vec3(0.012, 0.024, 0.045), 0.9, 1.1);
  col = col / (1.0 + 0.8 * col);
  float x = fc.x / uRes.x;
  float side = smoothstep(0.16, 0.44, abs(x - 0.5));
  float ribbon = smoothstep(0.42, 0.68, h0);
  float vis = ribbon * side * (0.55 + 0.45 * uExit);
  vec2 q = fc / uRes;
  vec2 g1 = (q - vec2(0.5, 0.62)) * vec2(1.0, 1.5);
  vec2 g2 = (q - vec2(0.72, 0.9)) * vec2(1.0, 1.8);
  vec3 bg = NAVY + vec3(0.06, 0.16, 0.32) * 0.30 * exp(-dot(g1, g1) * 3.2)
                 + vec3(0.19, 0.27, 0.32) * 0.08 * exp(-dot(g2, g2) * 5.0);
  return mix(bg, col, vis);
}

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec3 col = background(fc);

  // De glazen tegels van de agents, met hun figuur uit de app.
  for (int i = 0; i < 5; i++) {
    vec4 R = uTile[i];
    vec3 tint = uTint[i];
    vec2 c = R.xy + 0.5 * R.zw;
    float sd = sdRound(fc - c, 0.5 * R.zw, uTileR);
    col += tint * exp(-max(sd, 0.0) / (22.0 * uDpr)) * 0.06 * step(0.0, sd);
    float cov = 1.0 - smoothstep(-0.8 * uDpr, 0.6 * uDpr, sd);
    if (cov > 0.0) {
      vec2 p = (fc - R.xy) / R.zw;
      vec3 gcol = mix(vec3(0.014, 0.03, 0.058), vec3(0.04, 0.075, 0.12), p.y) + tint * 0.045;
      float sheen = smoothstep(0.0, 0.18, p.x * 0.7 + p.y * 0.9 - 0.95) * smoothstep(0.36, 0.18, p.x * 0.7 + p.y * 0.9 - 0.95);
      gcol += INK * sheen * 0.07;
      vec2 fu = (p - vec2(0.5, 0.56)) / 0.7 + 0.5;
      if (fu.x > 0.0 && fu.x < 1.0 && fu.y > 0.0 && fu.y < 1.0) {
        vec4 f = texture2D(uAtlas, vec2((float(i) + fu.x) / 5.0, fu.y));
        float lift = 1.0 + 0.12 * uHover[i];
        gcol = gcol * (1.0 - f.a) + f.rgb * lift;
      }
      float rim = smoothstep(-3.2 * uDpr, -0.4 * uDpr, sd);
      gcol += mix(tint, INK, 0.4) * rim * (0.7 + 0.3 * uHover[i]);
      gcol += tint * exp(-abs(sd + 8.0 * uDpr) / (2.2 * uDpr)) * 0.10;
      col = mix(col, gcol, cov);
    }
  }

  // De echte orb van Orbit, onveranderd, als beeld uit zijn eigen render.
  vec2 ou = (fc - uOrb.xy) / uOrb.zw;
  if (uOrbOn > 0.5 && ou.x > 0.0 && ou.x < 1.0 && ou.y > 0.0 && ou.y < 1.0) {
    vec4 o = texture2D(uOrbTex, ou);
    col = col * (1.0 - o.a) + o.rgb;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const HERO_COMPOSITE = `#define OCT 3
${COMMON}
uniform sampler2D uScene;
uniform float uLevel; uniform float uBulge; uniform vec2 uPtr; uniform float uPtrAmt; uniform float uFloor;

float surf(float x){
  float xn = x / uRes.x * 2.0 - 1.0;
  return uLevel + uBulge * (1.0 - xn * xn) + uDpr * (1.2 * sin(x / uDpr * 0.009 + uTime * 0.6) + 0.7 * sin(x / uDpr * 0.023 - uTime * 0.9));
}
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes;
  vec3 above = texture2D(uScene, uv).rgb;
  float sy = surf(fc.x);
  float d = sy - fc.y;
  if (d < -1.0 * uDpr) {
    float g = exp(d / (16.0 * uDpr));
    gl_FragColor = vec4(above + mix(CYAN, INK, 0.45) * g * 0.12, 1.0);
    return;
  }
  float dd = max(d, 0.0);
  float k = 90.0 * uDpr;
  float depth = log(1.0 + dd / k);
  vec2 rp = vec2((fc.x - uRes.x * 0.5) / (k + dd) * 5.0, depth * 3.6 - uTime * 0.2);
  vec2 n = vec2(gnoise(rp * 1.7), gnoise(rp * 1.7 + 7.3)) + 0.5 * vec2(gnoise(rp * 3.9 + 2.0), gnoise(rp * 3.9 + 9.1));
  float amp = 0.6 + dd / uDpr * 0.028;
  vec2 pd = (fc - uPtr) * vec2(1.0, 2.8) / uDpr;
  float pr = length(pd);
  float ripple = uPtrAmt * sin(pr * 0.085 - uTime * 4.2) * exp(-pr * 0.011);
  vec2 off = n * amp * uDpr + vec2(ripple * 3.0, ripple * 7.0) * uDpr;
  float my = sy + dd * 0.94;
  vec2 ruv = clamp(vec2(fc.x + off.x, my + off.y) / uRes, vec2(0.0), vec2(1.0));
  vec3 refl = texture2D(uScene, ruv).rgb;
  float fres = mix(0.78, 0.04, smoothstep(0.0, uRes.y * 0.14, dd));
  vec3 deep = vec3(0.008, 0.02, 0.042);
  vec3 col = mix(deep, refl, fres);
  float rim = exp(-dd / (1.7 * uDpr));
  col += mix(CYAN, INK, 0.45) * rim * 0.9;
  float spec = pow(max(0.0, n.x * 0.6 + n.y * 0.4), 6.0) * 0.22 * (1.0 - smoothstep(0.0, uRes.y * 0.4, dd));
  col += mix(CYAN, INK, 0.5) * spec;
  col += INK * ripple * 0.05;
  col = mix(CANVAS, col, smoothstep(0.0, uFloor, uv.y));
  float cov = clamp(d / (1.2 * uDpr) + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(mix(above, col, cov), 1.0);
}`;

// ---------------------------------------------------------------- cast ----
const CAST = `#define OCT 4
${COMMON}
uniform vec4 uMould; uniform float uR;
uniform float uHeat; uniform float uFill; uniform float uReveal; uniform float uScan; uniform float uPolish;
uniform sampler2D uText;
uniform vec2 uPtr; uniform float uPtrAmt;

vec2 flowW(vec2 p, float t){ return 1.3 * vec2(fbm(p * 0.8 + vec2(0.0, t * 0.6)), fbm(p * 0.8 + vec2(4.0, -t * 0.4))); }
float flowH(vec2 p, vec2 w, float t){ return fbm(p + w + vec2(0.0, t * 0.9)); }
float textH(vec2 m){ return texture2D(uText, m).g; }
float textF(vec2 m){ return texture2D(uText, m).r; }

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 c = uMould.xy + 0.5 * uMould.zw;
  float sd = sdRound(fc - c, 0.5 * uMould.zw, uR);
  if (sd > 1.5 * uDpr) { gl_FragColor = vec4(0.0); return; }
  float rimW = 7.0 * uDpr;
  float outerCov = 1.0 - smoothstep(-0.8 * uDpr, 0.8 * uDpr, sd);

  if (sd > -rimW) {
    float s = clamp(-sd / rimW, 0.0, 1.0) * 2.0 - 1.0;
    float sx = sdRound(fc + vec2(1.0, 0.0) - c, 0.5 * uMould.zw, uR) - sd;
    float sy = sdRound(fc + vec2(0.0, 1.0) - c, 0.5 * uMould.zw, uR) - sd;
    vec2 g = normalize(vec2(sx, sy) + 1e-5);
    vec3 N = normalize(vec3(g * -s * 0.95, sqrt(max(0.0, 1.0 - s * s))));
    vec3 col = metal(N, vec3(0.03, 0.034, 0.04), 1.3, 1.0);
    gl_FragColor = vec4(col, outerCov);
    return;
  }

  vec2 m = (fc - uMould.xy) / uMould.zw;
  float fromTop = 1.0 - m.y;
  float t = uTime;
  float heat = uHeat;

  float front = uFill * 1.12 - 0.06 + 0.035 * sin(m.x * 8.0 + t * 1.8) * heat + 0.03 * gnoise(vec2(m.x * 5.0, t * 0.6));
  float liquid = 1.0 - smoothstep(front - 0.012, front + 0.012, fromTop);

  float scale = 3.2 / uMould.w;
  vec2 p = (fc - uMould.xy) * scale;
  float px = 1.5 * uDpr;
  float tt = t * mix(0.08, 0.55, heat);
  vec2 fw = flowW(p, tt);
  float f0 = flowH(p, fw, tt), fx = flowH(p + vec2(px * scale, 0.0), fw, tt), fy = flowH(p + vec2(0.0, px * scale), fw, tt);

  vec2 ts = px / uMould.zw;
  float th = textH(m), thx = textH(m + vec2(ts.x, 0.0)), thy = textH(m + vec2(0.0, ts.y));
  float rv = 1.0 - smoothstep(uReveal * 1.04 - 0.035, uReveal * 1.04, fromTop);
  float textAmt = rv * mix(0.35, 1.0, 1.0 - heat);

  vec2 pd = (fc - uPtr) / uDpr;
  float pr = length(pd);
  float rip = uPtrAmt * (0.25 + 0.75 * heat) * sin(pr * 0.12 - t * 6.0) * exp(-pr * 0.018);
  float ripx = uPtrAmt * (0.25 + 0.75 * heat) * sin(length((fc + vec2(px, 0.0) - uPtr) / uDpr) * 0.12 - t * 6.0) * exp(-pr * 0.018);
  float ripy = uPtrAmt * (0.25 + 0.75 * heat) * sin(length((fc + vec2(0.0, px) - uPtr) / uDpr) * 0.12 - t * 6.0) * exp(-pr * 0.018);

  float amp = mix(0.05, 1.0, heat) * (1.0 - 0.9 * uPolish);
  vec2 gF = vec2(fx - f0, fy - f0) / px * amp * 26.0;
  vec2 gT = vec2(thx - th, thy - th) / px * textAmt * 1.5;
  float face = textF(m) * textAmt;
  vec2 gR = vec2(ripx - rip, ripy - rip) / px * 2.0;
  vec3 N = normalize(vec3(-(gF + gT + gR), 1.0));

  vec3 chrome = metal(N, vec3(0.03, 0.036, 0.046), 1.25, 1.0);
  float hot = heat * smoothstep(-0.3, 0.45, f0);
  vec3 emit = mix(vec3(0.02, 0.09, 0.2), CYAN, hot) * (0.16 + 1.4 * hot * hot) * heat;
  vec3 liq = chrome * mix(1.0, 0.5, heat * 0.6) + emit;
  vec3 faceCol = mix(SILVER, INK, uPolish);
  liq = mix(liq, liq * 0.35 + faceCol * (0.55 + 0.4 * (1.0 - heat)), face * (0.35 + 0.42 * (1.0 - heat)));

  float scanOn = step(0.0, uScan);
  float sl = exp(-abs(fromTop - uScan) * uMould.w / (2.4 * uDpr)) * scanOn;
  liq += mix(CYAN, INK, 0.6) * sl * 0.8;
  liq += CYAN * 0.035 * scanOn * (1.0 - step(uScan, fromTop));
  float sweep = smoothstep(0.08, 0.0, abs(m.x * 0.7 + fromTop * 0.4 - (uPolish * 1.6 - 0.25)));
  liq += INK * sweep * 0.12 * uPolish * (1.0 - uPolish * 0.6);

  float edgeY = abs(fromTop - front) * uMould.w / uDpr;
  float brush = gnoise(vec2(m.x * 3.0, m.y * 260.0)) * 0.5 + gnoise(vec2(m.x * 9.0, m.y * 520.0)) * 0.25;
  vec3 Nc = normalize(vec3(0.0, brush * 0.35, 1.0));
  vec3 cavity = metal(Nc, vec3(0.016, 0.026, 0.042), 0.7, 0.7) * (0.8 + 0.2 * smoothstep(-40.0 * uDpr, -2.0 * uDpr, sd));
  cavity += SILVER * 0.035 * th;
  vec3 col = mix(cavity, liq, liquid);
  col += mix(CYAN, INK, 0.3) * exp(-edgeY / 5.0) * 0.5 * heat * step(0.02, uFill) * step(uFill, 0.995);

  float innerShade = smoothstep(-26.0 * uDpr, -rimW, sd);
  col *= 1.0 - 0.35 * innerShade;
  gl_FragColor = vec4(col, outerCov);
}`;

// --------------------------------------------------------------- mirror ---
const MIRROR = `#define OCT 3
${COMMON}
uniform float uLevel; uniform sampler2D uText; uniform vec2 uPtr; uniform float uPtrAmt;

void main(){
  vec2 fc = gl_FragCoord.xy;
  float d = uLevel - fc.y;
  if (d < 0.0) {
    float g = exp(d / (26.0 * uDpr));
    gl_FragColor = vec4(mix(CYAN, INK, 0.45), g * 0.16);
    return;
  }
  float k = 44.0 * uDpr;
  float depth = log(1.0 + d / k);
  vec2 rp = vec2((fc.x - uRes.x * 0.5) / (k + d) * 7.0, depth * 2.6 - uTime * 0.12);
  vec2 n = vec2(gnoise(rp * 1.5), gnoise(rp * 1.5 + 5.1)) * 0.6 + 0.3 * vec2(gnoise(rp * 4.1 + 1.0), gnoise(rp * 4.1 + 8.0));
  float amp = 0.8 + d / uDpr * 0.018;
  vec2 pd = (fc - uPtr) * vec2(1.0, 2.6) / uDpr;
  float pr = length(pd);
  float ripple = uPtrAmt * sin(pr * 0.08 - uTime * 3.6) * exp(-pr * 0.009);
  vec2 off = n * (amp + 1.2) * uDpr + vec2(ripple * 2.0, ripple * 8.0) * uDpr;
  vec2 ruv = vec2(fc.x + off.x, uLevel + d * 0.96 + off.y) / uRes;
  float txt = texture2D(uText, clamp(ruv, 0.0, 1.0)).r;
  float fres = mix(0.7, 0.18, smoothstep(0.0, uRes.y * 0.5, d));
  vec3 deep = vec3(0.008, 0.02, 0.04);
  vec3 col = deep + INK * txt * 0.26 * fres;
  float streak = exp(-abs(fc.y - uLevel + 0.0) / (3.0 * uDpr));
  col += mix(CYAN, INK, 0.45) * exp(-d / (1.6 * uDpr)) * 0.75;
  col += CYAN * 0.06 * fres * exp(-pow((fc.x / uRes.x - 0.5) * 2.2, 2.0)) * exp(-d / (90.0 * uDpr));
  col += INK * ripple * 0.06 * fres;
  col += mix(CYAN, INK, 0.5) * pow(max(0.0, n.x), 5.0) * 0.18 * fres;
  float a = clamp(d / (1.2 * uDpr) + 0.5, 0.0, 1.0);
  col = mix(CANVAS, col, smoothstep(0.0, 0.08, fc.y / uRes.y));
  gl_FragColor = vec4(col + streak * 0.0, a);
}`;

// -------------------------------------------------------------- runtime ---
function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error("shader: " + log);
  }
  return s;
}
function program(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(p));
  const cache = {};
  const loc = (n) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(p, n)));
  return { p, loc };
}
function context(canvas, alpha) {
  const opts = { alpha, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "high-performance" };
  const gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  if (!gl) return null;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return gl;
}
function texFrom(gl, source, unit, existing) {
  const tex = existing || gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
function sizeCanvas(canvas, w, h, dpr) {
  const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; return true; }
  return false;
}
function common(gl, P, s, W, H) {
  gl.uniform2f(P.loc("uRes"), W, H);
  gl.uniform1f(P.loc("uTime"), s.time);
  gl.uniform1f(P.loc("uDpr"), s.dpr);
}

// De hero: pass 1 tekent de wereld in een textuur, pass 2 legt de stijgende plas eroverheen
// en spiegelt de wereld daarin.
export function createHero(canvas) {
  const gl = context(canvas, false);
  if (!gl) return null;
  const scene = program(gl, HERO_SCENE);
  const comp = program(gl, HERO_COMPOSITE);
  let fbo = null, ftex = null, fw = 0, fh = 0, atlas = null, orbTex = null, orbOn = false;
  function target(W, H) {
    if (fbo && fw === W && fh === H) return;
    if (fbo) { gl.deleteFramebuffer(fbo); gl.deleteTexture(ftex); }
    ftex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ftex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ftex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fw = W; fh = H;
  }
  function premul(source, unit, tex) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const t = texFrom(gl, source, unit, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    return t;
  }
  return {
    gl,
    setAtlas(source) { atlas = premul(source, 1, atlas); },
    setOrb(source) { orbTex = premul(source, 2, orbTex); orbOn = true; },
    // s: { w, h, dpr, time, ptr, ptrAmt, poolPtrAmt, exit, shift, tiles:[[x,y,w,h] x5] css top-left,
    //      tints:[[r,g,b] x5], hover:[x5], radius, orb:[x,y,w,h], level, bulge, floor }
    render(s) {
      sizeCanvas(canvas, s.w, s.h, s.dpr);
      const W = canvas.width, H = canvas.height, k = s.dpr;
      target(W, H);
      const flipY = (y) => H - y * k;
      const rect = (r) => [r[0] * k, H - (r[1] + r[3]) * k, r[2] * k, r[3] * k];

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.useProgram(scene.p);
      common(gl, scene, s, W, H);
      gl.uniform2f(scene.loc("uPtr"), s.ptr[0] * k, flipY(s.ptr[1]));
      gl.uniform1f(scene.loc("uPtrAmt"), s.ptrAmt);
      gl.uniform1f(scene.loc("uExit"), s.exit);
      gl.uniform1f(scene.loc("uShift"), s.shift * k);
      gl.uniform4fv(scene.loc("uTile"), new Float32Array(s.tiles.flatMap(rect)));
      gl.uniform3fv(scene.loc("uTint"), new Float32Array(s.tints.flat()));
      gl.uniform1fv(scene.loc("uHover"), new Float32Array(s.hover));
      gl.uniform1f(scene.loc("uTileR"), s.radius * k);
      gl.uniform4fv(scene.loc("uOrb"), rect(s.orb));
      gl.uniform1f(scene.loc("uOrbOn"), orbOn ? 1 : 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atlas); gl.uniform1i(scene.loc("uAtlas"), 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, orbTex); gl.uniform1i(scene.loc("uOrbTex"), 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(comp.p);
      common(gl, comp, s, W, H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, ftex);
      gl.uniform1i(comp.loc("uScene"), 0);
      gl.uniform1f(comp.loc("uLevel"), s.level * k);
      gl.uniform1f(comp.loc("uBulge"), s.bulge * k);
      gl.uniform1f(comp.loc("uFloor"), s.floor);
      gl.uniform2f(comp.loc("uPtr"), s.ptr[0] * k, flipY(s.ptr[1]));
      gl.uniform1f(comp.loc("uPtrAmt"), s.poolPtrAmt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

// De gietmal: vloeibaar metaal dat stolt tot een post in reliëf.
export function createCast(canvas) {
  const gl = context(canvas, true);
  if (!gl) return null;
  const P = program(gl, CAST);
  let tex = null;
  return {
    gl,
    setText(source) { tex = texFrom(gl, source, 0, tex); },
    // s: { w, h, dpr, time, mould:[x,y,w,h] css top-left, radius, heat, fill, reveal, scan, polish, ptr, ptrAmt }
    render(s) {
      sizeCanvas(canvas, s.w, s.h, s.dpr);
      const W = canvas.width, H = canvas.height, k = s.dpr;
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(P.p);
      common(gl, P, s, W, H);
      const m = s.mould;
      gl.uniform4f(P.loc("uMould"), m[0] * k, H - (m[1] + m[3]) * k, m[2] * k, m[3] * k);
      gl.uniform1f(P.loc("uR"), s.radius * k);
      gl.uniform1f(P.loc("uHeat"), s.heat);
      gl.uniform1f(P.loc("uFill"), s.fill);
      gl.uniform1f(P.loc("uReveal"), s.reveal);
      gl.uniform1f(P.loc("uScan"), s.scan);
      gl.uniform1f(P.loc("uPolish"), s.polish);
      gl.uniform2f(P.loc("uPtr"), s.ptr[0] * k, H - s.ptr[1] * k);
      gl.uniform1f(P.loc("uPtrAmt"), s.ptrAmt);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(P.loc("uText"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

// De spiegel: het materiaal in rust, met de uitnodiging erin weerspiegeld.
export function createMirror(canvas) {
  const gl = context(canvas, true);
  if (!gl) return null;
  const P = program(gl, MIRROR);
  let tex = null;
  return {
    gl,
    setText(source) { tex = texFrom(gl, source, 0, tex); },
    render(s) {
      sizeCanvas(canvas, s.w, s.h, s.dpr);
      const W = canvas.width, H = canvas.height, k = s.dpr;
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(P.p);
      common(gl, P, s, W, H);
      gl.uniform1f(P.loc("uLevel"), H - s.level * k);
      gl.uniform2f(P.loc("uPtr"), s.ptr[0] * k, H - s.ptr[1] * k);
      gl.uniform1f(P.loc("uPtrAmt"), s.ptrAmt);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(P.loc("uText"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

// ----------------------------------------------------------------- aarde ---
// De aardfoto van de Live-pagina, die heel traag draait. Het oppervlak draait om het middelpunt van de
// planeet (ver onder het beeld); de rand met zijn gloed en de lucht blijven staan, zoals bij een echte
// planeet die onder de zon door draait.
const EARTH = `precision highp float;
uniform vec2 uRes; uniform sampler2D uTex; uniform sampler2D uLight; uniform float uShift;
const vec2 IMG = vec2(1536.0, 1024.0);
const vec2 C = vec2(760.0, 3370.0);
const float R = 2882.0;
// De foto heeft oppervlak tussen TMIN en TMIN + LOOP + BAND (in radialen om het middelpunt van de planeet).
// Na LOOP begint het oppervlak opnieuw; in de BAND vloeit het eind zacht over in het begin, zodat er geen naad is.
const float TMIN = -0.26;
const float LOOP = 0.40;
const float BAND = 0.12;
vec2 at(float th, float r) { return C + r * vec2(sin(th), -cos(th)); }
vec3 photo(vec2 Q) { vec2 q = clamp(Q / IMG, vec2(0.0), vec2(1.0)); return texture2D(uTex, vec2(q.x, 1.0 - q.y)).rgb; }
float light(vec2 Q) { vec2 q = clamp(Q / IMG, vec2(0.0), vec2(1.0)); return dot(texture2D(uLight, vec2(q.x, 1.0 - q.y)).rgb, vec3(0.3, 0.59, 0.11)); }
void main(){
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  vec2 P = uv * IMG;
  vec2 d = P - C;
  float r = length(d);
  float th = atan(d.x, -d.y);
  float u = mod(th - uShift - TMIN, LOOP);
  vec2 Q1 = at(TMIN + u, r);
  vec3 col = photo(Q1);
  float src = light(Q1);
  if (u < BAND) {
    vec2 Q2 = at(TMIN + u + LOOP, r);
    float w = smoothstep(0.0, 1.0, u / BAND);
    col = mix(photo(Q2), col, w);
    src = mix(light(Q2), src, w);
  }
  // Het licht blijft staan (de gloed van de opkomende zon), alleen wolken en land schuiven.
  col *= clamp((light(P) + 0.012) / (src + 0.012), 0.35, 2.6);
  vec3 base = photo(P);
  float surface = 1.0 - smoothstep(R - 70.0, R - 18.0, r);
  gl_FragColor = vec4(mix(base, col, surface), 1.0);
}`;
export function createEarth(canvas, image) {
  const gl = context(canvas, false);
  if (!gl) return null;
  const P = program(gl, EARTH);
  const tex = texFrom(gl, image, 0, null);
  // Een kleine, wazige kopie van de foto is de lichtkaart.
  const small = document.createElement("canvas");
  small.width = 48; small.height = 32;
  const c2 = small.getContext("2d");
  c2.filter = "blur(1.5px)";
  c2.drawImage(image, 0, 0, 48, 32);
  const lightTex = texFrom(gl, small, 1, null);
  return {
    gl,
    render(w, h, dpr, shift) {
      // Nooit scherper dan de foto zelf; dat scheelt veel rekenwerk op grote schermen.
      const k = Math.min(dpr, 1536 / Math.max(1, w));
      sizeCanvas(canvas, w, h, k);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(P.p);
      gl.uniform2f(P.loc("uRes"), canvas.width, canvas.height);
      gl.uniform1f(P.loc("uShift"), shift);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(P.loc("uTex"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, lightTex);
      gl.uniform1i(P.loc("uLight"), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
