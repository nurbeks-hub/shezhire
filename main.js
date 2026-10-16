import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ data */

const LINE = [
  { name: 'Дулат', sibs: ['Албан', 'Суан', 'Дулат'] },
  { name: 'Жаныс', sibs: ['Сиқым', 'Жаныс', 'Ботбай', 'Шымыр'] },
  { name: 'Жарлықамыс', sibs: ['Жарлықамыс', 'Шегір', 'Жантан', 'Жанту', 'Оймауыт', 'Бөгежіл', 'Қапал', 'Өтей'] },
  { name: 'Бейімбет-Қасқарау', sibs: ['Бейімбет-Қасқарау', 'Жәлменбет', 'Байыс'] },
  { name: 'Бұқар', sibs: ['Ораз', 'Бұқар', 'Елтүзер'] },
  { name: 'Сырымбет', sibs: ['Баба', 'Сырымбет', 'Құлболды', 'Тілеуімбет', 'Жауғаш', 'Қиян'] },
  { name: 'Өтеп', sibs: ['Өтеп', 'Өтеғұл', 'Аңдақұл батыр', 'Тәңірқұл', 'Рысқұл', 'Жылқайдар'] },
  { name: 'Құдайберген', sibs: ['Тауасар', 'Құдайберген', 'Құттықадам', 'Қожан', 'Боқай', 'Жантоқ', 'Дәулен'] },
  { name: 'Шүрегей', sibs: ['Қотанбай', 'Кішік', 'Шүрегей', 'Байқан', 'Медет', 'Таңат', 'Кенжебек'] },
  { name: 'Бекбота', sibs: ['Ботабай', 'Пұшық', 'Байқұлақ', 'Жандарал', 'Бекбота'] },
  { name: 'Әбіш', sibs: ['Әбіш', 'Медеу', 'Серікбай', 'Сатыбалды'] },
  { name: 'Едіге', sibs: ['Едіге'] },
  { name: 'Қазақ', sibs: ['Қанат', 'Қазақ', 'Нілдібай'] },
  { name: 'Төлеулі қажы Қазақұлы', short: 'Төлеулі', label: 'Төлеулі қажы Қазақұлы', sibs: ['Оразхан', 'Оралхан', 'Төлеулі'], self: 'Төлеулі',
    formal: 'Садвакасов Төлеулі Әбітқожаұлы', grand: true,
    note_kk: 'Нұрбектің атасы. Қажылық парызын өтеген.', note_ru: 'Дедушка Нурбека. Совершил хадж.' },
];
const N = LINE.length;          // 14 ancestors
const ME = N;                   // index of the viewer's own place

const T = {
  kk: {
    brand: 'ШЕЖІРЕ', eyebrow: 'Ұлы жүз · Дулат · Жаныс', title: 'Он төрт ата<br><em>бір қатарда</em>',
    lead: 'Дулаттан Төлеулі қажыға дейін. Әр баба өз орнына тұрады.', start: 'Бастау', loading: 'жүктелуде',
    hint: 'Тышқанмен қараңыз · WASD — ұшу · Shift — жылдам · Атаны басыңыз', hintTouch: 'Саусақпен қараңыз · сол жақтағы джойстикпен ұшыңыз · Атаны басыңыз',
    gen: (i) => `${i + 1}-буын · ${N - i}-ата`, sibs: 'Бір әкенің ұлдары', sibs0: 'Жарықшақтың ұлдары',
    me: 'Нұрбек', meGen: 'Он бесінші буын', meNote: 'Төлеулі қажының немересі. Шежіре осы жерден жалғасады.',
    caption: 'Он төрт ата. Бір шаңырақ.', you: 'СЕН', src: 'Дереккөз', ata: (i) => `${N - i}-ата`,
  },
  ru: {
    brand: 'ШЕЖИРЕ', eyebrow: 'Старший жуз · Дулат · Жаныс', title: 'Четырнадцать предков<br><em>в одном строю</em>',
    lead: 'От Дулата до Тулеули-кажы. Каждый предок встаёт на своё место.', start: 'Начать', loading: 'загрузка',
    hint: 'Мышь — осмотреться · WASD — лететь · Shift — быстрее · Нажмите на предка', hintTouch: 'Пальцем — осмотреться · джойстик слева — лететь · Нажмите на предка',
    gen: (i) => `${i + 1}-е колено · ${N - i}-й предок`, sibs: 'Сыновья его отца', sibs0: 'Сыновья Жарыкшака',
    me: 'Нурбек', meGen: 'Пятнадцатое колено', meNote: 'Внук Тулеули-кажы. Шежире продолжается отсюда.',
    caption: 'Четырнадцать предков. Один шанырак.', you: 'ТЫ', src: 'Источник', ata: (i) => `${N - i}-й предок`,
  },
};
let lang = 'kk';
try { lang = localStorage.getItem('shz-lang') || (new URLSearchParams(location.search).get('lang')) || 'kk'; } catch (e) {}
if (!T[lang]) lang = 'kk';

/* ------------------------------------------------------------- renderer */

const isTouch = matchMedia('(pointer: coarse)').matches;
const isSmall = Math.min(innerWidth, innerHeight) < 700;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall ? 1.6 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(isSmall && innerWidth < innerHeight ? 58 : 42, innerWidth / innerHeight, 0.1, 2400);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.75, 0.5, 0.42);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const FOG = new THREE.Color('#060b13');
const FOG_D = 0.0085;
const SPIRIT = new THREE.Color('#8fdcff');
const GOLD = new THREE.Color('#ffcf86');
const MOON_DIR = new THREE.Vector3(-0.5, 0.16, -0.85).normalize();

const U = { time: { value: 0 } };

const NOISE = /* glsl */`
float hash3(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x), mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x), mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
`;
const FOGF = /* glsl */`
uniform vec3 uFogColor; uniform float uFogDensity;
vec3 applyFog(vec3 c, vec3 wp){ float d=length(cameraPosition-wp); float f=1.0-exp(-pow(d*uFogDensity,2.0)); return mix(c,uFogColor,f); }
`;
const fogU = { uFogColor: { value: FOG }, uFogDensity: { value: FOG_D } };

