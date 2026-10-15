// De levende orb van Orbit, letterlijk overgenomen uit lucianovix/orbit-scribe-76
// (src/components/research/studio/orb-scene.ts, orb-energy.ts en orb-frame-clock.ts op main f249c00e),
// met esbuild omgezet naar gewoon JavaScript. Toegevoegd voor de website: setAlign() laat de twee
// ringen uitlijnen bij het akkoord. Bij align 0 is de orb identiek aan die in de app.
// Variant "vloeibaar": een optionele onFrame-terugroep na elke render, zodat de pagina het beeld
// in het vloeibare metaal kan spiegelen. Het uiterlijk van de orb verandert daardoor niet.
import * as THREE from "./assets/vendor/three.module.min.js";

const ENERGY_SPEED = { rest: 1, busy: 2.2 };
const ENERGY_GLOW = { rest: 1, busy: 1.35 };
const SETTLE_SECONDS = 0.35;
function easeTowards(current, target, seconds) {
  if (!(seconds > 0)) return current;
  return current + (target - current) * (1 - Math.exp(-seconds / SETTLE_SECONDS));
}

const FRAME_INTERVAL = 1e3 / 60;
const FRAME_TOLERANCE = 1;
function createOrbFrameClock() {
  let lastRendered = null;
  let nextFrame = 0;
  return {
    sample(now) {
      if (lastRendered === null) {
        lastRendered = now;
        nextFrame = now + FRAME_INTERVAL;
        return 0;
      }
      if (now + FRAME_TOLERANCE < nextFrame) return null;
      const step = Math.min((now - lastRendered) / 1e3, 0.05);
      lastRendered = now;
      const missed = Math.floor(Math.max(0, now - nextFrame) / FRAME_INTERVAL);
      nextFrame += (missed + 1) * FRAME_INTERVAL;
      return step;
    },
    reset() {
      lastRendered = null;
      nextFrame = 0;
    }
  };
}

