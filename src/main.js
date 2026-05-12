import './styles.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const isMobileViewport = () => window.innerWidth < 720;

if (!prefersReducedMotion) {
  document.body.classList.add('is-loading');
}

const lenis = new Lenis({
  duration: prefersReducedMotion ? 0.01 : 1.34,
  easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  smoothWheel: !prefersReducedMotion,
  wheelMultiplier: 0.86,
  touchMultiplier: 1.08,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const loadingScreen = document.querySelector('.loading-screen');
let loaderComplete = false;

if (loadingScreen && !prefersReducedMotion) {
  gsap.to('.loading-line span', { scaleX: 0.86, duration: 1.2, ease: 'power2.out' });
  const finishLoader = () => {
    if (loaderComplete) return;
    loaderComplete = true;

    gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        gsap.set('.site-header, .hero-content > *, .hero-gallery .gallery-frame', {
          autoAlpha: 1,
          clearProps: 'opacity,visibility',
        });
        loadingScreen.remove();
        document.body.classList.remove('is-loading');
      },
    })
      .to('.loading-line span', { scaleX: 1, duration: 0.28 })
      .to('.loading-mark span', { y: -10, autoAlpha: 0, duration: 0.46 }, 0.08)
      .to('.loading-mark strong', { y: 18, autoAlpha: 0, duration: 0.46 }, 0.12)
      .to(loadingScreen, { clipPath: 'inset(0 0 100% 0)', duration: 0.72 }, 0.22)
      .from('.site-header', { y: -18, autoAlpha: 0, duration: 0.8 }, 0.46)
      .from('.hero-content > *', { y: 56, autoAlpha: 0, stagger: 0.08, duration: 0.9 }, 0.48)
      .from('.hero-gallery .gallery-frame', { y: 46, rotateZ: -4, autoAlpha: 0, stagger: 0.08, duration: 0.9 }, 0.58);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(finishLoader, 360);
  } else {
    window.addEventListener('load', finishLoader, { once: true });
    window.setTimeout(finishLoader, 2300);
  }
} else {
  loadingScreen?.remove();
  document.body.classList.remove('is-loading');
}

const canvas = document.querySelector('#salon-scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070404, 0.055);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0.1, 9.4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setClearColor(0x070404, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

const root = new THREE.Group();
const ribbons = [];
scene.add(root);

const ribbonVertex = `
  uniform float uTime;
  uniform float uPhase;
  uniform float uAmp;
  uniform float uTwist;
  uniform float uSpeed;
  uniform float uScroll;
  varying float vGlow;

  void main() {
    vec3 pos = position;
    float sweep = sin((pos.x * 1.22) + (uTime * uSpeed) + uPhase);
    float detail = sin((pos.x * 3.7) - (uTime * 1.5) + uPhase) * 0.28;
    pos.y += (sweep + detail) * uAmp;
    pos.z += cos((pos.x * 1.6) + (uTime * uSpeed * 0.8) + uPhase) * uAmp * 0.72;
    pos.x += sin(uTime * 0.55 + uPhase) * 0.22;
    pos.y += sin(pos.x * 0.34 + uTime * 0.42) * uTwist;
    pos.y += uScroll * sin(pos.x * 0.55 + uPhase) * 0.7;
    pos.z += uScroll * cos(pos.x * 0.42 + uPhase) * 0.55;
    vGlow = smoothstep(-7.5, 7.5, pos.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const ribbonFragment = `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vGlow;

  void main() {
    float edge = 0.62 + sin(vGlow * 3.14159) * 0.38;
    gl_FragColor = vec4(uColor * edge, uAlpha);
  }
`;

const colors = [
  new THREE.Color('#f8d47a'),
  new THREE.Color('#e66598'),
  new THREE.Color('#b96f43'),
  new THREE.Color('#f7f0e8'),
  new THREE.Color('#23836f'),
];

function addRibbon(index) {
  const geometry = new THREE.PlaneGeometry(16.6, index % 4 === 0 ? 0.1 : 0.06, 36, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: ribbonVertex,
    fragmentShader: ribbonFragment,
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: index * 0.74 },
      uAmp: { value: 0.12 + (index % 5) * 0.026 },
      uTwist: { value: 0.05 + (index % 4) * 0.02 },
      uSpeed: { value: 0.72 + (index % 7) * 0.09 },
      uScroll: { value: 0 },
      uColor: { value: colors[index % colors.length] },
      uAlpha: { value: index % 4 === 0 ? 0.22 : 0.13 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    THREE.MathUtils.randFloatSpread(1.3),
    THREE.MathUtils.lerp(-3.2, 3.1, index / 29),
    THREE.MathUtils.lerp(-3.8, 1.7, (index % 8) / 7),
  );
  mesh.rotation.set(
    THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-8, 8)),
    THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-14, 14)),
    THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-13, 10, index / 29)),
  );
  mesh.userData.floatSpeed = 0.38 + (index % 8) * 0.06;
  mesh.userData.floatAmp = 0.08 + (index % 4) * 0.018;
  mesh.userData.baseY = mesh.position.y;
  root.add(mesh);
  ribbons.push(mesh);
}

const ribbonCount = isMobileViewport() ? 0 : 2;
for (let i = 0; i < ribbonCount; i += 1) addRibbon(i);

const veilMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uScroll;

    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 0.55 + uTime * 0.5) * 0.16;
      pos.y += sin(pos.x * 0.36 + uTime * 0.38 + uScroll * 2.0) * 0.18;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uScroll;

    void main() {
      float lineA = sin((vUv.x * 16.0) + (vUv.y * 3.5) + uTime * 0.75 + uScroll * 2.0);
      float lineB = sin((vUv.x * 7.0) - (vUv.y * 12.0) - uTime * 0.48);
      float silk = smoothstep(0.48, 0.98, lineA * 0.5 + lineB * 0.28 + 0.58);
      vec3 rose = vec3(0.902, 0.396, 0.596);
      vec3 gold = vec3(0.972, 0.831, 0.478);
      vec3 green = vec3(0.137, 0.514, 0.435);
      vec3 color = mix(rose, gold, vUv.x);
      color = mix(color, green, smoothstep(0.5, 1.0, vUv.y) * 0.35);
      float vignette = smoothstep(0.02, 0.42, vUv.x) * smoothstep(0.98, 0.58, vUv.x);
      float alpha = silk * vignette * 0.045;
      gl_FragColor = vec4(color, alpha);
    }
  `,
  uniforms: {
    uTime: { value: 0 },
    uScroll: { value: 0 },
  },
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
});