/* ----------------------------------------------------------------- path */

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-30, 0, -104), new THREE.Vector3(-14, 0, -76), new THREE.Vector3(-1, 0, -48),
  new THREE.Vector3(4, 0, -22), new THREE.Vector3(0, 0, 0),
], false, 'centripetal');
curve.arcLengthDivisions = 2000;
const uOf = (k) => THREE.MathUtils.clamp(k / ME, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
function frameAt(k) {
  const u = uOf(k);
  const p = curve.getPointAt(u);
  const t = curve.getTangentAt(u).setY(0).normalize();      // points toward the present
  const n = new THREE.Vector3().crossVectors(UP, t).normalize();
  return { p, t, n };
}

/* ------------------------------------------------------------------ sky */

{
  const g = new THREE.SphereGeometry(1800, 64, 32);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uMoon: { value: MOON_DIR }, ...U },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: NOISE + `
      uniform vec3 uMoon; varying vec3 vD;
      void main(){
        vec3 d = normalize(vD);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 zen = vec3(0.004,0.007,0.018), mid = vec3(0.016,0.03,0.055), hor = vec3(0.045,0.07,0.1);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h));
        c = mix(c, zen, smoothstep(0.15, 0.85, h));
        float md = dot(d, uMoon);
        c += vec3(0.16,0.20,0.26) * pow(max(md,0.0), 22.0) * 0.4;
        c += vec3(0.40,0.43,0.48) * pow(max(md,0.0), 400.0) * 0.35;
        // milky way
        vec3 bn = normalize(vec3(0.62, 0.35, 0.7));
        float band = exp(-pow(dot(d,bn)/0.16, 2.0)) * smoothstep(0.02, 0.35, d.y);
        float dust = fbm(d*7.0) ;
        c += vec3(0.11,0.12,0.16) * band * smoothstep(0.35,0.8,dust) * 0.8;
        c -= vec3(0.03) * band * smoothstep(0.55,0.75,fbm(d*13.0+3.0));
        // moon disc
        float disc = smoothstep(0.99955, 0.99968, md);
        float mare = fbm(d*180.0);
        vec3 moon = vec3(1.0,0.97,0.9) * (0.82 + 0.25*smoothstep(0.35,0.7,mare));
        c = mix(c, moon*0.95, disc);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(g, m);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  sky.onBeforeRender = () => sky.position.copy(camera.position);
  scene.add(sky);
}

/* stars */
{
  const n = isSmall ? 2600 : 4200;
  const pos = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v;
    do { v = new THREE.Vector3(Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1); } while (v.length() > 1 || v.length() < 0.2);
    v.normalize();
    if (v.y < 0.03) { i--; continue; }
    pos.set([v.x * 1500, v.y * 1500, v.z * 1500], i * 3);
    size[i] = Math.pow(Math.random(), 6) * 3.2 + 0.7;
    ph[i] = Math.random() * 6.283;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...U, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aSize; attribute float aPh; uniform float time; uniform float uPR; varying float vA;
      void main(){ vec3 wp = position + cameraPosition; vec4 mv = viewMatrix*vec4(wp,1.0); gl_Position = projectionMatrix*mv;
        float tw = 0.75 + 0.25*sin(time*(1.1+fract(aPh)*2.0) + aPh*7.0);
        vA = tw * smoothstep(0.0, 0.12, normalize(position).y);
        gl_PointSize = aSize * uPR; }`,
    fragmentShader: `varying float vA; void main(){ vec2 q = gl_PointCoord-0.5; float r = length(q); float a = smoothstep(0.5,0.0,r); a*=a; gl_FragColor = vec4(vec3(0.85,0.9,1.0)*a*vA*1.4, 1.0); }`,
  });
  const stars = new THREE.Points(g, m);
  stars.frustumCulled = false;
  stars.renderOrder = -9;
  scene.add(stars);
}

/* mountains: two ridgelines */
function ridge(radius, base, amp, seed, col, fogMix) {
  const seg = 720, pos = [], idx = [];
  const rnd = (x) => { const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const n1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return rnd(i) * (1 - u) + rnd(i + 1) * u; };
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const x = i / seg * 26;
    let h = 0, amp2 = 1, f = 1;
    for (let o = 0; o < 5; o++) { const v = n1(x * f); h += (o < 2 ? v : (1 - Math.abs(v * 2 - 1)) * 0.6) * amp2; amp2 *= 0.42; f *= 2.3; }
    // keep the moon side lower so the moon clears the ridge
    const toMoon = Math.cos(a - Math.atan2(MOON_DIR.z, MOON_DIR.x));
    h = base + amp * h * (1 - 0.55 * Math.max(0, toMoon) ** 3);
    const cx = Math.cos(a) * radius, cz = Math.sin(a) * radius;
    pos.push(cx, -20, cz, cx, h, cz);
    if (i < seg) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, depthWrite: true,
    uniforms: { uCol: { value: new THREE.Color(col) }, uHor: { value: new THREE.Color('#0c1622') }, uMix: { value: fogMix } },
    vertexShader: `varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uCol; uniform vec3 uHor; uniform float uMix; varying float vY;
      void main(){ vec3 c = mix(uHor, uCol, smoothstep(-10.0, 60.0, vY)); c = mix(c, uHor, uMix); gl_FragColor = vec4(c,1.0); }`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = -8;
  mesh.frustumCulled = false;
  mesh.onBeforeRender = () => { mesh.position.x = camera.position.x; mesh.position.z = camera.position.z; };
  scene.add(mesh);
}
ridge(1150, 10, 120, 3.1, '#0b131d', 0.42);
ridge(760, 0, 48, 7.7, '#060b12', 0.12);

/* -------------------------------------------------------------- ground */

