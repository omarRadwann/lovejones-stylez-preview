import './styles.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.12,
  smoothWheel: true,
  wheelMultiplier: 0.92,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const canvas = document.querySelector('#salon-scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070404, 0.055);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0.1, 9.4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.55, 0.05);
composer.addPass(bloomPass);

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
  const geometry = new THREE.PlaneGeometry(16.6, index % 4 === 0 ? 0.16 : 0.09, 180, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: ribbonVertex,
    fragmentShader: ribbonFragment,
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: index * 0.74 },
      uAmp: { value: 0.2 + (index % 5) * 0.045 },
      uTwist: { value: 0.1 + (index % 4) * 0.035 },
      uSpeed: { value: 0.72 + (index % 7) * 0.09 },
      uScroll: { value: 0 },
      uColor: { value: colors[index % colors.length] },
      uAlpha: { value: index % 4 === 0 ? 0.82 : 0.55 },
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

for (let i = 0; i < 30; i += 1) addRibbon(i);

const haloMaterial = new THREE.MeshBasicMaterial({
  color: 0xf8d47a,
  transparent: true,
  opacity: 0.28,
  blending: THREE.AdditiveBlending,
});

const halo = new THREE.Group();
for (let i = 0; i < 6; i += 1) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.15 + i * 0.29, 0.009, 8, 160, Math.PI * 1.45), haloMaterial);
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
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  bloomPass.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = innerWidth < 720 ? 10.8 : 9.4;
  camera.position.y = innerWidth < 720 ? -0.18 : 0.1;
  root.scale.setScalar(innerWidth < 720 ? 1.14 : 1);
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeRenderer);
resizeRenderer();

const pointer = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
});

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  ribbons.forEach((ribbon, index) => {
    ribbon.material.uniforms.uTime.value = elapsed;
    ribbon.position.y = ribbon.userData.baseY + Math.sin(elapsed * ribbon.userData.floatSpeed + index) * ribbon.userData.floatAmp;
  });

  halo.rotation.z = elapsed * 0.11;
  halo.rotation.y = Math.sin(elapsed * 0.24) * 0.15;
  root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, pointer.x * 0.12, 0.04);
  root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -pointer.y * 0.08, 0.04);

  composer.render();
  requestAnimationFrame(animate);
}

animate();

const scrollState = { value: 0 };
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const progress = self.progress;
    document.querySelector('.scroll-progress')?.style.setProperty('transform', `scaleX(${progress})`);
    scrollState.value = progress;
    ribbons.forEach((ribbon, index) => {
      ribbon.material.uniforms.uScroll.value = Math.sin(progress * Math.PI + index * 0.08) * 0.55;
    });
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, progress * 0.7, 0.04);
    halo.scale.setScalar(1 + progress * 0.28);
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
    start: '35% top',
    end: 'bottom top',
    scrub: true,
  },
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
      bloomPass.strength = 0.32 + self.progress * 0.38;
    },
  });
});

const cursor = document.querySelector('.cursor-ring');
if (cursor && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    gsap.to(cursor, { x: event.clientX, y: event.clientY, autoAlpha: 1, duration: 0.18, ease: 'power3.out' });
  });

  document.querySelectorAll('a, .service-card, .menu-card, .craft-step').forEach((node) => {
    node.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
    node.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  });
}

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