const silkVeil = new THREE.Mesh(new THREE.PlaneGeometry(15.8, 9.4, 24, 10), veilMaterial);
silkVeil.position.set(0.6, -0.2, -4.8);
silkVeil.rotation.set(THREE.MathUtils.degToRad(-6), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-7));
root.add(silkVeil);

const sparkCount = isMobileViewport() ? 12 : 24;
const sparkPositions = new Float32Array(sparkCount * 3);
const sparkColors = new Float32Array(sparkCount * 3);
const sparkBase = [];

for (let i = 0; i < sparkCount; i += 1) {
  const color = colors[i % colors.length];
  const x = THREE.MathUtils.randFloatSpread(12.5);
  const y = THREE.MathUtils.randFloat(-4.2, 4.5);
  const z = THREE.MathUtils.randFloat(-6.4, 1.8);
  sparkBase.push({ x, y, z, speed: THREE.MathUtils.randFloat(0.12, 0.42), phase: Math.random() * Math.PI * 2 });
  sparkPositions[i * 3] = x;
  sparkPositions[i * 3 + 1] = y;
  sparkPositions[i * 3 + 2] = z;
  sparkColors[i * 3] = color.r;
  sparkColors[i * 3 + 1] = color.g;
  sparkColors[i * 3 + 2] = color.b;
}

const sparkGeometry = new THREE.BufferGeometry();
sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
sparkGeometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

const sparkField = new THREE.Points(
  sparkGeometry,
  new THREE.PointsMaterial({
    size: isMobileViewport() ? 0.026 : 0.034,
    transparent: true,
    opacity: 0.72,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);
scene.add(sparkField);

const foilGroup = new THREE.Group();
const foilCount = isMobileViewport() ? 3 : 6;
const foilGeometry = new THREE.CircleGeometry(0.055, 3);

for (let i = 0; i < foilCount; i += 1) {
  const foil = new THREE.Mesh(
    foilGeometry,
    new THREE.MeshBasicMaterial({
      color: colors[(i + 2) % colors.length],
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  foil.position.set(THREE.MathUtils.randFloatSpread(11.5), THREE.MathUtils.randFloat(-3.6, 3.8), THREE.MathUtils.randFloat(-5.6, 1.4));
  foil.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  foil.scale.setScalar(THREE.MathUtils.randFloat(0.8, 2.8));
  foil.userData = {
    baseY: foil.position.y,
    baseX: foil.position.x,
    spin: THREE.MathUtils.randFloat(0.16, 0.55),
    drift: THREE.MathUtils.randFloat(0.05, 0.18),
    phase: Math.random() * Math.PI * 2,
  };
  foilGroup.add(foil);
}

root.add(foilGroup);

const portalGroup = new THREE.Group();
portalGroup.position.set(1.36, 0.02, -1.35);
portalGroup.rotation.set(THREE.MathUtils.degToRad(-2), THREE.MathUtils.degToRad(-24), THREE.MathUtils.degToRad(2));
root.add(portalGroup);

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8eee3,
  roughness: 0.34,
  metalness: 0.16,
  transparent: true,
  opacity: 0.24,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const mirrorMaterial = new THREE.MeshStandardMaterial({
  color: 0x1b1013,
  roughness: 0.3,
  metalness: 0.32,
  transparent: true,
  opacity: 0.48,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const goldMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8d47a,
  metalness: 0.78,
  roughness: 0.24,
  emissive: 0x4a2c08,
  emissiveIntensity: 0.58,
});

const roseGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xe66598,
  transparent: true,
  opacity: 0.58,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const portalBack = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 4.7, 1, 1), mirrorMaterial);
portalBack.position.z = -0.08;
portalGroup.add(portalBack);

const portalGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 4.25, 1, 1), glassMaterial);
portalGlass.position.z = 0.01;
portalGroup.add(portalGlass);

const frameBars = [
  { position: [0, 2.22, 0.05], scale: [3.05, 0.12, 0.16] },
  { position: [0, -2.22, 0.05], scale: [3.05, 0.12, 0.16] },
  { position: [-1.48, 0, 0.05], scale: [0.12, 4.56, 0.16] },
  { position: [1.48, 0, 0.05], scale: [0.12, 4.56, 0.16] },
];

frameBars.forEach(({ position, scale }) => {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(...scale), goldMetalMaterial);
  bar.position.set(...position);
  portalGroup.add(bar);
});

const portalRing = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.018, 8, 96), roseGlowMaterial);
portalRing.scale.y = 1.42;
portalRing.position.z = 0.1;
portalGroup.add(portalRing);

const portalRingInner = new THREE.Mesh(
  new THREE.TorusGeometry(1.45, 0.012, 8, 96),
  new THREE.MeshBasicMaterial({
    color: 0x23836f,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
portalRingInner.scale.y = 1.48;
portalRingInner.position.z = 0.16;
portalGroup.add(portalRingInner);

const chairGroup = new THREE.Group();
chairGroup.position.set(0.2, -1.9, 0.46);
chairGroup.scale.setScalar(0.76);
portalGroup.add(chairGroup);

const chairMaterial = new THREE.MeshStandardMaterial({
  color: 0x16100f,
  roughness: 0.34,
  metalness: 0.46,
  emissive: 0x0d0708,
});

const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 0.2, 24), chairMaterial);
chairSeat.rotation.x = Math.PI / 2;
chairGroup.add(chairSeat);

const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.18, 0.16), chairMaterial);
chairBack.position.set(0, 0.58, -0.18);
chairBack.rotation.x = THREE.MathUtils.degToRad(-10);
chairGroup.add(chairBack);

const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.1, 14), goldMetalMaterial);
chairPole.position.set(0, -0.67, 0);
chairGroup.add(chairPole);

const chairBase = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.018, 8, 48), goldMetalMaterial);
chairBase.position.set(0, -1.26, 0);
chairBase.rotation.x = Math.PI / 2;
chairGroup.add(chairBase);

function createLabelTexture(label, sublabel) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 256;
  textureCanvas.height = 128;
  const ctx = textureCanvas.getContext('2d');
  ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.fillStyle = 'rgba(7, 4, 4, 0.72)';
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.strokeStyle = 'rgba(248, 212, 122, 0.72)';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, textureCanvas.width - 32, textureCanvas.height - 32);
  ctx.fillStyle = '#fff8ef';
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, textureCanvas.width / 2, 52);
  ctx.fillStyle = '#f8d47a';
  ctx.font = '800 12px Inter, Arial, sans-serif';
  ctx.fillText(sublabel, textureCanvas.width / 2, 84);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const orbitLabels = [
  ['Color', 'DIMENSION'],
  ['Locz', 'LUXURY CARE'],
  ['Silk', 'PRESS SHINE'],
];