const figU = { value: Array.from({ length: N + 1 }, () => new THREE.Vector4(0, 0, 0, 0)) };
const GLOW = /* glsl */`
uniform vec4 uFig[${N + 1}];
vec3 spiritGlow(vec3 wp){
  vec3 g = vec3(0.0);
  for(int i=0;i<${N + 1};i++){ vec2 d = wp.xz - uFig[i].xy; float r2 = dot(d,d);
    vec3 col = uFig[i].w > 0.5 ? vec3(1.0,0.78,0.45) : vec3(0.52,0.84,1.0);
    g += col * uFig[i].z * (exp(-r2/5.0)*0.7 + exp(-r2/40.0)*0.1); }
  return g;
}`;

{
  const g = new THREE.PlaneGeometry(2400, 2400, 1, 1).rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, ...fogU, uFig: figU, uMoon: { value: MOON_DIR } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: NOISE + FOGF + GLOW + `
      varying vec3 vW; uniform vec3 uMoon;
      void main(){
        float n = fbm(vec3(vW.xz*0.06, 0.0));
        float n2 = vnoise(vec3(vW.xz*0.9, 1.0));
        vec3 base = mix(vec3(0.010,0.014,0.012), vec3(0.024,0.030,0.024), n) * (0.85+0.3*n2);
        vec3 moonlit = base * vec3(0.6,0.7,0.9);
        vec3 c = moonlit + spiritGlow(vW) * (0.32 + 0.25*n2);
        c = applyFog(c, vW);
        gl_FragColor = vec4(c,1.0);
      }`,
  });
  scene.add(new THREE.Mesh(g, m));
}

/* grass */
{
  const segs = 4, w = 0.022;
  const base = new THREE.BufferGeometry();
  const p = [], idx = [];
  for (let j = 0; j <= segs; j++) { const y = j / segs, ww = w * (1 - y * 0.92); p.push(-ww, y, 0, ww, y, 0); }
  for (let j = 0; j < segs; j++) { const b = j * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.setIndex(idx);
  const count = isSmall ? 14000 : 36000;
  const off = new Float32Array(count * 4);
  const samples = Array.from({ length: 200 }, (_, i) => curve.getPointAt(i / 199));
  for (let i = 0; i < count; i++) {
    const s = samples[(Math.random() * samples.length) | 0];
    const r = Math.pow(Math.random(), 1.6) * 26, a = Math.random() * Math.PI * 2;
    off.set([s.x + Math.cos(a) * r, s.z + Math.sin(a) * r, 0.25 + Math.random() * 0.75, Math.random() * 6.283], i * 4);
  }
  geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
  geo.instanceCount = count;
  const m = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...U, ...fogU, uFig: figU },
    vertexShader: NOISE + `attribute vec4 aOff; uniform float time; varying vec3 vW; varying float vY;
      void main(){
        float h = aOff.z * 0.55;
        float ang = aOff.w;
        vec3 p = vec3(position.x, position.y*h, 0.0);
        float c = cos(ang), s = sin(ang);
        p = vec3(p.x*c, p.y, p.x*s);
        vec3 wp = vec3(aOff.x, 0.0, aOff.y) + p;
        float wind = vnoise(vec3(aOff.xy*0.08 - time*0.35, 0.0))*2.0-1.0;
        float bend = position.y*position.y;
        wp.x += bend * (0.16*wind + 0.03*sin(time*2.1+ang)) * h;
        wp.z += bend * 0.08*wind * h;
        vW = wp; vY = position.y;
        gl_Position = projectionMatrix*viewMatrix*vec4(wp,1.0);
      }`,
    fragmentShader: FOGF + GLOW + `varying vec3 vW; varying float vY;
      void main(){
        vec3 c = mix(vec3(0.004,0.007,0.005), vec3(0.030,0.040,0.032), vY);
        c *= vec3(0.65,0.75,0.95);
        c += spiritGlow(vW) * (0.05 + 0.4*vY*vY);
        gl_FragColor = vec4(applyFog(c, vW), 1.0);
      }`,
  });
  const grass = new THREE.Mesh(geo, m);
  grass.frustumCulled = false;
  scene.add(grass);
}