const vertexShader = `
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPosition = position;
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = `
  uniform float uTime;
  uniform float uGlow;
  uniform vec3 uCamera;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.17, 0.31, 0.57));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float cloud(vec3 p) {
    return noise(p) * 0.57 + noise(p * 2.1) * 0.28 + noise(p * 4.3) * 0.15;
  }
  mat2 turn(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
  void main() {
    // Integrate light THROUGH the sphere. Front and rear filaments have
    // different positions and attenuation, rather than painting a spiral on it.
    vec3 ray = normalize(vPosition - uCamera);
    float travel = max(0.0, -2.0 * dot(vPosition, ray));
    vec3 energy = vec3(0.0);
    float transmission = 1.0;
    float t = uTime * 0.09;
    float jitter = hash(vec3(gl_FragCoord.xy, 17.0));
    for (int i = 0; i < 36; i++) {
      float distance = (float(i) + 0.4 + jitter * 0.2) / 36.0 * travel;
      vec3 q = (vPosition + ray * distance) / 0.78;
      float radius = length(q);
      vec3 flow = q;
      flow.xy *= turn(q.z * 1.5 + radius * 0.7 - t);
      flow.yz *= turn(q.x * 0.75 + t * 0.35);
      float vapor = cloud(flow * 1.7 + vec3(t, -t * 0.4, t * 0.2));
      // Broad, warped folds stay coherent through the volume. Their luminous
      // crests fade into blue vapor; the heart lights the folds from within.
      float curl = atan(flow.y, flow.x) * 2.0 + length(flow.xy) * 3.8 + flow.z * 3.5 + vapor * 6.0;
      float fold = exp(-pow(sin(curl) / 0.23, 2.0));
      float envelope = 1.0 - smoothstep(0.73, 1.0, radius);
      float density = fold * envelope * (0.4 + vapor * 0.6);
      vec3 heartPosition = q - vec3(0.14, -0.12, 0.05);
      float heart = exp(-dot(heartPosition, heartPosition) * 18.0);
      vec3 light = vec3(0.008, 0.12, 0.48) * density * 1.5;
      light += vec3(0.08, 0.45, 1.15) * density * density * density * 2.0;
      light += vec3(0.28, 1.0, 1.8) * heart * (0.3 + density * 5.0);
      energy += transmission * light * travel * 0.11 * uGlow;
      transmission *= 1.0 - density * 0.14;
    }
    vec3 n = normalize(vNormal);
    float facing = abs(dot(n, normalize(vView)));
    float rim = pow(1.0 - facing, 3.7);
    // Reflected long studio lights follow the curved shell, with a dark gap
    // between the reflected strip and the outer Fresnel edge.
    float strip = exp(-pow((n.x + n.y * 0.42 + 0.66) * 23.0, 2.0));
    strip *= smoothstep(-0.1, 0.65, n.y) * facing;
    float lowerStrip = exp(-pow((n.y + n.x * 0.6 + 0.62) * 28.0, 2.0));
    vec3 color = vec3(0.001, 0.006, 0.018) + energy;
    color += vec3(0.012, 0.07, 0.2) * rim * 0.8;
    color += vec3(0.4, 0.72, 1.0) * strip * 1.2;
    color += vec3(0.12, 0.48, 0.9) * lowerStrip * 0.6;
    vec3 reflection = reflect(-normalize(vView), n);
    float highlight = pow(max(dot(reflection, normalize(vec3(-1.0, 0.4, -0.3))), 0.0), 65.0);
    color += vec3(0.4, 0.9, 1.8) * highlight * 2.5;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }

`;
function createOrbScene(canvas, onContextLost, onFrame) {
  const disposers = [];
  const cleanup = () => {
    for (const dispose of disposers.splice(0).reverse()) {
      try {
        dispose();
      } catch {
      }
    }
  };
  try {
    return initializeOrbScene(canvas, onContextLost, disposers, cleanup, onFrame);
  } catch (error) {
    cleanup();
    throw error;
  }
}
function initializeOrbScene(canvas, onContextLost, disposers, cleanup, onFrame) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  disposers.push(() => {
    renderer.dispose();
    renderer.forceContextLoss();
  });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(0, 0.1, 8.2);
  camera.lookAt(0, 0, 0);
  const geometries = /* @__PURE__ */ new Set();
  const materials = /* @__PURE__ */ new Set();
  disposers.push(() => {
    geometries.forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    scene.clear();
  });
  const keepGeometry = (value) => {
    geometries.add(value);
    return value;
  };
  const keepMaterial = (value) => {
    materials.add(value);
    return value;
  };
  const environment = new THREE.Scene();
  environment.background = new THREE.Color(132882);
  for (const [x, y, z, w, h, color, strength] of [
    [-3, 3, 3, 3.8, 0.38, 14282751, 9],
    [3, 1, 2, 0.28, 4, 7977727, 7],
    [-3, -1, 1, 0.2, 2.5, 16766368, 5],
    [0, 4, -3, 3, 0.2, 10014207, 5]
  ]) {
    const softbox = new THREE.Mesh(
      keepGeometry(new THREE.PlaneGeometry(w, h)),
      keepMaterial(new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }))
    );
    softbox.position.set(x, y, z);
    softbox.lookAt(0, 0, 0);
    environment.add(softbox);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  try {
    const environmentTarget = pmrem.fromScene(environment, 0.012);
    disposers.push(() => environmentTarget.dispose());
    scene.environment = environmentTarget.texture;
  } finally {
    environment.clear();
    pmrem.dispose();
  }
  const keyLight = new THREE.DirectionalLight(15070719, 1.4);
  keyLight.position.set(-3, 4, 4);
  scene.add(keyLight, new THREE.AmbientLight(8240639, 0.08));
  const blueLight = new THREE.PointLight(7654143, 22, 14, 2);
  blueLight.position.set(2, 0.8, 2);
  const warmLight = new THREE.PointLight(16766886, 15, 12, 2);
  warmLight.position.set(-3, 0.4, 1);
  scene.add(blueLight, warmLight);
  const world = new THREE.Group();
  world.rotation.z = -0.13;
  scene.add(world);
  const coreGeometry = keepGeometry(new THREE.SphereGeometry(0.78, 80, 64));
  const coreMaterial = keepMaterial(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGlow: { value: ENERGY_GLOW.rest }, uCamera: { value: new THREE.Vector3() } },
    vertexShader,
    fragmentShader
  }));
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  world.add(core);
  const shell = new THREE.Mesh(
    keepGeometry(new THREE.SphereGeometry(0.825, 80, 64)),
    keepMaterial(new THREE.MeshPhysicalMaterial({
      color: 11131391,
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.5,
      side: THREE.FrontSide,
      depthWrite: false
    }))
  );
  world.add(shell);
  function ringGeometry(radius) {
    const points = Array.from({ length: 49 }, (_, i) => {
      const angle = i / 48 * Math.PI * 2;
      return new THREE.Vector2(radius + Math.cos(angle) * 0.105, Math.sin(angle) * 0.046);
    });
    const geometry = keepGeometry(new THREE.LatheGeometry(points, 320));
    geometry.rotateX(Math.PI / 2);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      const angle = Math.atan2(y, x);
      const radial = Math.hypot(x, y) - radius;
      const twist = Math.sin(angle * 2 + 0.6) * 0.52 + Math.cos(angle * 3) * 0.18;
      const offset = radial * Math.cos(twist) - z * Math.sin(twist);
      position.setXYZ(i, Math.cos(angle) * (radius + offset), Math.sin(angle) * (radius + offset), radial * Math.sin(twist) + z * Math.cos(twist));
    }
    geometry.computeVertexNormals();
    return geometry;
  }
  const ringMaterial = keepMaterial(new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: `
      varying vec3 vPosition;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      float softbox(vec3 r, vec3 light, vec3 along, float width, float length) {
        float face = max(dot(r, light), 0.0);
        vec3 across = normalize(cross(light, along));
        return exp(-pow(dot(r, across) / width, 2.0) - pow(dot(r, along) / length, 2.0)) * pow(face, 4.0);
      }
      void main() {
        vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
        vec3 view = normalize(vView);
        vec3 r = reflect(-view, n);
        float facing = abs(dot(n, view));
        float fresnel = pow(1.0 - facing, 3.5);
        float key = softbox(r, normalize(vec3(-0.45, 0.65, 0.8)), normalize(vec3(0.83, 0.55, 0.02)), 0.14, 0.75);
        float cool = softbox(r, normalize(vec3(0.72, 0.12, 0.7)), normalize(vec3(-0.12, 0.99, -0.05)), 0.16, 0.6);
        float warm = softbox(r, normalize(vec3(-0.8, -0.24, 0.6)), normalize(vec3(-0.24, 0.97, 0.02)), 0.12, 0.4);
        float lower = softbox(r, normalize(vec3(0.1, -0.75, 0.65)), normalize(vec3(0.99, 0.1, -0.04)), 0.13, 0.65);
        float bevel = smoothstep(0.68, 0.98, abs(cos(vUv.y * 6.283185)));
        float angle = atan(vPosition.y, vPosition.x);
        float reflectedArc = exp(-pow(sin(angle + 0.4) * 4.4, 2.0));
        float warmArc = exp(-pow((angle - 2.45) * 5.0, 2.0));
        vec3 color = vec3(0.002, 0.009, 0.024);
        color += vec3(0.5, 0.88, 1.6) * reflectedArc * (0.10 + bevel * 1.2 + fresnel);
        color += vec3(1.6, 1.15, 0.68) * warmArc * (0.1 + bevel * 0.65 + fresnel);
        color += vec3(0.18, 0.4, 0.75) * bevel * 0.65;
        color += vec3(0.12, 0.32, 0.62) * fresnel * 1.5;
        color += vec3(1.1, 1.5, 2.0) * key * 3.5;
        color += vec3(0.22, 0.65, 1.5) * cool * 3.5;
        color += vec3(1.5, 1.02, 0.55) * warm * 2.8;
        color += vec3(0.32, 0.78, 1.5) * lower * 2.5;
        float light = key + cool + warm + lower + reflectedArc * 0.7 + warmArc * 0.6;
        gl_FragColor = vec4(color, clamp(0.12 + bevel * 0.55 + fresnel * 0.6 + light * 0.95, 0.0, 0.98));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide
  }));
  const rings = [];
  const lights = [];
  const reflectedLights = [];
  const glowPixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const dx = (x - 31.5) / 31.5, dy = (y - 31.5) / 31.5;
    const radius = Math.hypot(dx, dy);
    const alpha = Math.min(1, Math.max(0, Math.exp(-radius * radius * 9) * 0.23 + Math.exp(-radius * radius * 130) * 0.8 + Math.exp(-Math.abs(dx) * 100 - dy * dy * 8) * 0.24 + Math.exp(-Math.abs(dy) * 100 - dx * dx * 16) * 0.24 - 1e-3));
    const offset = (y * 64 + x) * 4;
    glowPixels.set([255, 255, 255, Math.round(alpha * 255)], offset);
  }
  const glowTexture = new THREE.DataTexture(glowPixels, 64, 64);
  disposers.push(() => glowTexture.dispose());
  glowTexture.minFilter = THREE.LinearFilter;
  glowTexture.magFilter = THREE.LinearFilter;
  glowTexture.needsUpdate = true;
  const coreHalo = new THREE.Sprite(keepMaterial(new THREE.SpriteMaterial({
    map: glowTexture,
    color: 3907327,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })));
  coreHalo.scale.setScalar(3);
  world.add(coreHalo);
  for (const [x, y, z, size, opacity] of [[0.53, 0.35, 0.5, 0.95, 0.95], [-0.35, -0.58, 0.44, 0.6, 0.6]]) {
    const glint = new THREE.Sprite(keepMaterial(new THREE.SpriteMaterial({
      map: glowTexture,
      color: 8835071,
      opacity,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })));
    glint.position.set(x, y, z);
    glint.scale.setScalar(size);
    world.add(glint);
  }
  const filament = new THREE.Mesh(
    keepGeometry(new THREE.TorusGeometry(1.64, 6e-3, 6, 180)),
    keepMaterial(new THREE.MeshBasicMaterial({ color: 8505087, transparent: true, opacity: 0.22, depthWrite: false }))
  );
  filament.scale.set(1.15, 0.76, 1);
  world.add(filament);
  for (let i = 0; i < 2; i++) {
    const group = new THREE.Group();
    const radius = i === 0 ? 1.74 : 1.51;
    group.add(new THREE.Mesh(ringGeometry(radius), ringMaterial));
    const beacon = new THREE.Group();
    group.add(beacon);
    const glow2 = new THREE.Sprite(keepMaterial(new THREE.SpriteMaterial({
      map: glowTexture,
      color: i ? 12315647 : 16769982,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1,
      toneMapped: false
    })));
    glow2.scale.setScalar(1.15);
    beacon.add(glow2);
    const reflectedLight = new THREE.Sprite(keepMaterial(new THREE.SpriteMaterial({
      map: glowTexture,
      color: 9558015,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })));
    reflectedLight.scale.setScalar(0.9);
    group.add(reflectedLight);
    reflectedLights.push(reflectedLight);
    rings.push(group);
    lights.push(beacon);
    world.add(group);
  }
  let disposed = false;
  let requestedPlaying = false;
  let inView = true;
  let frame = null;
  const frameClock = createOrbFrameClock();
  let elapsed = 0;
  let speed = ENERGY_SPEED.rest;
  let glow = ENERGY_GLOW.rest;
  let targetSpeed = speed;
  let targetGlow = glow;
  // Website: 0 is de vrije stand uit de app, 1 is uitgelijnd (beide ringen in één vlak).
  let align = 0;
  let targetAlign = 0;
  const mix = (a, b, k) => a + (b - a) * k;
  let width = 0;
  let height = 0;
  function pose() {
    const t = elapsed;
    const k = align * align * (3 - 2 * align);
    rings[0].rotation.set(mix(1.1 + Math.sin(t * 0.14) * 0.1, 1.32, k), mix(Math.sin(t * 0.12) * 0.18, 0, k), -0.24 + t * 0.045);
    rings[1].rotation.set(mix(0.12 + Math.sin(t * 0.11) * 0.1, 1.32, k), mix(1.05 + Math.sin(t * 0.13) * 0.14, 0, k), -0.42 - t * 0.035);
    rings[0].scale.set(mix(1.23, 1.08, k), 1, 1);
    filament.rotation.set(1.2, -0.5 + Math.sin(t * 0.1) * 0.2, -0.5);
    for (let i = 0; i < 2; i++) {
      const phase = t * (i ? -0.58 : 0.48) + (i ? -0.35 : 2.35);
      const radius = i ? 1.51 : 1.74;
      lights[i].position.set(Math.cos(phase) * radius, Math.sin(phase) * radius, 0);
      reflectedLights[i].position.set(Math.cos(phase + 3.2) * radius, Math.sin(phase + 3.2) * radius, 0);
    }
    coreMaterial.uniforms.uTime.value = t;
    coreMaterial.uniforms.uGlow.value = glow;
    core.rotation.set(0, 0, -0.22);
    world.position.y = Math.sin(t * 0.55) * 0.035;
    core.worldToLocal(camera.getWorldPosition(coreMaterial.uniforms.uCamera.value));
    canvas.dataset.motion = requestedPlaying && inView && !document.hidden ? "playing" : "paused";
    renderer.render(scene, camera);
    if (onFrame) onFrame(canvas);
  }
  function tick(now) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    const step = frameClock.sample(now);
    if (step === null) return;
    speed = easeTowards(speed, targetSpeed, step);
    glow = easeTowards(glow, targetGlow, step);
    align = align + (targetAlign - align) * (1 - Math.exp(-step / 0.55));
    elapsed += step * speed;
    pose();
  }
  function syncPlayback() {
    if (disposed) return;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    frameClock.reset();
    pose();
    if (requestedPlaying && inView && !document.hidden && width > 0 && height > 0) frame = requestAnimationFrame(tick);
  }
  function resize() {
    if (disposed) return;
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1.5 ? 8.8 : 6.4;
    camera.updateProjectionMatrix();
    pose();
  }
  disposers.push(() => {
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
  });
  const resizeObserver = new ResizeObserver(resize);
  disposers.push(() => resizeObserver.disconnect());
  resizeObserver.observe(canvas);
  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlayback();
  });
  disposers.push(() => intersection.disconnect());
  intersection.observe(canvas);
  document.addEventListener("visibilitychange", syncPlayback);
  disposers.push(() => document.removeEventListener("visibilitychange", syncPlayback));
  function lost(event) {
    event.preventDefault();
    requestedPlaying = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    onContextLost();
  }
  canvas.addEventListener("webglcontextlost", lost);
  disposers.push(() => canvas.removeEventListener("webglcontextlost", lost));
  resize();
  return {
    setPlaying(playing) {
      requestedPlaying = playing;
      syncPlayback();
    },
    setAlign(value) {
      targetAlign = Math.max(0, Math.min(1, value));
      if (frame === null && !disposed) {
        align = targetAlign;
        pose();
      }
    },
    setEnergy(energy) {
      targetSpeed = ENERGY_SPEED[energy];
      targetGlow = ENERGY_GLOW[energy];
      if (frame === null && !disposed) {
        speed = targetSpeed;
        glow = targetGlow;
        pose();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cleanup();
    }
  };
}

export { createOrbScene };