const labelGroup = new THREE.Group();
portalGroup.add(labelGroup);

orbitLabels.forEach(([label, sublabel], index) => {
  const texture = createLabelTexture(label, sublabel);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.52), material);
  panel.userData = {
    angle: (index / orbitLabels.length) * Math.PI * 2,
    radius: 2.15 + (index % 2) * 0.18,
    speed: 0.12 + index * 0.012,
    y: THREE.MathUtils.lerp(-1.32, 1.44, index / (orbitLabels.length - 1)),
  };
  labelGroup.add(panel);
});

const hairCurveGroup = new THREE.Group();
root.add(hairCurveGroup);

// #7 Hair-strand presence — was 2-3 strands, now 8-14 flowing across the
// viewport in the brand palette (gold, rose, copper, green, ivory).
// Stays the cheap MeshBasicMaterial + additive blending, so it's GPU-free.
const hairCurveCount = isMobileViewport() ? 8 : 14;
for (let i = 0; i < hairCurveCount; i += 1) {
  const y = THREE.MathUtils.lerp(-3.2, 3.2, i / Math.max(1, hairCurveCount - 1));
  const z = THREE.MathUtils.randFloat(-3.6, 1.2);
  const phase = i * 0.31;
  const points = [];
  for (let p = 0; p < 9; p += 1) {
    const t = p / 8;
    points.push(new THREE.Vector3(
      THREE.MathUtils.lerp(-8.2, 7.2, t),
      y + Math.sin(t * Math.PI * 2.2 + phase) * (0.28 + (i % 5) * 0.05),
      z + Math.cos(t * Math.PI * 1.4 + phase) * 0.52,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const isHero = i % 4 === 0;
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, isHero ? 0.014 : 0.0075, 4, false),
    new THREE.MeshBasicMaterial({
      color: colors[(i + 1) % colors.length],
      transparent: true,
      opacity: isHero ? 0.42 : 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  tube.userData = {
    baseY: tube.position.y,
    baseZ: tube.position.z,
    phase,
    speed: THREE.MathUtils.randFloat(0.18, 0.48),
  };
  hairCurveGroup.add(tube);
}

const haloMaterial = new THREE.MeshBasicMaterial({
  color: 0xf8d47a,
  transparent: true,
  opacity: 0.28,
  blending: THREE.AdditiveBlending,
});

const halo = new THREE.Group();
for (let i = 0; i < 3; i += 1) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.15 + i * 0.29, 0.008, 6, 72, Math.PI * 1.45), haloMaterial);
  arc.position.set(3.35, -0.2, -1.6 - i * 0.15);
  arc.rotation.set(THREE.MathUtils.degToRad(78), THREE.MathUtils.degToRad(14), THREE.MathUtils.degToRad(36 + i * 17));
  halo.add(arc);
}
root.add(halo);

scene.add(new THREE.AmbientLight(0x241817, 2.3));

const roseLight = new THREE.PointLight(0xe66598, 24, 18);
roseLight.position.set(-4.5, -1.6, 4.2);
scene.add(roseLight);

const goldLight = new THREE.PointLight(0xf8d47a, 18, 18);
goldLight.position.set(3.8, 1.8, 4.5);
scene.add(goldLight);

const greenLight = new THREE.PointLight(0x23836f, 10, 16);
greenLight.position.set(-1.8, 3.2, 2.7);
scene.add(greenLight);

function resizeRenderer() {
  const { innerWidth, innerHeight } = window;
  const mobile = isMobileViewport();
  const bounds = canvas.getBoundingClientRect();
  const renderWidth = Math.max(1, Math.round(bounds.width || innerWidth));
  const renderHeight = Math.max(1, Math.round(bounds.height || innerHeight));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.0 : 1.25));
  renderer.setSize(renderWidth, renderHeight, false);
  camera.aspect = renderWidth / renderHeight;
  camera.position.z = mobile ? 10.8 : 9.4;
  camera.position.y = mobile ? -0.18 : 0.1;
  root.scale.setScalar(mobile ? 1.14 : 1);
  portalGroup.position.set(mobile ? 0.92 : 1.36, mobile ? -0.04 : 0.02, mobile ? -2.35 : -1.35);
  portalGroup.scale.setScalar(mobile ? 0.68 : 1.08);
  hairCurveGroup.scale.setScalar(mobile ? 0.86 : 1);
  sparkField.material.size = mobile ? 0.026 : 0.034;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeRenderer);
resizeRenderer();

const pointer = new THREE.Vector2(0, 0);
// rAF-batched global pointer. Pointer events can fire 250+ Hz on modern mice;
// we only need updates at display refresh.
{
  let px = 0, py = 0, dirty = false, raf = 0;
  const flush = () => {
    raf = 0;
    if (!dirty) return;
    dirty = false;
    const w = window.innerWidth, h = window.innerHeight;
    pointer.x = (px / w - 0.5) * 2;
    pointer.y = (py / h - 0.5) * 2;
    const docStyle = document.documentElement.style;
    docStyle.setProperty('--spot-x', `${(px / w) * 100}%`);
    docStyle.setProperty('--spot-y', `${(py / h) * 100}%`);
  };
  window.addEventListener('pointermove', (event) => {
    wakeScene(1400);
    px = event.clientX;
    py = event.clientY;
    dirty = true;
    if (!raf) raf = requestAnimationFrame(flush);
  }, { passive: true });
}

const scrollState = { value: 0 };
const clock = new THREE.Clock();
let activeUntil = performance.now() + 3600;

function wakeScene(duration = 1200) {
  activeUntil = Math.max(activeUntil, performance.now() + duration);
}

// Tabs hidden? Pause the loop entirely. (Page Visibility API)
let pageVisible = !document.hidden;
document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
  if (pageVisible) wakeScene(900); // catch up immediately on return
});

// Canvas off-screen? Skip the scene entirely. Once you've scrolled past the
// hero, there's no reason to render WebGL at 60fps -- it's the heaviest thing
// on the page. IntersectionObserver flips a flag; the loop short-circuits.
let canvasInView = true;
{
  const io = new IntersectionObserver((entries) => {
    canvasInView = entries[0].isIntersecting;
    if (canvasInView) wakeScene(900);
  }, { threshold: 0 });
  if (canvas) io.observe(canvas);
}