/* the path of light along the ground */
const pathU = { uReveal: { value: 0 } };
{
  const S = 600, w = 0.16, p = [], uv = [], idx = [];
  for (let i = 0; i <= S; i++) {
    const u = i / S, c = curve.getPointAt(u), t = curve.getTangentAt(u).setY(0).normalize();
    const n = new THREE.Vector3().crossVectors(UP, t).normalize();
    p.push(c.x - n.x * w, 0.03, c.z - n.z * w, c.x + n.x * w, 0.03, c.z + n.z * w);
    uv.push(u, 0, u, 1);
    if (i < S) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...U, ...pathU, ...fogU },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: FOGF + `uniform float time; uniform float uReveal; varying vec2 vUv; varying vec3 vW;
      void main(){
        float across = 1.0 - abs(vUv.y*2.0-1.0); across = pow(across, 2.5);
        float pulse = pow(fract(vUv.x*9.0 - time*0.12), 14.0);
        float shown = smoothstep(uReveal, uReveal - 0.04, 1.0 - vUv.x);
        vec3 c = vec3(0.45,0.8,1.0) * (0.10 + 0.9*pulse) * across * shown;
        float d = length(cameraPosition - vW); c *= exp(-pow(d*0.0085,2.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 12;
  scene.add(mesh);
}

/* ------------------------------------------------------------ figures */

const ghostVS = `varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vL;
void main(){ vL = position; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`;
const ghostFS = NOISE + FOGF + `
uniform sampler2D uMap; uniform float uHasMap; uniform float uFaceY; uniform float uBlurFace; varying vec3 vL; uniform vec3 uTint; uniform vec3 uRim; uniform vec3 uEdge;
uniform float uReveal; uniform float uBaseY; uniform float uHeight; uniform float time; uniform float uSolid; uniform float uOpacity; uniform vec3 uMoon;
varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){
  float h = (vW.y - uBaseY) / uHeight;
  float nz = vnoise(vW*7.0 + vec3(0.0, -time*0.4, 0.0));
  float edge = uReveal*1.3 - h - nz*0.22;
  if(edge < 0.0) discard;
  vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  float fres = pow(1.0 - clamp(abs(dot(n,v)),0.0,1.0), 2.2);
  // faces we don't know stay unknown: wipe the detail from the head and fill it with soft light
  float face = uBlurFace * smoothstep(0.17, 0.09, abs(vL.y - uFaceY)) * smoothstep(0.26, 0.12, length(vL.xz));
  vec3 tex = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : vec3(0.45);
  tex = mix(tex, vec3(0.55), face);
  float lum = dot(tex, vec3(0.299,0.587,0.114));
  float scan = 0.5 + 0.5*sin(vW.y*34.0 - time*2.2);
  float drift = vnoise(vW*2.5 + vec3(0.0, time*0.25, 0.0));
  vec3 ghost = uTint*(0.06 + lum*0.75)*(0.8+0.4*drift) + uRim*fres*2.1*(1.0-face*0.85) + uTint*scan*0.035;
  ghost = mix(ghost, uTint*(0.22 + 0.06*drift) + uRim*fres*0.6, face);
  float lam = max(dot(n, uMoon), 0.0)*0.55 + 0.32;
  vec3 solid = tex*lam*vec3(0.85,0.9,1.0) + uRim*fres*0.9;
  vec3 c = mix(ghost, solid, uSolid);
  float band = smoothstep(0.09, 0.0, edge) * (1.0 - smoothstep(1.05, 1.25, uReveal));
  c += uEdge * band * 5.0;
  float a = mix(0.42 + fres*0.58, 1.0, uSolid);
  a = max(a, band);
  c = applyFog(c, vW);
  gl_FragColor = vec4(c, a * uOpacity);
}`;

function fallbackGeometry(variant) {
  // a robed silhouette: lathe body + head + hat, until the generated models are in place
  const prof = [[0.0, 0], [0.34, 0], [0.33, 0.12], [0.30, 0.55], [0.25, 0.95], [0.27, 1.25], [0.25, 1.36], [0.12, 1.44], [0.07, 1.5], [0.0, 1.5]];
  const body = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x * (variant === 2 ? 1.12 : 1), y)), 40);
  const head = new THREE.SphereGeometry(0.115, 24, 16).translate(0, 1.6, 0);
  const hat = variant === 1
    ? new THREE.CylinderGeometry(0.07, 0.15, 0.24, 24).translate(0, 1.77, 0)
    : new THREE.SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.68, 0);
  const parts = [body, head, hat].map((g) => { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('uv'); return n; });
  const geo = new THREE.BufferGeometry();
  const pos = [], nor = [];
  parts.forEach((g) => { g.computeVertexNormals(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  geo.scale(1.2, 1.2, 1.2);
  return { geo, map: null };
}

function extractModel(gltf) {
  // flatten the glTF into one geometry and one texture
  const geos = []; let map = null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    geos.push(g);
    if (!map && o.material && o.material.map) map = o.material.map;
  });
  if (!geos.length) return null;
  const geo = new THREE.BufferGeometry();
  for (const key of ['position', 'normal', 'uv']) {
    const size = geos[0].attributes[key].itemSize;
    const total = geos.reduce((s, g) => s + g.attributes[key].array.length, 0);
    const arr = new Float32Array(total); let o = 0;
    geos.forEach((g) => { arr.set(g.attributes[key].array, o); o += g.attributes[key].array.length; });
    geo.setAttribute(key, new THREE.BufferAttribute(arr, size));
  }
  // normalize: feet at 0, height 1.8, centred
  geo.computeBoundingBox();
  const b = geo.boundingBox, h = b.max.y - b.min.y, s = 1.8 / h;
  geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  geo.scale(s, s, s);
  return { geo: mergeVertices(geo), map, faceY: findFaceY(geo) };
}

// the neck is the narrowest slice between shoulders and head; the face sits just above it
function findFaceY(geo) {
  const pos = geo.attributes.position, bins = new Map();
  for (let v = 0; v < pos.count; v++) {
    const y = pos.getY(v); if (y < 1.25 || y > 1.7) continue;
    const b = Math.round(y / 0.02), r = Math.hypot(pos.getX(v), pos.getZ(v));
    bins.set(b, Math.max(bins.get(b) || 0, r));
  }
  let neck = null, best = Infinity;
  for (const [b, r] of bins) if (r < best && b * 0.02 > 1.35) { best = r; neck = b * 0.02; }
  return neck ? THREE.MathUtils.clamp(neck + 0.14, 1.45, 1.66) : 1.56;
}
let _haze = null;
function hazeTex() {
  if (_haze) return _haze;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _haze = new THREE.CanvasTexture(c); return _haze;
}

const figures = [];
const hitProxies = [];
const VARIANT = [0, 2, 1, 2, 0, 1, 2, 0, 1, 0, 2, 1, 0];  // which of the 3 models each ancestor uses

function makeFigure(i, model) {
  const { p, t } = frameAt(i);
  const grand = !!LINE[i]?.grand;
  const uni = {
    ...U, ...fogU,
    uMap: { value: model.map }, uHasMap: { value: model.map ? 1 : 0 },
    uTint: { value: grand ? new THREE.Color('#ffd9a0') : new THREE.Color('#9fdcff') },
    uRim: { value: grand ? new THREE.Color('#ffc477') : new THREE.Color('#bdf0ff') },
    uEdge: { value: grand ? new THREE.Color('#ffd39a') : new THREE.Color('#d5f6ff') },
    uReveal: { value: 0 }, uBaseY: { value: 0 }, uHeight: { value: 1.9 },
    uSolid: { value: model.real ? 0.92 : 0 }, uOpacity: { value: 1 }, uMoon: { value: MOON_DIR },
    uFaceY: { value: model.faceY ?? 1.56 }, uBlurFace: { value: model.real ? 0 : 1 },
  };
  const ghost = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: ghostVS, fragmentShader: ghostFS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const pre = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: ghostVS, fragmentShader: ghostFS, transparent: true, colorWrite: false, depthWrite: true });
  const group = new THREE.Group();
  const scale = grand ? 1.0 : 1.04 + ((i * 37) % 7) * 0.012;
  const m1 = new THREE.Mesh(model.geo, pre); m1.renderOrder = 10;
  const m2 = new THREE.Mesh(model.geo, ghost); m2.renderOrder = 11;
  group.add(m1, m2);
  group.scale.setScalar(scale);
  group.position.copy(p);
  group.rotation.y = Math.atan2(t.x, t.z);
  scene.add(group);

  // a haze of light in front of the face, so the unknown features read as blurred
  let haze = null;
  if (false) {
    haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeTex(), color: grand ? GOLD : SPIRIT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    haze.position.copy(p).addScaledVector(t, 0.16 * scale).setY((model.faceY ?? 1.56) * scale);
    haze.scale.setScalar(0.62 * scale);
    haze.renderOrder = 14;
    scene.add(haze);
  }

  // ground ring + faint pillar
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2), ringMat(grand ? GOLD : SPIRIT));
  ring.position.set(p.x, 0.04, p.z); ring.renderOrder = 12; scene.add(ring);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 40, 40, 1, true), pillarMat(grand ? GOLD : SPIRIT));
  pillar.position.set(p.x, 20, p.z); pillar.renderOrder = 13; scene.add(pillar);

  const proxy = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.2, 8), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.position.set(p.x, 1.1, p.z); proxy.userData.index = i; scene.add(proxy); hitProxies.push(proxy);

  return { i, group, uni, ring, pillar, haze, lit: 0, ignitedAt: -1, head: new THREE.Vector3(p.x, 2.25 * scale, p.z), pos: p };
}

function ringMat(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: color.clone() }, uI: { value: 0 }, uR: { value: 0.8 }, ...U },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uCol; uniform float uI; uniform float uR; uniform float time; varying vec2 vUv;
      void main(){ float r = length(vUv-0.5)*2.0;
        float ring = smoothstep(uR-0.05, uR, r) * smoothstep(uR+0.04, uR, r);
        float inner = exp(-r*r*5.0)*0.55;
        float rot = 0.5+0.5*sin(atan(vUv.y-0.5, vUv.x-0.5)*6.0 + time*0.6);
        gl_FragColor = vec4(uCol*(ring*(0.6+0.4*rot) + inner)*uI, 1.0); }`,
  });
}
function pillarMat(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCol: { value: color.clone() }, uI: { value: 0 }, ...U },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uI; uniform float time; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float side = pow(1.0-abs(dot(normalize(vN), v)), 1.5);
        float fall = pow(1.0 - vUv.y, 3.0);
        float flick = 0.85 + 0.15*sin(vUv.y*40.0 - time*3.0);
        gl_FragColor = vec4(uCol * fall * (0.25 + side) * flick * uI * 0.5, 1.0); }`,
  });
}

/* the viewer's own place */
const meRing = new THREE.Mesh(new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2), ringMat(new THREE.Color('#9ff3e6')));
{ const { p } = frameAt(ME); meRing.position.set(p.x, 0.05, p.z); meRing.renderOrder = 12; scene.add(meRing); }

/* motes rising around the spirits */
const motes = (() => {
  const n = isSmall ? 260 : 520;
  const pos = new Float32Array(n * 3), seed = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { seed[i * 2] = Math.random() * N; seed[i * 2 + 1] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPR: { value: renderer.getPixelRatio() }, ...fogU },
    vertexShader: `uniform float uPR; attribute float aA; varying float vA; void main(){ vA = aA; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uPR * 34.0 / -mv.z; }`,
    fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,r); gl_FragColor = vec4(vec3(0.7,0.92,1.0)*a*a*vA, 1.0); }`,
  });
  const alpha = new Float32Array(n);
  g.setAttribute('aA', new THREE.BufferAttribute(alpha, 1));
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 14; scene.add(pts);
  return { n, pos, seed, alpha, g };
})();

