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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.45));
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

const hairCurveCount = isMobileViewport() ? 2 : 3;
for (let i = 0; i < hairCurveCount; i += 1) {
  const y = THREE.MathUtils.lerp(-2.7, 2.75, i / Math.max(1, hairCurveCount - 1));
  const z = THREE.MathUtils.randFloat(-3.6, 0.8);
  const phase = i * 0.37;
  const points = [];
  for (let p = 0; p < 7; p += 1) {
    const t = p / 6;
    points.push(new THREE.Vector3(
      THREE.MathUtils.lerp(-7.5, 6.6, t),
      y + Math.sin(t * Math.PI * 2 + phase) * (0.24 + (i % 5) * 0.035),
      z + Math.cos(t * Math.PI * 1.4 + phase) * 0.42,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, i % 4 === 0 ? 0.01 : 0.006, 4, false),
    new THREE.MeshBasicMaterial({
      color: colors[(i + 1) % colors.length],
      transparent: true,
      opacity: i % 4 === 0 ? 0.28 : 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  tube.userData = {
    baseY: tube.position.y,
    baseZ: tube.position.z,
    phase,
    speed: THREE.MathUtils.randFloat(0.16, 0.42),
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 0.62 : 0.45));
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
window.addEventListener('pointermove', (event) => {
  wakeScene(1400);
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  document.documentElement.style.setProperty('--spot-x', `${(event.clientX / window.innerWidth) * 100}%`);
  document.documentElement.style.setProperty('--spot-y', `${(event.clientY / window.innerHeight) * 100}%`);
});

const scrollState = { value: 0 };
const clock = new THREE.Clock();
let activeUntil = performance.now() + 3600;

function wakeScene(duration = 1200) {
  activeUntil = Math.max(activeUntil, performance.now() + duration);
}

function animate() {
  const isActive = performance.now() < activeUntil;
  const elapsed = clock.getElapsedTime();

  ribbons.forEach((ribbon, index) => {
    ribbon.material.uniforms.uTime.value = elapsed;
    ribbon.position.y = ribbon.userData.baseY + Math.sin(elapsed * ribbon.userData.floatSpeed + index) * ribbon.userData.floatAmp;
  });

  silkVeil.material.uniforms.uTime.value = elapsed;
  silkVeil.rotation.z = THREE.MathUtils.degToRad(-7 + Math.sin(elapsed * 0.16) * 1.8);

  sparkField.rotation.y = elapsed * 0.024 + pointer.x * 0.04;
  sparkField.rotation.x = pointer.y * 0.025;
  sparkField.position.y = scrollState.value * 0.8 + Math.sin(elapsed * 0.2) * 0.08;

  foilGroup.children.forEach((foil) => {
    foil.position.x = foil.userData.baseX + Math.sin(elapsed * foil.userData.drift + foil.userData.phase) * 0.26;
    foil.position.y = foil.userData.baseY + Math.cos(elapsed * foil.userData.drift * 1.4 + foil.userData.phase) * 0.22 + scrollState.value * 0.5;
    foil.rotation.x += foil.userData.spin * 0.008;
    foil.rotation.y += foil.userData.spin * 0.011;
  });

  portalGroup.rotation.y = THREE.MathUtils.lerp(
    portalGroup.rotation.y,
    THREE.MathUtils.degToRad((isMobileViewport() ? -12 : -24) + pointer.x * 8 + scrollState.value * 18),
    0.035,
  );
  portalGroup.rotation.x = THREE.MathUtils.lerp(portalGroup.rotation.x, THREE.MathUtils.degToRad(-2 - pointer.y * 4), 0.035);
  portalGroup.position.y = (isMobileViewport() ? -0.04 : 0.02) + Math.sin(elapsed * 0.34) * 0.08 + scrollState.value * 0.28;
  portalRing.rotation.z = elapsed * 0.18;
  portalRingInner.rotation.z = -elapsed * 0.14;
  portalGlass.material.opacity = 0.28 + Math.sin(elapsed * 0.9) * 0.04;
  chairGroup.rotation.y = Math.sin(elapsed * 0.48) * 0.16 + pointer.x * 0.08;
  labelGroup.children.forEach((panel, index) => {
    const data = panel.userData;
    const angle = data.angle + elapsed * data.speed + scrollState.value * Math.PI * 1.2;
    panel.position.set(Math.cos(angle) * data.radius, data.y + Math.sin(elapsed * 0.42 + index) * 0.08, Math.sin(angle) * 0.76 + 0.38);
    panel.rotation.y = -portalGroup.rotation.y + Math.sin(angle) * 0.18;
    panel.rotation.x = -portalGroup.rotation.x * 0.5;
    panel.material.opacity = 0.42 + (Math.sin(angle) + 1) * 0.22;
  });

  hairCurveGroup.children.forEach((tube, index) => {
    tube.position.y = tube.userData.baseY + Math.sin(elapsed * tube.userData.speed + tube.userData.phase) * 0.18;
    tube.position.z = tube.userData.baseZ + Math.cos(elapsed * tube.userData.speed * 0.8 + tube.userData.phase) * 0.28;
    tube.rotation.y = Math.sin(elapsed * 0.16 + index * 0.08) * 0.05 + pointer.x * 0.06;
    tube.rotation.z = Math.cos(elapsed * 0.12 + index * 0.05) * 0.025;
  });

  halo.rotation.z = elapsed * 0.11;
  halo.rotation.y = Math.sin(elapsed * 0.24) * 0.15;
  root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, pointer.x * 0.12, 0.04);
  root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -pointer.y * 0.08, 0.04);
  roseLight.intensity = 22 + Math.sin(elapsed * 0.8) * 3;
  goldLight.intensity = 17 + Math.cos(elapsed * 0.65) * 2.4;
  greenLight.intensity = 9 + Math.sin(elapsed * 0.52) * 1.8;

  renderer.render(scene, camera);
  window.setTimeout(() => requestAnimationFrame(animate), isActive ? 1000 / 18 : 1000 / 3);
}

animate();

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
  gsap.fromTo(card,
    { y: 44, rotateX: 4, autoAlpha: 0, filter: 'blur(8px)' },
    {
      y: 0,
      rotateX: 0,
      autoAlpha: 1,
      filter: 'blur(0px)',
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

  window.addEventListener('pointermove', (event) => {
    moveCursorX(event.clientX);
    moveCursorY(event.clientY);
    gsap.to(cursor, { autoAlpha: 1, duration: 0.18, overwrite: true });
  });

  document.querySelectorAll('a, .service-card, .menu-card, .craft-step, .storyboard article, .team-grid article').forEach((node) => {
    node.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
    node.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  });
}

const litCards = document.querySelectorAll('.service-card, .menu-card, .team-grid article, .policy-grid article, .storyboard article, .hours-board div');
litCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--my', `${(y / rect.height) * 100}%`);

    if (!finePointer || prefersReducedMotion) return;
    const rotateX = ((y / rect.height) - 0.5) * -5;
    const rotateY = ((x / rect.width) - 0.5) * 5;
    card.classList.add('is-lit');
    gsap.to(card, { rotateX, rotateY, z: 16, duration: 0.32, ease: 'power3.out', overwrite: true });
  });

  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-lit');
    gsap.to(card, { rotateX: 0, rotateY: 0, z: 0, duration: 0.48, ease: 'elastic.out(1, 0.55)', overwrite: true });
  });
});

document.querySelectorAll('[data-magnetic]').forEach((node) => {
  node.addEventListener('pointermove', (event) => {
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(node, { x: x * 0.14, y: y * 0.18, duration: 0.25, ease: 'power3.out' });
  });

  node.addEventListener('pointerleave', () => {
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

const reelObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const card = entry.target;
    const video = card.querySelector('video');
    if (entry.isIntersecting) {
      card.classList.add('is-revealed');
      if (video && video.dataset.loaded === 'true' && card.classList.contains('is-playing')) {
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

loadReelSources().then((reelSources) => {
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