// Render in lockstep with the browser's compositor at 60fps.
// When the scene is "idle" (no recent pointer/scroll) OR offscreen, we skip
// the per-frame scene mutations + draw call but still let rAF run cheaply so
// we can resume instantly on the next interaction.
function animate() {
  requestAnimationFrame(animate);
  if (!pageVisible || !canvasInView) return;

  const isActive = performance.now() < activeUntil;
  if (!isActive) return; // idle: no scene update, no draw

  const elapsed = clock.getElapsedTime();

  for (let i = 0; i < ribbons.length; i += 1) {
    const ribbon = ribbons[i];
    ribbon.material.uniforms.uTime.value = elapsed;
    ribbon.position.y = ribbon.userData.baseY + Math.sin(elapsed * ribbon.userData.floatSpeed + i) * ribbon.userData.floatAmp;
  }

  silkVeil.material.uniforms.uTime.value = elapsed;
  silkVeil.rotation.z = THREE.MathUtils.degToRad(-7 + Math.sin(elapsed * 0.16) * 1.8);

  sparkField.rotation.y = elapsed * 0.024 + pointer.x * 0.04;
  sparkField.rotation.x = pointer.y * 0.025;
  sparkField.position.y = scrollState.value * 0.8 + Math.sin(elapsed * 0.2) * 0.08;

  const foilChildren = foilGroup.children;
  for (let i = 0; i < foilChildren.length; i += 1) {
    const foil = foilChildren[i];
    foil.position.x = foil.userData.baseX + Math.sin(elapsed * foil.userData.drift + foil.userData.phase) * 0.26;
    foil.position.y = foil.userData.baseY + Math.cos(elapsed * foil.userData.drift * 1.4 + foil.userData.phase) * 0.22 + scrollState.value * 0.5;
    foil.rotation.x += foil.userData.spin * 0.008;
    foil.rotation.y += foil.userData.spin * 0.011;
  }

  const mobileNow = isMobileViewport();
  portalGroup.rotation.y = THREE.MathUtils.lerp(
    portalGroup.rotation.y,
    THREE.MathUtils.degToRad((mobileNow ? -12 : -24) + pointer.x * 8 + scrollState.value * 18),
    0.035,
  );
  portalGroup.rotation.x = THREE.MathUtils.lerp(portalGroup.rotation.x, THREE.MathUtils.degToRad(-2 - pointer.y * 4), 0.035);
  portalGroup.position.y = (mobileNow ? -0.04 : 0.02) + Math.sin(elapsed * 0.34) * 0.08 + scrollState.value * 0.28;
  portalRing.rotation.z = elapsed * 0.18;
  portalRingInner.rotation.z = -elapsed * 0.14;
  portalGlass.material.opacity = 0.28 + Math.sin(elapsed * 0.9) * 0.04;
  chairGroup.rotation.y = Math.sin(elapsed * 0.48) * 0.16 + pointer.x * 0.08;

  const labelChildren = labelGroup.children;
  for (let i = 0; i < labelChildren.length; i += 1) {
    const panel = labelChildren[i];
    const data = panel.userData;
    const angle = data.angle + elapsed * data.speed + scrollState.value * Math.PI * 1.2;
    panel.position.set(Math.cos(angle) * data.radius, data.y + Math.sin(elapsed * 0.42 + i) * 0.08, Math.sin(angle) * 0.76 + 0.38);
    panel.rotation.y = -portalGroup.rotation.y + Math.sin(angle) * 0.18;
    panel.rotation.x = -portalGroup.rotation.x * 0.5;
    panel.material.opacity = 0.42 + (Math.sin(angle) + 1) * 0.22;
  }

  const tubeChildren = hairCurveGroup.children;
  for (let i = 0; i < tubeChildren.length; i += 1) {
    const tube = tubeChildren[i];
    tube.position.y = tube.userData.baseY + Math.sin(elapsed * tube.userData.speed + tube.userData.phase) * 0.18;
    tube.position.z = tube.userData.baseZ + Math.cos(elapsed * tube.userData.speed * 0.8 + tube.userData.phase) * 0.28;
    tube.rotation.y = Math.sin(elapsed * 0.16 + i * 0.08) * 0.05 + pointer.x * 0.06;
    tube.rotation.z = Math.cos(elapsed * 0.12 + i * 0.05) * 0.025;
  }

  halo.rotation.z = elapsed * 0.11;
  halo.rotation.y = Math.sin(elapsed * 0.24) * 0.15;
  root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, pointer.x * 0.12, 0.04);
  root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -pointer.y * 0.08, 0.04);
  roseLight.intensity = 22 + Math.sin(elapsed * 0.8) * 3;
  goldLight.intensity = 17 + Math.cos(elapsed * 0.65) * 2.4;
  greenLight.intensity = 9 + Math.sin(elapsed * 0.52) * 1.8;

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    wakeScene(900);
    const progress = self.progress;
    const mobile = isMobileViewport();
    document.querySelector('.scroll-progress')?.style.setProperty('transform', `scaleX(${progress})`);
    scrollState.value = progress;
    ribbons.forEach((ribbon, index) => {
      ribbon.material.uniforms.uScroll.value = Math.sin(progress * Math.PI + index * 0.08) * 0.55;
    });
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, progress * (mobile ? 0.35 : 0.9), 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, (mobile ? -0.18 : 0.1) + progress * 0.32, 0.045);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, (mobile ? 10.8 : 9.4) - progress * (mobile ? 0.52 : 1.16), 0.045);
    halo.scale.setScalar(1 + progress * 0.28);
    silkVeil.material.uniforms.uScroll.value = progress;
    sparkField.material.opacity = 0.72 - progress * 0.18;
    foilGroup.rotation.z = progress * 0.08;
    portalGroup.scale.setScalar((mobile ? 0.68 : 1.08) * (1 + progress * 0.22));
    labelGroup.rotation.z = progress * 0.28;
    hairCurveGroup.rotation.x = progress * 0.08;
    hairCurveGroup.rotation.z = -progress * 0.05;
  },
});

gsap.utils.toArray('[data-reveal]').forEach((node, index) => {
  gsap.fromTo(node,
    { autoAlpha: 0, y: 44, rotateX: index % 3 === 0 ? 2 : 0 },
    {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      duration: 0.9,
      ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: node,
        start: 'top 86%',
        toggleActions: 'play none none none',
      },
    });
});