/* ------------------------------------------------------------- loading */

const loadBar = document.getElementById('load');
const manager = new THREE.LoadingManager();
manager.onProgress = (_, loaded, total) => { loadBar.style.transform = `scaleX(${loaded / total})`; };
const loader = new GLTFLoader(manager);
const loadGLB = (url) => new Promise((res) => loader.load(url, (g) => res(g), undefined, () => res(null)));

let lineage = null;
async function loadAll() {
  const [a1, a2, a3, gf, lin] = await Promise.all([
    loadGLB('models/ancestor_1.glb'), loadGLB('models/ancestor_2.glb'), loadGLB('models/ancestor_3.glb'),
    loadGLB('models/grandfather.glb'),
    fetch('data/lineage.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  lineage = lin;
  const models = [a1, a2, a3].map((g, k) => (g && extractModel(g)) || fallbackGeometry(k));
  const gModel = gf && extractModel(gf);
  if (gModel) gModel.real = true;
  for (let i = 0; i < N; i++) {
    const model = LINE[i].grand ? (gModel || models[0]) : models[VARIANT[i] ?? (i % 3)];
    figures.push(makeFigure(i, model));
  }
  buildLabels();
  buildRail();
  applyLang();
  loadBar.style.transform = 'scaleX(1)'; loadBar.classList.add('done');
  igniteAll();
  document.body.classList.add('free');
  const hint = document.getElementById('hint'); hint.classList.add('show'); setTimeout(() => hint.classList.remove('show'), 6500);
}

/* --------------------------------------------------------------- audio */

const audio = {
  ctx: null, master: null, buffers: {}, muted: false, started: false,
  async init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    const names = ['wind', 'drone', 'chime'];
    await Promise.all(names.map(async (n) => {
      try {
        const r = await fetch(`audio/${n}.mp3`);
        if (!r.ok) throw 0;
        this.buffers[n] = await this.ctx.decodeAudioData(await r.arrayBuffer());
      } catch (e) { this.buffers[n] = null; }
    }));
  },
  loop(name, gain, fade = 3) {
    if (!this.ctx) return;
    const b = this.buffers[name];
    const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.master);
    let src;
    if (b) { src = this.ctx.createBufferSource(); src.buffer = b; src.loop = true; src.loopStart = 0.06; src.loopEnd = b.duration - 0.06; }
    else if (name === 'wind') { src = this.noiseWind(); }
    else return;
    src.connect(g); src.start();
    g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + fade);
    return g;
  },
  noiseWind() {
    const len = this.ctx.sampleRate * 4, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    s.connect(f); const out = { connect: (n) => f.connect(n), start: () => s.start() }; return out;
  },
  chime(depth) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain(); g.connect(this.master);
    const vol = 0.55 * (1 - depth * 0.55);
    if (this.buffers.chime) {
      const s = this.ctx.createBufferSource(); s.buffer = this.buffers.chime; s.playbackRate.value = 1 - depth * 0.22;
      g.gain.value = vol; s.connect(g); s.start();
    } else {
      const base = 220 * (1 - depth * 0.3);
      [1, 2.01, 2.76, 4.07].forEach((k, j) => {
        const o = this.ctx.createOscillator(); o.frequency.value = base * k;
        const og = this.ctx.createGain(); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(vol * 0.18 / (j + 1), t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 - j * 0.5); o.connect(og); og.connect(g); o.start(t); o.stop(t + 4);
      });
      g.gain.value = 1;
    }
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.2); },
};
const soundBtn = document.getElementById('sound');
soundBtn.addEventListener('click', () => { audio.setMuted(!audio.muted); soundBtn.classList.toggle('muted', audio.muted); });

