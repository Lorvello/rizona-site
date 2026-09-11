import * as THREE from "./assets/vendor/three.module.min.js";

// A continuous, folded folio. The geometry is authored here, not a stock primitive.
function makeFolio() {
  const segments = 240,
    across = 10,
    vertices = [],
    indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const center = new THREE.Vector3(
      1.72 * Math.sin(t) + 0.22 * Math.sin(t * 3),
      1.72 * Math.cos(t),
      0.67 * Math.sin(t * 2) + 0.1 * Math.cos(t * 3),
    );
    const radial = new THREE.Vector3(Math.sin(t), Math.cos(t), 0);
    const front = new THREE.Vector3(0, 0, 1);
    const twist = t * 2 + 0.5 * Math.sin(t * 3);
    const width = 0.65 + 0.1 * Math.cos(t * 3);
    for (let j = 0; j <= across; j++) {
      const v = (j / across - 0.5) * 2;
      const fold = 0.12 * (1 - v * v);
      const point = center
        .clone()
        .addScaledVector(radial, v * width * Math.cos(twist))
        .addScaledVector(front, v * width * Math.sin(twist) + fold);
      vertices.push(point.x, point.y, point.z);
      if (i < segments && j < across) {
        const a = i * (across + 1) + j,
          b = a + across + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createSculpture(engine) {
  const wrap = document.querySelector(".sculpture-wrap");
  const canvas = document.getElementById("sculpture");
  let renderer;
  const context = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  if (!context) {
    wrap.classList.add("is-fallback");
    document.documentElement.dataset.scene = "fallback";
    return;
  }
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    wrap.classList.add("is-fallback");
    document.documentElement.dataset.scene = "fallback";
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x2b2622, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9.4);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x817c77);
  const softbox = (x, y, z, sx, sy, intensity) => {
    const box = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sy),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setScalar(intensity),
        side: THREE.DoubleSide,
      }),
    );
    box.position.set(x, y, z);
    box.lookAt(0, 0, 0);
    studio.add(box);
  };
  softbox(-4, 3, 3, 3, 7, 4);
  softbox(4, 1, -3, 2, 6, 3);
  softbox(0, 6, 0, 6, 3, 2);
  softbox(0, -3, 3, 1, 5, 0.35);
  const darkBox = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x33302c, side: THREE.BackSide }),
  );
  studio.add(darkBox);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(studio, 0.04, 0.1, 30);
  scene.environment = env.texture;
  pmrem.dispose();
  studio.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  const key = new THREE.DirectionalLight(0xfff6e7, 3.5);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe7edff, 2);
  rim.position.set(4, -2, -1);
  scene.add(rim);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xd3d2d1,
    metalness: 1,
    roughness: 0.205,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
    envMapIntensity: 1.6,
  });
  const folio = new THREE.Mesh(makeFolio(), material);
  const group = new THREE.Group();
  group.add(folio);
  scene.add(group);
  group.rotation.set(0.21, -0.57, -0.26);
  group.scale.setScalar(0.86);
  let pointerX = 0,
    pointerY = 0,
    currentX = 0,
    currentY = 0;
  let visible = true,
    frame = 0,
    dirty = true,
    lastTime = 0,
    width = 1,
    height = 1;
  let heroProgress = 0.5;
  const act = engine.acts.find((a) => a.el === document.querySelector(".hero"));
  function resize() {
    width = wrap.clientWidth;
    height = wrap.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dirty = true;
    requestRender();
  }
  function draw(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (time - lastTime < 25) {
      requestRender();
      return;
    }
    lastTime = time;
    heroProgress = act?.p ?? 0.5;
    currentX += (pointerX - currentX) * 0.075;
    currentY += (pointerY - currentY) * 0.075;
    group.rotation.x = 0.21 + currentY * 0.12 + (heroProgress - 0.5) * 0.48;
    group.rotation.y = -0.57 + currentX * 0.24 + (heroProgress - 0.5) * 0.75;
    group.rotation.z = -0.26 + (heroProgress - 0.5) * 0.14;
    renderer.render(scene, camera);
    dirty = false;
    if (Math.abs(currentX - pointerX) + Math.abs(currentY - pointerY) > 0.002)
      requestRender();
  }
  function requestRender() {
    if (!frame && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) requestRender();
    },
    { rootMargin: "80px" },
  );
  observer.observe(wrap);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(wrap);
  const onScroll = () => {
    dirty = true;
    requestRender();
  };
  const onMove = (event) => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    pointerX = (event.clientX / innerWidth - 0.5) * 2;
    pointerY = (event.clientY / innerHeight - 0.5) * 2;
    requestRender();
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", requestRender);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    wrap.classList.remove("is-ready");
    wrap.classList.add("is-fallback");
    document.documentElement.dataset.scene = "fallback";
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    visible = false;
  });
  resize();
  renderer.render(scene, camera);
  wrap.classList.add("is-ready");
  document.documentElement.dataset.scene = "webgl";
  // Explicit on-demand capture: no persistent drawing buffer and no screenshot render loop.
  window.captureFolio = () => {
    renderer.render(scene, camera);
    return canvas.toDataURL("image/webp", 0.91);
  };
  window.sceneDiagnostics = () => ({
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    pixelRatio: renderer.getPixelRatio(),
    visible,
    framePending: Boolean(frame),
    dirty,
    size: [width, height],
  });
  window.addEventListener(
    "pagehide",
    () => {
      observer.disconnect();
      sizeObserver.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", requestRender);
      if (frame) cancelAnimationFrame(frame);
      env.dispose();
      folio.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
    { once: true },
  );
}