gsap.utils.toArray('[data-parallax]').forEach((node) => {
  const depth = Number(node.dataset.parallax || 0.14);
  gsap.to(node, {
    yPercent: -depth * 100,
    ease: 'none',
    scrollTrigger: {
      trigger: node,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
});

gsap.to('.hero-gallery', {
  yPercent: -10,
  xPercent: 4,
  scale: 1.04,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});

gsap.to('.hero-content', {
  yPercent: 10,
  autoAlpha: 0.32,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero-section',
    start: '70% top',
    end: 'bottom top',
    scrub: true,
  },
});

gsap.utils.toArray('.section-heading h2').forEach((heading) => {
  gsap.fromTo(heading,
    { clipPath: 'inset(0 0 100% 0)', y: 34 },
    {
      clipPath: 'inset(0 0 0% 0)',
      y: 0,
      duration: 1.05,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: heading,
        start: 'top 82%',
        toggleActions: 'play none none none',
      },
    });
});

gsap.utils.toArray('.story-portrait, .cinema-frame, .owner-card img').forEach((node) => {
  gsap.fromTo(node,
    { clipPath: 'inset(12% 0 12% 0)', scale: 0.98 },
    {
      clipPath: 'inset(0% 0 0% 0)',
      scale: 1,
      duration: 1.1,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: node,
        start: 'top 86%',
        toggleActions: 'play none none none',
      },
    });
});

gsap.utils.toArray('.gallery-frame img, .cinema-frame img, .story-portrait img, .owner-card img').forEach((image) => {
  gsap.fromTo(image,
    { yPercent: -5, scale: 1.12 },
    {
      yPercent: 5,
      scale: 1.04,
      ease: 'none',
      scrollTrigger: {
        trigger: image.closest('section') || image,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
});

gsap.utils.toArray('.service-card, .menu-card, .team-grid article, .policy-grid article, .storyboard article').forEach((card, index) => {
  // Composited-only reveal (translate + opacity). Avoid `filter: blur()` —
  // it forces a full-section repaint on every frame of the tween.
  gsap.fromTo(card,
    { y: 44, rotateX: 4, autoAlpha: 0 },
    {
      y: 0,
      rotateX: 0,
      autoAlpha: 1,
      duration: 0.9,
      delay: (index % 4) * 0.035,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
});

const motionContext = gsap.matchMedia();
motionContext.add('(min-width: 1081px)', () => {
  const craftSteps = gsap.utils.toArray('.craft-step');
  const craftTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.craft-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.9,
      pin: '.craft-pin',
    },
  });

  craftTimeline
    .to('.frame-a', { xPercent: -10, yPercent: -8, rotateZ: -8, scale: 1.08, ease: 'none' }, 0)
    .to('.frame-b', { xPercent: 9, yPercent: 16, rotateZ: 8, scale: 0.94, ease: 'none' }, 0)
    .to('.frame-c', { xPercent: -18, yPercent: -24, rotateZ: 4, scale: 1.14, ease: 'none' }, 0)
    .to('.craft-copy h2', { yPercent: -12, autoAlpha: 0.68, ease: 'none' }, 0);

  ScrollTrigger.create({
    trigger: '.craft-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const activeIndex = Math.min(craftSteps.length - 1, Math.floor(self.progress * craftSteps.length));
      craftSteps.forEach((step, index) => step.classList.toggle('is-active', index === activeIndex));
    },
  });
});

const cursor = document.querySelector('.cursor-ring');
if (cursor && finePointer && !prefersReducedMotion) {
  const moveCursorX = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
  const moveCursorY = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
  let cursorRevealed = false;

  window.addEventListener('pointermove', (event) => {
    moveCursorX(event.clientX);
    moveCursorY(event.clientY);
    // Only tween autoAlpha the first time the cursor wakes up — re-tweening
    // every pointermove was allocating ~200 tweens/sec.
    if (!cursorRevealed) {
      cursorRevealed = true;
      gsap.to(cursor, { autoAlpha: 1, duration: 0.18 });
    }
  }, { passive: true });

  document.querySelectorAll('a, .service-card, .menu-card, .craft-step, .storyboard article, .team-grid article').forEach((node) => {
    node.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
    node.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  });
}

const litCards = document.querySelectorAll('.service-card, .menu-card, .team-grid article, .policy-grid article, .storyboard article, .hours-board div');
litCards.forEach((card) => {
  // Persistent quickTo tweens (1 per property per card, re-targeted on each
  // pointermove). Avoids `gsap.to` allocating + killing a tween every frame.
  const tiltActive = finePointer && !prefersReducedMotion;
  const setRotX = tiltActive ? gsap.quickTo(card, 'rotateX', { duration: 0.32, ease: 'power3.out' }) : null;
  const setRotY = tiltActive ? gsap.quickTo(card, 'rotateY', { duration: 0.32, ease: 'power3.out' }) : null;
  const setZ    = tiltActive ? gsap.quickTo(card, 'z',       { duration: 0.32, ease: 'power3.out' }) : null;

  // Cache rect on enter; getBoundingClientRect is a layout-forcing read.
  let rect = null;
  let pending = 0;
  let lastClientX = 0;
  let lastClientY = 0;

  const flush = () => {
    pending = 0;
    if (!rect) return;
    const x = lastClientX - rect.left;
    const y = lastClientY - rect.top;
    const rx = x / rect.width;
    const ry = y / rect.height;
    card.style.setProperty('--mx', `${rx * 100}%`);
    card.style.setProperty('--my', `${ry * 100}%`);
    if (tiltActive) {
      setRotX((ry - 0.5) * -5);
      setRotY((rx - 0.5) * 5);
      setZ(16);
    }
  };

  card.addEventListener('pointerenter', () => {
    rect = card.getBoundingClientRect();
    if (tiltActive) card.classList.add('is-lit');
  });

  card.addEventListener('pointermove', (event) => {
    lastClientX = event.clientX;
    lastClientY = event.clientY;
    if (!pending) pending = requestAnimationFrame(flush);
  });

  card.addEventListener('pointerleave', () => {
    if (pending) { cancelAnimationFrame(pending); pending = 0; }
    rect = null;
    card.classList.remove('is-lit');
    if (tiltActive) {
      gsap.to(card, { rotateX: 0, rotateY: 0, z: 0, duration: 0.48, ease: 'elastic.out(1, 0.55)', overwrite: true });
    }
  });
});

document.querySelectorAll('[data-magnetic]').forEach((node) => {
  const setX = gsap.quickTo(node, 'x', { duration: 0.25, ease: 'power3.out' });
  const setY = gsap.quickTo(node, 'y', { duration: 0.25, ease: 'power3.out' });

  let rect = null;
  let pending = 0;
  let lastClientX = 0;
  let lastClientY = 0;

  const flush = () => {
    pending = 0;
    if (!rect) return;
    setX((lastClientX - rect.left - rect.width / 2) * 0.14);
    setY((lastClientY - rect.top - rect.height / 2) * 0.18);
  };

  node.addEventListener('pointerenter', () => { rect = node.getBoundingClientRect(); });
  node.addEventListener('pointermove', (event) => {
    lastClientX = event.clientX;
    lastClientY = event.clientY;
    if (!pending) pending = requestAnimationFrame(flush);
  });
  node.addEventListener('pointerleave', () => {
    if (pending) { cancelAnimationFrame(pending); pending = 0; }
    rect = null;
    gsap.to(node, { x: 0, y: 0, duration: 0.45, ease: 'elastic.out(1, 0.45)' });
  });
});

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting || entry.target.dataset.done) return;
    entry.target.dataset.done = 'true';
    const target = Number(entry.target.dataset.count);
    const suffix = entry.target.dataset.suffix || '';
    const start = performance.now();
    const duration = 1100;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      entry.target.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}, { threshold: 0.42 });