/* ----------------------------------------------------------- UI: labels */

const labelsEl = document.getElementById('labels');
const labels = [];
function buildLabels() {
  for (let i = 0; i <= N; i++) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = '<div class="n"></div><div class="g"></div>';
    el.addEventListener('click', () => focusOn(i, true));
    labelsEl.appendChild(el);
    labels.push({ el, a: 0 });
  }
}
function buildRail() {
  const rail = document.getElementById('rail');
  for (let i = 0; i <= N; i++) {
    const b = document.createElement('button');
    b.innerHTML = '<span></span><i></i>';
    if (i === ME) b.classList.add('me');
    b.addEventListener('click', () => focusOn(i, true));
    rail.appendChild(b);
  }
}
function applyLang() {
  const L = T[lang];
  document.documentElement.lang = lang === 'kk' ? 'kk' : 'ru';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = L[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = L[el.dataset.i18nHtml]; });
  document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
  labels.forEach((l, i) => {
    l.el.querySelector('.n').textContent = i === ME ? L.you : (LINE[i].label || LINE[i].short || LINE[i].name);
    l.el.querySelector('.g').textContent = i === ME ? L.me : L.ata(i);
  });
  document.querySelectorAll('#rail button').forEach((b, i) => { b.querySelector('span').textContent = i === ME ? L.me : (LINE[i].short || LINE[i].name); });
  document.getElementById('hint').textContent = isTouch ? L.hintTouch : L.hint;
  if (cardIndex !== null) fillCard(cardIndex);
}
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
  lang = b.dataset.lang; try { localStorage.setItem('shz-lang', lang); } catch (e) {} applyLang();
}));

/* ----------------------------------------------------------- UI: card */

const card = document.getElementById('card');
let cardIndex = null;
function noteFor(i) {
  const extra = lineage?.line?.find((x) => x.name === LINE[i].name || x.name === LINE[i].short);
  const note = LINE[i][`note_${lang}`] || extra?.[`note_${lang}`] || '';
  const sources = LINE[i].grand ? [] : (extra?.sources || []);
  return { note, sources };
}
function fillCard(i) {
  const L = T[lang];
  const q = (s) => card.querySelector(s);
  if (i === ME) {
    q('.gen').textContent = L.meGen; q('.name').textContent = L.me; q('.formal').textContent = '';
    q('.note').textContent = L.meNote; q('.sib-title').textContent = ''; q('.sibs').innerHTML = ''; q('.src').innerHTML = '';
  } else {
    const d = LINE[i], { note, sources } = noteFor(i);
    q('.gen').textContent = L.gen(i);
    q('.name').textContent = d.name;
    q('.formal').textContent = d.formal || '';
    q('.note').textContent = note;
    q('.sib-title').textContent = d.sibs.length > 1 ? (i === 0 ? L.sibs0 : L.sibs) : '';
    const self = d.self || d.name;
    q('.sibs').innerHTML = d.sibs.length > 1 ? d.sibs.map((s) => `<span class="${s === self ? 'self' : ''}">${s}</span>`).join('') : '';
    q('.src').innerHTML = sources.length ? `${L.src}: ` + sources.slice(0, 3).map((u, k) => {
      let host = ''; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
      return `<a href="${encodeURI(u)}" target="_blank" rel="noopener">${host}</a>`;
    }).filter(Boolean).join(', ') : '';
  }
  q('.prev').disabled = i === 0;
  q('.next').disabled = i === ME;
}
function openCard(i) { cardIndex = i; fillCard(i); card.classList.add('show'); }
function closeCard() { cardIndex = null; card.classList.remove('show'); }
card.querySelector('.close').addEventListener('click', () => unfocus());
card.querySelector('.prev').addEventListener('click', () => focusOn(Math.max(0, (cardIndex ?? ME) - 1), true));
card.querySelector('.next').addEventListener('click', () => focusOn(Math.min(ME, (cardIndex ?? 0) + 1), true));

/* ------------------------------------------------------- free flight */

const phase = 'free';
const smooth = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
const fly = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, vel: new THREE.Vector3(), auto: null };
const dirOf = (yaw, pitch, out = new THREE.Vector3()) => out.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
function lookFrom(pos, tgt) {
  const d = tgt.clone().sub(pos).normalize();
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) };
}
function startPose() {
  const pos = innerWidth < innerHeight ? new THREE.Vector3(5, 6.5, 17) : new THREE.Vector3(13, 5.2, 11);
  const tgt = innerWidth < innerHeight ? new THREE.Vector3(-8, 2.4, -34) : new THREE.Vector3(-9, 2.2, -32);
  return { pos, tgt };
}
function focusPose(k, out, tgt) {
  if (k >= ME) {                               // the viewer's own place: look back along the line
    const { p, t, n } = frameAt(ME);
    out.copy(p).addScaledVector(t, 2.6).addScaledVector(n, 0.9).setY(1.7);
    const back = curve.getPointAt(0.62);
    tgt.set(back.x, 2.2, back.z);
    return;
  }
  const { p, t, n } = frameAt(k);
  out.copy(p).addScaledVector(t, 6.4).addScaledVector(n, 2.3).setY(1.45);
  tgt.copy(p).setY(1.25).addScaledVector(n, 0.5);
}
{ const s = startPose(); fly.pos.copy(s.pos); Object.assign(fly, lookFrom(s.pos, s.tgt)); }

function flyTo(i) {
  const to = new THREE.Vector3(), tgt = new THREE.Vector3();
  focusPose(i, to, tgt);
  const look = lookFrom(to, tgt);
  let dy = look.yaw - fly.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  const dist = fly.pos.distanceTo(to);
  fly.auto = { t: 0, dur: THREE.MathUtils.clamp(0.7 + dist / 40, 0.8, 2.2), from: fly.pos.clone(), to, yaw0: fly.yaw, yaw1: fly.yaw + dy, p0: fly.pitch, p1: look.pitch };
  fly.vel.set(0, 0, 0);
}
let focusIdx = -1;
function focusOn(i, open = true) {
  focusIdx = i;
  flyTo(i);
  if (open) openCard(i);
  updateRail(i);
}
function updateRail(i) {
  document.querySelectorAll('#rail button').forEach((b, k) => {
    b.classList.toggle('on', k === i);
    if (k === i && innerWidth <= 760) b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
}
function unfocus() { focusIdx = -1; closeCard(); updateRail(-1); }

/* ------------------------------------------------------------- input */

const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('button')) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { unfocus(); return; }
  keys.add(e.code);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  fly.auto = null;
  wake();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

addEventListener('wheel', (e) => {
  if (e.target.closest && e.target.closest('#card, #rail')) return;
  e.preventDefault();
  fly.auto = null;
  dirOf(fly.yaw, fly.pitch, tmpD);
  fly.vel.addScaledVector(tmpD, -e.deltaY * 0.035);
  wake();
}, { passive: false });
const tmpD = new THREE.Vector3();

// look: drag anywhere on the canvas; move: keys, wheel, or the touch stick
const looks = new Map();
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  looks.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false });
  wake();
});
canvas.addEventListener('pointermove', (e) => {
  const l = looks.get(e.pointerId); if (!l) return;
  const dx = e.clientX - l.x, dy = e.clientY - l.y;
  l.x = e.clientX; l.y = e.clientY;
  if (Math.hypot(e.clientX - l.x0, e.clientY - l.y0) > 6) l.moved = true;
  if (!l.moved) return;
  if (looks.size >= 2) {                       // two fingers: move forward / back
    dirOf(fly.yaw, 0, tmpD); fly.vel.addScaledVector(tmpD, -dy * 0.08); return;
  }
  fly.auto = null;
  const s = isTouch ? 0.0055 : 0.0038;
  fly.yaw -= dx * s;
  fly.pitch = THREE.MathUtils.clamp(fly.pitch - dy * s, -1.35, 1.35);
});
const endLook = (e) => {
  const l = looks.get(e.pointerId);
  if (l && !l.moved && looks.size === 1) pick(e);
  looks.delete(e.pointerId);
};
canvas.addEventListener('pointerup', endLook);
canvas.addEventListener('pointercancel', (e) => looks.delete(e.pointerId));

const ray = new THREE.Raycaster();
function pick(e) {
  const v = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(v, camera);
  const hit = ray.intersectObjects(hitProxies)[0];
  if (hit) focusOn(hit.object.userData.index, true); else if (cardIndex !== null) unfocus();
}

// touch stick
const stick = document.getElementById('stick');
const stickV = { x: 0, y: 0 };
if (isTouch) {
  stick.hidden = false;
  const knob = stick.querySelector('i');
  let sid = null;
  const set = (e) => {
    const r = stick.getBoundingClientRect(), R = r.width / 2;
    let x = e.clientX - (r.left + R), y = e.clientY - (r.top + R);
    const m = Math.hypot(x, y); if (m > R) { x *= R / m; y *= R / m; }
    stickV.x = x / R; stickV.y = y / R;
    knob.style.transform = `translate(${x}px, ${y}px)`;
  };
  stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; stick.setPointerCapture(sid); set(e); fly.auto = null; wake(); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === sid) set(e); });
  const up = () => { sid = null; stickV.x = stickV.y = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerup', up); stick.addEventListener('pointercancel', up);
}

// sound wakes up on the first gesture (browsers require it)
let woke = false;
function wake() {
  if (woke) return; woke = true;
  audio.init().then(() => { audio.loop('wind', 0.5, 3); audio.loop('drone', 0.3, 5); });
}

function updateFlight(dt) {
  if (fly.auto) {
    const a = fly.auto; a.t += dt / a.dur;
    const k = smooth(a.t);
    fly.pos.lerpVectors(a.from, a.to, k);
    fly.pos.y += Math.sin(Math.PI * k) * Math.min(6, a.from.distanceTo(a.to) * 0.08);
    fly.yaw = THREE.MathUtils.lerp(a.yaw0, a.yaw1, k);
    fly.pitch = THREE.MathUtils.lerp(a.p0, a.p1, k);
    if (a.t >= 1) fly.auto = null;
  } else {
    const fwd = dirOf(fly.yaw, fly.pitch, new THREE.Vector3());
    const right = new THREE.Vector3(Math.cos(fly.yaw), 0, -Math.sin(fly.yaw));
    const acc = new THREE.Vector3();
    const kz = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - stickV.y;
    const kx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + stickV.x;
    const ky = (keys.has('KeyE') || keys.has('Space') ? 1 : 0) - (keys.has('KeyQ') || keys.has('KeyC') ? 1 : 0);
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 46 : 16;
    acc.addScaledVector(fwd, kz).addScaledVector(right, kx).addScaledVector(UP, ky);
    fly.vel.addScaledVector(acc, speed * dt * 4);
    fly.vel.multiplyScalar(Math.exp(-dt * 4));
    fly.pos.addScaledVector(fly.vel, dt);
  }
  fly.pos.y = THREE.MathUtils.clamp(fly.pos.y, 0.5, 160);
  const r = Math.hypot(fly.pos.x, fly.pos.z + 50);
  if (r > 420) { fly.pos.x *= 420 / r; fly.pos.z = (fly.pos.z + 50) * 420 / r - 50; }
  camera.position.copy(fly.pos);
  camera.lookAt(tmp.copy(fly.pos).add(dirOf(fly.yaw, fly.pitch, tmpD)));
  if (focusIdx >= 0 && !fly.auto) {
    const fp = focusIdx === ME ? frameAt(ME).p : figures[focusIdx]?.pos;
    if (fp && fly.pos.distanceTo(fp) > 22) unfocus();
  }
}