counters.forEach((counter) => counterObserver.observe(counter));

/* ---------------------------------------------------------------
 * Higgsfield-ready reel cards
 * Sources resolve from /public/reels.json (post-deploy editable, no rebuild).
 * Inline window.HIGGSFIELD_REELS fills any keys the file leaves empty.
 * Each card transitions: pending -> loading -> ready -> playing | error.
 * ------------------------------------------------------------- */
const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(
      ([, v]) => typeof v === 'string' && v.length > 0,
    ),
  );

async function loadReelSources() {
  let fromFile = {};
  try {
    const url = `${import.meta.env.BASE_URL}reels.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) fromFile = await res.json();
  } catch (_) {
    // network / parse failure — degrade silently to inline-only
  }
  // file overrides inline: file is the post-deploy editing surface
  return { ...clean(window.HIGGSFIELD_REELS), ...clean(fromFile) };
}

const reelCards = document.querySelectorAll('.reel-card');

// Cinema-strip auto-play: when the reel section enters the viewport, stagger
// each card's playback so all four reels light up in sequence. Once-only per
// card (data-autoplay-done flag) so scroll-out / scroll-in won't restart.
function autoPlayCard(card) {
  if (card.dataset.autoplayDone) return;
  const video = card.querySelector('video');
  if (!video || video.dataset.loaded !== 'true') return;
  if (!card.classList.contains('is-revealed')) return;
  const idx = Array.prototype.indexOf.call(reelCards, card);
  const delay = Math.max(0, idx * 400);
  card.dataset.autoplayPending = 'true';
  setTimeout(() => {
    delete card.dataset.autoplayPending;
    if (document.hidden) return;
    if (!card.classList.contains('is-revealed')) return;
    video.play().then(() => {
      card.classList.add('is-playing');
      card.dataset.autoplayDone = 'true';
    }).catch(() => {});
  }, delay);
}

const reelObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const card = entry.target;
    const video = card.querySelector('video');
    if (entry.isIntersecting) {
      const justRevealed = !card.classList.contains('is-revealed');
      card.classList.add('is-revealed');
      // #12 Vibration: subtle haptic confirmation on mobile during the first reveal.
      if (justRevealed && 'vibrate' in navigator) {
        try { navigator.vibrate(6); } catch (_) { /* not allowed */ }
      }
      if (justRevealed) autoPlayCard(card);
      else if (video && video.dataset.loaded === 'true' && card.classList.contains('is-playing')) {
        video.play().catch(() => {});
      }
    } else if (video) {
      video.pause();
    }
  });
}, { threshold: 0.32 });

function setState(card, state) {
  card.classList.remove('is-pending', 'is-loading', 'is-ready', 'is-error');
  card.classList.add(`is-${state}`);

  const stateEl = card.querySelector('.reel-state');
  if (stateEl) {
    stateEl.textContent =
      state === 'pending' ? 'RENDERING' :
      state === 'error' ? 'PREVIEW SOON' :
      'REC';
  }

  const playBtn = card.querySelector('.reel-play');
  if (playBtn) {
    playBtn.hidden = state === 'pending' || state === 'error';
    if (state === 'ready') {
      playBtn.removeAttribute('aria-disabled');
      playBtn.removeAttribute('tabindex');
    } else {
      playBtn.setAttribute('aria-disabled', 'true');
      playBtn.setAttribute('tabindex', '-1');
    }
  }
}

reelCards.forEach((card) => {
  reelObserver.observe(card);
  setState(card, 'pending');
});

const reelSourcesPromise = loadReelSources();

// #1 Hero Soul: when reels.json provides a `heroSoul` URL, this Higgsfield Soul
// clip plays behind the WebGL scene with `mix-blend-mode: screen`, giving the
// hero the feeling that Christina herself is shining through the page.
reelSourcesPromise.then((reelSources) => {
  const heroSoulUrl = reelSources.heroSoul;
  const heroVideo = document.querySelector('[data-hero-soul]');
  if (!heroSoulUrl || !heroVideo) return;
  heroVideo.addEventListener('loadedmetadata', () => {
    heroVideo.classList.add('is-live');
    document.querySelector('.hero-section')?.classList.add('has-hero-soul');
    heroVideo.play().catch(() => {});
  }, { once: true });
  heroVideo.src = heroSoulUrl;
});

reelSourcesPromise.then((reelSources) => {
  reelCards.forEach((card) => {
    const video = card.querySelector('video');
    const playBtn = card.querySelector('.reel-play');
    const key = video?.dataset.reel;
    const src = key && reelSources[key];

    if (!video || !src) return; // already pending

    setState(card, 'loading');

    // Some browsers/CDNs leave the video in NETWORK_LOADING forever instead of
    // firing `error` for unreachable hosts. Fail over after a reasonable wait.
    const loadTimeout = setTimeout(() => {
      if (!card.classList.contains('is-ready')) setState(card, 'error');
    }, 12000);

    video.addEventListener('loadedmetadata', () => {
      clearTimeout(loadTimeout);
      video.dataset.loaded = 'true';
      setState(card, 'ready');
      // If the card is already on-screen when metadata lands, auto-play now.
      // (Otherwise the IntersectionObserver kicks it in on first reveal.)
      if (card.classList.contains('is-revealed')) autoPlayCard(card);
    }, { once: true });

    video.addEventListener('error', () => {
      clearTimeout(loadTimeout);
      setState(card, 'error');
    }, { once: true });

    video.src = src;

    const togglePlay = () => {
      if (!card.classList.contains('is-ready') && !card.classList.contains('is-playing')) return;
      if (!video.dataset.loaded) return;
      if (video.paused) {
        reelCards.forEach((other) => {
          if (other !== card) {
            const otherVideo = other.querySelector('video');
            otherVideo?.pause();
            other.classList.remove('is-playing');
          }
        });
        video.play().then(() => card.classList.add('is-playing')).catch(() => {});
      } else {
        video.pause();
        card.classList.remove('is-playing');
      }
    };

    playBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      togglePlay();
    });
    card.querySelector('.reel-frame')?.addEventListener('click', togglePlay);
  });
});

/* ============================================================================
 * MOONSHOT PACK — additional features layered on top of the existing site.
 * Each block is self-contained; remove freely without breaking anything else.
 * ========================================================================== */

// ---- #11 Time-of-day gold theme shift ----
(() => {
  const hour = new Date().getHours();
  const root = document.documentElement;
  if (hour >= 5 && hour < 12) root.classList.add('is-tod-morning');
  else if (hour >= 17 || hour < 5) root.classList.add('is-tod-evening');
  else root.classList.add('is-tod-afternoon');
})();

// ---- #5 Drifting review quotes (reveal after first scroll, hide on small screens) ----
(() => {
  const drift = document.querySelector('[data-reviews-drift]');
  if (!drift) return;
  if (window.matchMedia('(max-width: 720px)').matches || prefersReducedMotion) return;
  const reveal = () => {
    drift.classList.add('is-live');
    drift.setAttribute('aria-hidden', 'false');
  };
  // Wait for first scroll + a beat after, so it doesn't overlap the loader.
  let triggered = false;
  const onScroll = () => {
    if (triggered || window.scrollY < 400) return;
    triggered = true;
    setTimeout(reveal, 600);
    window.removeEventListener('scroll', onScroll);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ---- #9 Menu price count-up ----
// Wraps every `$NN` in menu lists with a span, then animates digits from 0
// when the card enters viewport. Counts the max value in each price range
// (so "$30 - $35" counts up to 35, then renders "$30 - $35").
(() => {
  const cards = document.querySelectorAll('.menu-card');
  if (!cards.length) return;
  const PRICE_RE = /\$(\d+)/g;
  cards.forEach((card) => {
    card.querySelectorAll('li').forEach((li) => {
      const original = li.textContent;
      const matches = [...original.matchAll(PRICE_RE)];
      if (!matches.length) return;
      li.innerHTML = original.replace(PRICE_RE, '<span class="price-num" data-target="$1" data-final="$$$1">$0</span>');
    });
  });
  const tweenCard = (card) => {
    if (card.dataset.priceAnimDone) return;
    card.dataset.priceAnimDone = 'true';
    const nums = card.querySelectorAll('.price-num');
    nums.forEach((node, idx) => {
      const target = Number(node.dataset.target);
      const final = node.dataset.final;
      const dur = 900;
      const startDelay = 60 + idx * 50;
      const start = performance.now() + startDelay;
      const tick = (now) => {
        const t = Math.min(1, Math.max(0, (now - start) / dur));
        if (t <= 0) { requestAnimationFrame(tick); return; }
        const eased = 1 - Math.pow(1 - t, 3);
        node.textContent = `$${Math.round(target * eased)}`;
        if (t < 1) requestAnimationFrame(tick);
        else node.textContent = final;
      };
      requestAnimationFrame(tick);
    });
  };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) tweenCard(e.target); });
  }, { threshold: 0.18 });
  cards.forEach((c) => obs.observe(c));
})();

// ---- #8 3D portrait carousel for the team ----
(() => {
  const stage = document.querySelector('[data-team-stage]');
  if (!stage) return;
  const slots = Array.from(stage.querySelectorAll('[data-team-slot]'));
  if (!slots.length) return;
  const dots = Array.from(document.querySelectorAll('[data-team-dot]'));
  const prev = document.querySelector('[data-team-prev]');
  const next = document.querySelector('[data-team-next]');
  let index = 0;
  let autoplayId = 0;

  const layout = () => {
    slots.forEach((slot, i) => {
      const offset = ((i - index) % slots.length + slots.length) % slots.length;
      const wrapped = offset > slots.length / 2 ? offset - slots.length : offset;
      const tx = wrapped * 56; // %
      const tz = -Math.abs(wrapped) * 180; // px
      const rotY = wrapped * -14;
      const opacity = Math.abs(wrapped) >= 2 ? 0 : (wrapped === 0 ? 1 : 0.32);
      // Composited transforms + opacity only -- no `filter: blur()` (paint-heavy).
      slot.style.transform = `translateX(${tx}%) translateZ(${tz}px) rotateY(${rotY}deg)`;
      slot.style.opacity = String(opacity);
      slot.classList.toggle('is-current', wrapped === 0);
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  };

  const step = (dir) => {
    index = (index + dir + slots.length) % slots.length;
    layout();
    restartAutoplay();
  };

  const restartAutoplay = () => {
    clearInterval(autoplayId);
    if (prefersReducedMotion) return;
    autoplayId = setInterval(() => { index = (index + 1) % slots.length; layout(); }, 5800);
  };

  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));
  dots.forEach((d, i) => d.addEventListener('click', () => { index = i; layout(); restartAutoplay(); }));

  // Touch swipe support -- mobile users expect to drag, not hunt for buttons.
  let touchX = 0;
  let touchY = 0;
  let touchActive = false;
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!touchActive) return;
    touchActive = false;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    // Only horizontal swipes (don't intercept vertical scroll)
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      step(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  // Pointer rim-light on the current portrait
  slots.forEach((slot) => {
    const portrait = slot.querySelector('.team-portrait');
    portrait?.addEventListener('pointermove', (e) => {
      const r = portrait.getBoundingClientRect();
      portrait.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      portrait.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });

  // Pause autoplay when the section is offscreen, resume when it comes back
  const section = document.querySelector('.team-section');
  if (section) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) restartAutoplay();
        else clearInterval(autoplayId);
      });
    }, { threshold: 0.2 }).observe(section);
  }

  layout();
  restartAutoplay();
})();

// ---- #13 Cinema page transitions on in-page anchors ----
(() => {
  const iris = document.querySelector('[data-iris]');
  if (!iris || prefersReducedMotion) return;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = link.getAttribute('href');
    if (!target || target.length < 2) return;
    if (link.hasAttribute('data-no-transition')) return;
    const node = document.querySelector(target);
    if (!node) return;
    event.preventDefault();
    iris.classList.add('is-closing');
    setTimeout(() => {
      lenis.scrollTo(node, { duration: 0.001 });
      window.history.replaceState(null, '', target);
      requestAnimationFrame(() => {
        iris.classList.remove('is-closing');
      });
    }, 360);
  });
})();

// ---- #2 Cinema booking interview modal ----
(() => {
  const modal = document.querySelector('[data-booking-modal]');
  if (!modal) return;
  const optionsEl = modal.querySelector('[data-booking-options]');
  const questionEl = modal.querySelector('[data-booking-question]');
  const stepLabel = modal.querySelector('[data-booking-step-label]');
  const summaryEl = modal.querySelector('[data-booking-summary]');
  const backBtn = modal.querySelector('[data-booking-back]');
  const closeEls = modal.querySelectorAll('[data-booking-close]');

  // Service map → routes to Christina's existing Vagaro booking page with a
  // search hint so she lands on the right service. Falls back to the main page.
  const VAGARO_BASE = 'https://www.vagaro.com/lovejonesstylez';
  const flow = [
    {
      label: 'Step 1 of 3',
      question: "What's pulling at you today?",
      options: [
        { label: 'Color', service: 'Color services', key: 'service' },
        { label: 'Locz', service: 'Locz', key: 'service' },
        { label: 'Silk press', service: 'Silk press shine', key: 'service' },
        { label: 'Healthy reset', service: 'Treatments', key: 'service' },
        { label: 'Big chop', service: 'Big Chop', key: 'service' },
        { label: 'Not sure', service: 'Consultation', key: 'service' },
      ],
    },
    {
      label: 'Step 2 of 3',
      question: 'When are you trying?',
      options: [
        { label: 'This week', value: 'this-week', key: 'when' },
        { label: 'Next 2 weeks', value: 'next-2-weeks', key: 'when' },
        { label: 'A month-ish', value: 'month', key: 'when' },
        { label: 'Just exploring', value: 'exploring', key: 'when' },
      ],
    },
    {
      label: 'Step 3 of 3',
      question: 'How do you want to chat first?',
      options: [
        { label: 'Just book', value: 'direct', key: 'mode' },
        { label: 'DM on Instagram', value: 'ig', key: 'mode' },
        { label: 'Quick call', value: 'call', key: 'mode' },
        { label: 'Email questions', value: 'email', key: 'mode' },
      ],
    },
  ];

  let step = 0;
  const answers = {};
  let pendingHref = VAGARO_BASE;

  const summary = () => {
    const bits = [];
    if (answers.service) bits.push(answers.service);
    if (answers.when) bits.push(answers.when.replace('-', ' '));
    if (answers.mode) bits.push(answers.mode);
    return bits.join(' · ');
  };

  const renderStep = () => {
    const s = flow[step];
    stepLabel.textContent = s.label;
    questionEl.textContent = s.question;
    optionsEl.innerHTML = '';
    s.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        answers[opt.key] = opt.service || opt.value;
        summaryEl.textContent = summary();
        if (step < flow.length - 1) {
          step += 1;
          backBtn.hidden = false;
          renderStep();
        } else {
          finish();
        }
      });
      optionsEl.appendChild(btn);
    });
    backBtn.hidden = step === 0;
  };

  const finish = () => {
    const params = new URLSearchParams();
    if (answers.service) params.set('q', answers.service);
    const href = `${pendingHref}${pendingHref.includes('?') ? '&' : '?'}${params.toString()}`;
    questionEl.textContent = `Sending you to Vagaro — ${answers.service || 'consultation'}.`;
    summaryEl.textContent = 'Cinema cut. Enjoy.';
    optionsEl.innerHTML = '';
    backBtn.hidden = true;
    setTimeout(() => {
      window.open(href, '_blank', 'noopener');
      close();
    }, 900);
  };

  const open = (href) => {
    pendingHref = href || VAGARO_BASE;
    step = 0;
    Object.keys(answers).forEach((k) => delete answers[k]);
    summaryEl.textContent = ' ';
    renderStep();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  closeEls.forEach((el) => el.addEventListener('click', close));
  backBtn.addEventListener('click', () => { if (step > 0) { step -= 1; renderStep(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  document.querySelectorAll('[data-booking-interview]').forEach((link) => {
    link.addEventListener('click', (event) => {
      // Cmd/Ctrl+click should still open the raw link in a new tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
      event.preventDefault();
      open(link.getAttribute('href') || VAGARO_BASE);
    });
  });
})();

// ---- #6 Save-this-look share card generator ----
(() => {
  const cards = document.querySelectorAll('.reel-card');
  if (!cards.length) return;
  cards.forEach((card) => {
    const btn = card.querySelector('[data-reel-share]');
    if (!btn) return;
    btn.addEventListener('click', async (event) => {
      event.stopPropagation();
      const preset = card.dataset.reelPreset || 'Cinema';
      const title = card.querySelector('.reel-copy h3')?.textContent?.replace(/[""]/g, '"') || 'Love Jones Stylez';
      const subtitle = card.querySelector('.reel-copy p:last-of-type')?.textContent || '';
      const posterEl = card.querySelector('video');
      const posterUrl = posterEl?.poster;
      try {
        await renderShareCard({ preset, title, subtitle, posterUrl });
      } catch (err) {
        console.warn('[share] render failed', err);
      }
    });
  });

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function renderShareCard({ preset, title, subtitle, posterUrl }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350; // 4:5 — Instagram-native
    const ctx = canvas.getContext('2d');

    // Base
    const grad = ctx.createLinearGradient(0, 0, 0, 1350);
    grad.addColorStop(0, '#0a0505');
    grad.addColorStop(1, '#1b0d0d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Poster cover
    if (posterUrl) {
      try {
        const img = await loadImage(posterUrl);
        const w = 1080, h = 920;
        const ratio = Math.max(w / img.width, h / img.height);
        const dw = img.width * ratio, dh = img.height * ratio;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        // dark fade for legibility
        const fade = ctx.createLinearGradient(0, 600, 0, 920);
        fade.addColorStop(0, 'rgba(7,4,4,0)');
        fade.addColorStop(1, 'rgba(7,4,4,1)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, 600, 1080, 320);
      } catch (_) { /* ignore CORS-blocked images */ }
    }

    // Preset chip
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.strokeStyle = 'rgba(248,212,122,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(64, 64, 280, 56, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff8ef';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText('● REC · ' + preset.toUpperCase(), 96, 100);

    // Title
    ctx.fillStyle = '#fff8ef';
    ctx.font = 'italic 350 78px Fraunces, Georgia, serif';
    wrapText(ctx, title, 64, 1040, 960, 86);

    // Subtitle
    ctx.fillStyle = 'rgba(255,248,239,0.62)';
    ctx.font = '400 22px Inter, sans-serif';
    wrapText(ctx, subtitle, 64, 1170, 960, 30);

    // Brand strip
    ctx.fillStyle = '#f8d47a';
    ctx.fillRect(64, 1252, 80, 4);
    ctx.fillStyle = '#fff8ef';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('Love Jones Stylez · Raleigh, NC', 64, 1296);

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png', 0.92));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love-jones-stylez-${preset.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    if ('vibrate' in navigator) try { navigator.vibrate([6, 30, 12]); } catch (_) {}
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = (text || '').split(/\s+/);
    let line = '';
    for (let i = 0; i < words.length; i += 1) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = words[i];
        y += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
  }
})();