/* quick wave of light on load: nearest ancestor first, back to Dulat, ~1.2 s */
function igniteAll() {
  const t0 = clock.elapsedTime + 0.15;
  figures.forEach((f) => { f.ignitedAt = t0 + (N - 1 - f.i) * 0.085; });
  pathU.uReveal.value = 1;
}

/* ------------------------------------------------------------- frame */

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = clock.elapsedTime;
  U.time.value = now;
  updateFlight(dt);

  // figures
  figures.forEach((f) => {
    const since = f.ignitedAt < 0 ? -1 : now - f.ignitedAt;
    const reveal = since < 0 ? 0 : smooth(since / 1.8) * 1.3;
    f.uni.uReveal.value = reveal;
    const flash = since < 0 ? 0 : Math.exp(-since * 1.6);
    const glow = since < 0 ? 0 : Math.min(1, since * 1.5);
    const near = f.i === focusIdx ? 1 : 0;
    f.lit += ((glow * (0.55 + 0.45 * near)) - f.lit) * (1 - Math.exp(-dt * 3));
    f.pillar.material.uniforms.uI.value = flash * 0.9 + glow * 0.07 + near * 0.08;
    f.ring.material.uniforms.uI.value = glow * (0.55 + near * 0.6) + flash * 0.8;
    f.ring.material.uniforms.uR.value = 0.62 + (since < 0 ? 0 : Math.min(1, since * 0.8) * 0.2);
    if (f.haze) f.haze.material.opacity = Math.min(1, reveal) * 0.75;
    figU.value[f.i].set(f.pos.x, f.pos.z, f.lit * 0.7 + flash * 0.8, LINE[f.i].grand ? 1 : 0);
  });
  const meOn = 1;
  meRing.material.uniforms.uI.value = meOn * (0.7 + 0.2 * Math.sin(now * 1.4));
  { const { p } = frameAt(ME); figU.value[N].set(p.x, p.z, meOn * 0.5, 0); }

  // motes
  for (let m = 0; m < motes.n; m++) {
    const fi = motes.seed[m * 2] | 0, f = figures[fi];
    const life = (motes.seed[m * 2 + 1] + now * 0.06 * (0.6 + (m % 5) * 0.12)) % 1;
    const a = m * 2.399 + now * 0.1;
    const r = 0.45 + (m % 7) * 0.12;
    const px = f ? f.pos.x : 0, pz = f ? f.pos.z : 0;
    motes.pos[m * 3] = px + Math.cos(a) * r; motes.pos[m * 3 + 1] = life * 4.2; motes.pos[m * 3 + 2] = pz + Math.sin(a) * r;
    motes.alpha[m] = f ? f.lit * Math.sin(life * Math.PI) * 0.9 : 0;
  }
  motes.g.attributes.position.needsUpdate = true; motes.g.attributes.aA.needsUpdate = true;

  // labels
  const w = innerWidth, h = innerHeight;
  // project, then place labels nearest-first and fade the ones that would overlap
  const items = labels.map((l, i) => {
    const target = i === ME ? meOn : (figures[i] && figures[i].ignitedAt >= 0 && now - figures[i].ignitedAt > 0.6 ? 1 : 0);
    l.a += (target - l.a) * (1 - Math.exp(-dt * 2.5));
    const head = i === ME ? tmp.copy(frameAt(ME).p).setY(0.35) : tmp.copy(figures[i]?.head || UP);
    const d = camera.position.distanceTo(head);
    head.project(camera);
    const vis = head.z < 1 && Math.abs(head.x) < 1.1 && Math.abs(head.y) < 1.1;
    return { l, i, d, vis, x: (head.x * 0.5 + 0.5) * w, y: (-head.y * 0.5 + 0.5) * h };
  });
  const placed = [];
  items.sort((a, b) => (a.i === focusIdx ? -1 : b.i === focusIdx ? 1 : a.d - b.d)).forEach((it) => {
    const sc = THREE.MathUtils.clamp(16 / it.d, 0.78, 1.15);
    const bw = (it.i === ME ? 40 : (LINE[it.i].label || LINE[it.i].short || LINE[it.i].name).length * 9 + 16) * sc, bh = 40 * sc;
    const box = { x0: it.x - bw / 2, x1: it.x + bw / 2, y0: it.y - bh, y1: it.y };
    const clash = it.vis && placed.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0);
    if (it.vis && !clash && it.l.a > 0.05) placed.push(box);
    it.l.vis = (it.l.vis ?? 0) + (((it.vis && !clash) ? 1 : 0) - (it.l.vis ?? 0)) * (1 - Math.exp(-dt * 6));
    it.sc = sc;
  });
  items.forEach(({ l, i, d, vis, x, y, sc }) => {
    const fade = THREE.MathUtils.clamp(1.25 - d / 95, 0.2, 1) * (d < 2.2 ? 0 : 1);
    const a = vis ? l.a * fade * l.vis : 0;
    l.el.style.opacity = a.toFixed(3);
    l.el.style.pointerEvents = a > 0.25 && phase === 'free' ? 'auto' : 'none';
    if (vis) l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%,-100%) scale(${sc.toFixed(3)})`;
    l.el.classList.toggle('focus', i === focusIdx);
  });

  composer.render();
  requestAnimationFrame(frame);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < innerHeight ? 58 : 42;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

applyLang();
loadAll();
frame();

// debug hooks for automated checks
window.__shz = { focusOn, figures, fly };
