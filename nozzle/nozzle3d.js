// nozzle3d.js — 大川原 TJ-500 四流體噴頭（Twin Jet）程序化 3D 模型
// 依 Assembly drawing of TJ-500（3-72002）與 Nozzle exploded view 建模，單位 mm，y=0 為噴縫中心線。
// 外形比例照圖面；內部流道為依組立圖、O-ring 尺寸與四流體專利原理推估的示意。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2, HP = Math.PI / 2;
export const SEC_START = HP, SEC_LEN = TAU - HP;   // 剖面：切掉 x>0,z>0 的四分之一

// ── 零件清單（BOM，照圖面） ─────────────────────────────
export const META = [
  { id:'c14', no:'1-4', en:'CASING', zh:'外套管', mat:'SUS304TP 150A Sch10S', q:1, wt:'', grp:'1 外殼組',
    d:'最外面的 150A 大管。管內空間就是「上氣」（外側霧化空氣）的通道，同時把四支液管和中心氣管包在裡面。' },
  { id:'c12', no:'1-2', en:'AIR PIPE', zh:'中心空氣管', mat:'SUS304TP 32A Sch10S', q:1, wt:'', grp:'1 外殼組',
    d:'「下氣」（內側霧化空氣）的入口。下端接在中空的中心軸上，空氣沿軸心一路往下送到最底部的氣室。' },
  { id:'c13', no:'1-3', en:'LIQUID PIPE', zh:'液管', mat:'SUS304TP 10A Sch40', q:4, wt:'', grp:'1 外殼組',
    d:'PCD 103 均布四支（0°/90°/180°/270°）。推估兩支供「上液」、兩支供「下液」：兩路可以是同一種漿料，也可以分開控制流量。' },
  { id:'c11', no:'1-1', en:'CASE FITTING', zh:'外殼接座', mat:'SUS304', q:1, wt:'18.3', grp:'1 外殼組',
    d:'把外套管、中心氣管、液管焊成一體的厚座。底面鎖住上導氣環；外圈有環狀氣道把外套管裡的空氣往下導，液管在這裡轉成鑽孔通道。' },
  { id:'p2', no:'2', en:'CENTER SHAFT', zh:'中心軸', mat:'SUS304', q:1, wt:'', grp:'2–10 噴頭本體',
    d:'中空芯軸，貫穿上導氣環到下導氣環整疊零件。底部凸緣＋頂部定位螺帽把整疊夾緊；軸心孔就是下氣通道。' },
  { id:'p3', no:'3', en:'SET NUT', zh:'定位螺帽', mat:'SUS304', q:1, wt:'', grp:'2–10 噴頭本體',
    d:'鎖在中心軸上、壓住上導氣環，決定整疊刀緣的夾緊力。太鬆會漏、太緊會讓縫隙變形——縫寬就是霧化品質。' },
  { id:'p4', no:'4', en:'UPPER AIR GUIDE', zh:'上導氣環', mat:'SUS304', q:1, wt:'9.3', grp:'2–10 噴頭本體',
    d:'下緣與上刀緣之間形成「上氣縫」，把外側空氣擠成一層薄而高速的氣流，貼著液膜吹向刀尖。' },
  { id:'p5', no:'5', en:'UPPER EDGE', zh:'上刀緣', mat:'SUS304', q:1, wt:'4.7', grp:'2–10 噴頭本體',
    d:'上面走氣、下面走液：上表面導上氣，下表面和中刀緣夾出「上液縫」，液體從這裡被擠到中刀緣表面。' },
  { id:'p6', no:'6', en:'CENTER EDGE', zh:'中刀緣（入口刀緣）', mat:'SUS304', q:1, wt:'3.2', grp:'2–10 噴頭本體',
    d:'整顆噴頭的心臟。上下兩面是「液體流動面」，各有一圈分配槽讓液體 360° 攤開；尖端是銳利刀口，兩面的液膜在這裡會合、離開金屬。' },
  { id:'p7', no:'7', en:'LOWER EDGE', zh:'下刀緣', mat:'SUS304', q:1, wt:'4.1', grp:'2–10 噴頭本體',
    d:'上刀緣的鏡像：上表面和中刀緣夾出「下液縫」，下表面導下氣。' },
  { id:'p8', no:'8', en:'LOWER AIR GUIDE', zh:'下導氣環', mat:'SUS304', q:1, wt:'4.6', grp:'2–10 噴頭本體',
    d:'碗形零件。外錐面和氣帽內錐面之間就是下氣通道，把底部氣室上來的空氣導向下氣縫。' },
  { id:'p9', no:'9', en:'AIR CAP', zh:'氣帽', mat:'SUS304', q:1, wt:'2.8', grp:'2–10 噴頭本體',
    d:'噴頭下段的外錐殼。內錐面與下導氣環構成下氣通道，上緣和下刀緣形成下氣縫出口。' },
  { id:'p10', no:'10', en:'CAP', zh:'底蓋', mat:'SUS304', q:1, wt:'1.5', grp:'2–10 噴頭本體',
    d:'封住氣帽底部，圍出中心軸出口下方的緩衝氣室，讓下氣均壓後再往上走。' },
  { id:'p101', no:'101', en:'LOCK NUT M48', zh:'止鬆螺帽 M48', mat:'SUS', q:1, wt:'', grp:'101–112 標準件',
    d:'壓在定位螺帽上方做雙螺帽止鬆，避免振動讓整疊鬆開。' },
  { id:'p102', no:'102', en:'LOCK NUT M8', zh:'止鬆螺帽 M8', mat:'SUS', q:15, wt:'', grp:'101–112 標準件',
    d:'各處 M8 螺栓的止鬆螺帽（模型未逐顆繪出）。' },
  { id:'p103', no:'103', en:'GASKET t2', zh:'墊片', mat:'TEFLON', q:1, wt:'', grp:'101–112 標準件',
    d:'定位螺帽下方的鐵氟龍墊片，密封中心軸與上導氣環。' },
  { id:'p104', no:'104', en:'GASKET S175', zh:'墊片', mat:'SILICON', q:1, wt:'', grp:'101–112 標準件',
    d:'外殼接座與上導氣環之間的大墊片，隔開上氣和外界。' },
  { id:'p105', no:'105', en:'GASKET t3 φ131/φ123', zh:'墊片', mat:'TEFLON', q:1, wt:'', grp:'101–112 標準件',
    d:'氣帽與底蓋之間的鐵氟龍墊片。' },
  { id:'or135', no:'106', en:'O-RING G135', zh:'O 型環', mat:'SILICON', q:1, wt:'', grp:'101–112 標準件',
    d:'上導氣環／上刀緣接合面最外圈，擋住上氣往內竄。' },
  { id:'or110', no:'107', en:'O-RING G110', zh:'O 型環', mat:'SILICON', q:2, wt:'', grp:'101–112 標準件',
    d:'和 G90 一內一外夾住液體鑽孔通道（PCD 103 正好落在 G90 與 G110 之間），防止液體漏進氣道。' },
  { id:'or90', no:'108', en:'O-RING G90', zh:'O 型環', mat:'SILICON', q:3, wt:'', grp:'101–112 標準件',
    d:'三層刀緣接合面的內圈密封，各一條。拆裝時最容易被夾傷，要逐條檢查。' },
  { id:'p109', no:'109', en:'O-RING P6', zh:'O 型環', mat:'SILICON', q:6, wt:'', grp:'101–112 標準件',
    d:'下導氣環固定螺栓的密封圈。' },
  { id:'b110', no:'110', en:'HEX HOLE BOLT M8×25', zh:'內六角螺栓', mat:'SUS304', q:8, wt:'', grp:'101–112 標準件',
    d:'鎖外殼接座與上導氣環。' },
  { id:'b111', no:'111', en:'HEX HOLE BOLT M8×55', zh:'內六角螺栓', mat:'SUS304', q:6, wt:'', grp:'101–112 標準件',
    d:'鎖下導氣環，搭配 P6 O 型環。' },
  { id:'b112', no:'112', en:'HEX HOLE BOLT M8×16', zh:'內六角螺栓', mat:'SUS304', q:6, wt:'', grp:'101–112 標準件',
    d:'鎖底蓋與氣帽。' },
];
export const META_BY_ID = Object.fromEntries(META.map(m => [m.id, m]));

// ── 斷面輪廓 (r, y)，逆時針 ───────────────────────────
const P = {
  casing: [[79.2,118],[82.6,118],[82.6,300],[79.2,300]],
  airPipe: [[18.5,98],[21.35,98],[21.35,340],[18.5,340]],
  pipe: [[6.35,118],[8.65,118],[8.65,340],[6.35,340]],
  cfIn: [[40,70],[72,70],[72,118],[40,118]],
  cfOut: [[76,70],[108,70],[108,92],[90,118],[76,118]],
  shaft: [[14,-70],[36,-70],[36,-62],[24,-62],[24,98],[14,98]],
  g103: [[24,70],[40,70],[40,72],[24,72]],
  setNut: [[24,72],[40,72],[40,86],[24,86]],
  lockNut: [[24,86],[38,86],[38,98],[24,98]],
  g104: [[84,70],[92,70],[92,71.4],[84,71.4]],
  uagIn: [[24,13],[72,13],[72,70],[24,70]],
  uagOut: [[76,17.6],[110,4.2],[113,4.2],[111,40],[108,70],[76,70]],
  ue: [[24,9],[60,9],[100,2.9],[72,13],[24,13]],
  ce: [[24,-9],[48,-9],[48,-5],[60,-5],[116,0],[60,5],[48,5],[48,9],[24,9]],
  le: [[24,-13],[72,-13],[100,-2.9],[60,-9],[24,-9]],
  lag: [[24,-62],[52,-62],[76,-13],[24,-13],[24,-21],[62,-21],[45,-54],[24,-54]],
  airCap: [[62,-115],[84,-115],[113,-4.2],[110,-4.2],[86,-14.5],[60,-72]],
  g105: [[61.5,-118],[65.5,-118],[65.5,-115],[61.5,-115]],
  cap: [[0,-127],[72,-127],[72,-118],[0,-118]],
};

// 流體（剖面上的填色區）
const PIPE_HOLE = [[42.9,118.4],[60.1,118.4],[60.1,299.6],[42.9,299.6]];
const FILL = {
  gas1: [[[21.35,118],[72,118],[72,13],[100,2.9],[100,1.43],[116,0],[118.5,0],[110,4.2],[76,17.6],[76,118],[79.2,118],[79.2,300],[21.35,300]], [PIPE_HOLE]],
  gas1b: [[[21.35,98],[40,98],[40,118],[21.35,118]]],
  gas2: [[[0,-118],[61.5,-118],[62,-115],[60,-72],[86,-14.5],[110,-4.2],[118.5,0],[116,0],[100,-1.43],[100,-2.9],[76,-11.56],[76,-13],[52,-62],[36,-62],[36,-70],[14,-70],[14,98],[18.5,98],[18.5,340],[0,340]]],
  liq1: [[[48,5],[60,5],[100,1.43],[116,0.02],[114,0.5],[100,2.25],[100,2.9],[60,9],[48,9]]],
  liq2: [[[48,-5],[60,-5],[100,-1.43],[116,-0.02],[114,-0.5],[100,-2.25],[100,-2.9],[60,-9],[48,-9]]],
  bore1: [[[45.15,118],[57.85,118],[57.85,340],[45.15,340]], [[48.3,9],[54.7,9],[54.7,118],[48.3,118]]],
  bore2: [[[45.15,118],[57.85,118],[57.85,340],[45.15,340]], [[48.3,-5],[54.7,-5],[54.7,118],[48.3,118]]],
};
export const COLORS = { gas1:'#2f7fc4', gas2:'#1b9e9a', liq1:'#e0702a', liq2:'#c9970f', mist:'#4677a6' };

// 粒子流線 (r,y) 與寬度
const PATHS = {
  G1: { c:'gas1', v:150, pts:[[50,295],[73,140],[74,118],[74,24],[86,10.8],[100,5.1],[110,2.5],[119,0.3]], w:[44,8,3.4,3.4,5.4,4.6,2.8,0.6] },
  G2: { c:'gas2', v:150, pts:[[9,335],[9,98],[7,-66],[30,-100],[58,-64],[78,-20],[86,-11.2],[100,-5.1],[110,-2.5],[119,-0.3]], w:[16,12,12,30,11,10,6,4.6,2.8,0.6] },
  L1: { c:'liq1', v:42, pts:[[51.5,335],[51.5,118],[51.5,10],[54,7],[60,7],[80,4.5],[100,2.15],[108,1.0],[116,0.1],[119,0]], w:[11,5.5,5.5,3.5,3.6,2.6,1.4,0.6,0.3,0.2] },
  L1g:{ c:'liq1', v:42, pts:[[48.6,7],[60,7],[80,4.5],[100,2.15],[108,1.0],[116,0.1],[119,0]], w:[3.5,3.6,2.6,1.4,0.6,0.3,0.2] },
  L2: { c:'liq2', v:42, pts:[[51.5,335],[51.5,118],[51.5,-4],[54,-7],[60,-7],[80,-4.5],[100,-2.15],[108,-1.0],[116,-0.1],[119,0]], w:[11,5.5,5.5,3.5,3.6,2.6,1.4,0.6,0.3,0.2] },
  L2g:{ c:'liq2', v:42, pts:[[48.6,-7],[60,-7],[80,-4.5],[100,-2.15],[108,-1.0],[116,-0.1],[119,0]], w:[3.5,3.6,2.6,1.4,0.6,0.3,0.2] },
};
// 平面 A：phi=π/2（z=0, x>0）放 L2 液管；平面 B：phi=2π（x=0, z>0）放 L1 液管
const PLANE_FLOWS = { A:['G1','G2','L1g','L2'], B:['G1','G2','L1','L2g'] };
const PLANE_FILLS = { A:['gas1','gas1b','gas2','liq1','liq2','bore2'], B:['gas1','gas1b','gas2','liq1','liq2','bore1'] };

// 爆炸位移 (mm, y)
const EX = { asm:330, g104:300, lock:280, nut:250, g103:228, uag:170, orA:120, ue:80, orB:45, ce:0, orC:-40, le:-80, orD:-115, lag:-160, shaft:-330, airCap:-420, g105:-490, cap:-510 };

// 標籤錨點：sec=剖面上 (r,y)；full=外表面 (r,y)
export const ANCHORS = {
  c14:{sec:[81,230],full:[82.6,230]}, c12:{sec:[20,322],full:[21.35,335]}, c13:{sec:[51.5,262],full:[58,325]},
  c11:{sec:[96,96],full:[104,96]}, p2:{sec:[19,40],full:[24,40]}, p3:{sec:[32,79],full:[40,79]},
  p101:{sec:[31,92],full:[38,92]}, p4:{sec:[100,36],full:[111,36]}, p5:{sec:[80,8.6],full:[96,5]},
  p6:{sec:[36,0],full:[112,0]}, p7:{sec:[80,-8.6],full:[96,-5]}, p8:{sec:[60,-36],full:[66,-36]},
  p9:{sec:[86,-50],full:[101,-50]}, p10:{sec:[40,-122.5],full:[72,-122.5]},
  or90:{sec:[46.3,9],full:[47.9,9]}, or110:{sec:[56.25,13],full:[57.8,13]}, or135:{sec:[68.75,13],full:[70.3,13]},
  p103:{sec:[32,71],full:[40,71]}, p104:{sec:[88,70.7],full:[92,70.7]}, p105:{sec:[63.5,-116.5],full:[65.5,-116.5]},
  b110:{sec:[99,109],full:[99,112], ang:[22.5,112.5]}, b111:{sec:[38,-50],full:[38,-48], ang:[30,150]}, b112:{sec:[66,-130],full:[66,-133], ang:[30,150]},
  p109:{sec:[38,-63],full:[38,-63], ang:[30,150]},
};

function hatchTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#eceef0'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#7f8a95'; g.lineWidth = 3;
  for (let i = -64; i <= 128; i += 16) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 14, 1 / 14);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function revolve(poly, a0, len, seg) {
  const geos = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if (p[0] === 0 && q[0] === 0) continue;
    geos.push(new THREE.LatheGeometry([new THREE.Vector2(p[0], p[1]), new THREE.Vector2(q[0], q[1])], seg, a0, len));
  }
  return mergeGeometries(geos);
}
function capGeo(poly, phi, holes) {
  const s = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1])));
  if (holes) for (const h of holes) s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1]))));
  const g = new THREE.ShapeGeometry(s);
  g.rotateY(phi - HP);
  return g;
}
const inWedge = a => { a = ((a % TAU) + TAU) % TAU; return a >= -1e-6 && a <= HP + 1e-6; };
const polar = (r, y, phi) => new THREE.Vector3(r * Math.sin(phi), y, r * Math.cos(phi));

// 點粒子材質（大小隨距離縮放、圓形柔邊、逐點顏色/透明度）
export function pointsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 600 } },
    vertexShader: `attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
      varying float vA; varying vec3 vC; uniform float uScale;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = clamp(aSize * uScale / -mv.z, 1.5, 64.0);
        gl_Position = projectionMatrix * mv; vA = aAlpha; vC = aColor; }`,
    fragmentShader: `varying float vA; varying vec3 vC;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
        gl_FragColor = vec4(vC, smoothstep(0.5, 0.22, d) * vA); }`,
    transparent: true, depthWrite: false,
  });
}
export function makePoints(n, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return pts;
}

// ── 主程式 ───────────────────────────────────────────
export function createNozzle({ seg = 144 } = {}) {
  const root = new THREE.Group(); root.name = 'nozzle';
  const hatch = hatchTex();
  const base = {
    metal: new THREE.MeshStandardMaterial({ color: 0xd3d7db, metalness: 0.92, roughness: 0.24, side: THREE.DoubleSide }),
    metal2: new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 0.92, roughness: 0.3, side: THREE.DoubleSide }),
    edge: new THREE.MeshStandardMaterial({ color: 0xe1e4e7, metalness: 0.95, roughness: 0.18, side: THREE.DoubleSide }),
    cap: new THREE.MeshStandardMaterial({ map: hatch, metalness: 0.05, roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }),
    teflon: new THREE.MeshStandardMaterial({ color: 0xf4f3ee, metalness: 0, roughness: 0.55, side: THREE.DoubleSide }),
    silicone: new THREE.MeshStandardMaterial({ color: 0xc8402f, metalness: 0, roughness: 0.5, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: 0x24292e, metalness: 0.3, roughness: 0.6 }),
  };
  const parts = {};      // id -> { id, meta, mats:[], meshes:[], items:[] }
  const items = [];      // { group, ex, full, sec }
  const pickables = [];

  function part(id) {
    if (!parts[id]) parts[id] = { id, meta: META_BY_ID[id], mats: [], meshes: [], items: [] };
    return parts[id];
  }
  function mat(p, key) { const m = base[key].clone(); m.userData.key = key; p.mats.push(m); return m; }
  function item(id, ex) {
    const p = part(id);
    const it = { id, group: new THREE.Group(), ex, full: new THREE.Group(), sec: new THREE.Group() };
    it.group.add(it.full, it.sec); root.add(it.group); items.push(it); p.items.push(it);
    return it;
  }
  function addMesh(it, which, geo, m) {
    const mesh = new THREE.Mesh(geo, m); mesh.userData.partId = it.id;
    it[which].add(mesh); parts[it.id].meshes.push(mesh); pickables.push(mesh);
    return mesh;
  }
  // 軸對稱實體
  function rev(id, ex, poly, matKey, { cx = 0, cz = 0, keep = null, holesA = null, holesB = null } = {}) {
    const it = item(id, ex); const p = parts[id];
    const mShell = mat(p, matKey), mCap = mat(p, 'cap');
    const full = revolve(poly, 0, TAU, seg); full.translate(cx, 0, cz);
    addMesh(it, 'full', full, mShell);
    if (keep === 'hide') return it;
    const [a0, len] = keep || [SEC_START, SEC_LEN];
    const sh = revolve(poly, a0, len, Math.max(24, Math.round(seg * len / TAU)));
    sh.translate(cx, 0, cz); addMesh(it, 'sec', sh, mShell);
    if (len < TAU - 1e-6) {
      const c = mergeGeometries([capGeo(poly, a0, holesA), capGeo(poly, a0 + len, holesB)]);
      c.translate(cx, 0, cz); addMesh(it, 'sec', c, mCap);
    }
    return it;
  }
  function torus(id, ex, R, tube, y) {
    const it = item(id, ex); const m = mat(parts[id], 'silicone');
    const gF = new THREE.TorusGeometry(R, tube, 12, 160); gF.rotateX(-HP); gF.translate(0, y, 0);
    const gS = new THREE.TorusGeometry(R, tube, 12, 120, SEC_LEN); gS.rotateX(-HP); gS.translate(0, y, 0);
    addMesh(it, 'full', gF, m); addMesh(it, 'sec', gS, m);
    return it;
  }
  // 內六角螺栓頭／螺帽（沿圓周陣列）
  function bolts(id, ex, n, R, a0, y0, h, r, { down = false, shank = 0, ring = null } = {}) {
    const it = item(id, ex); const p = parts[id];
    const mM = mat(p, 'metal'), mD = mat(p, 'dark');
    const mR = ring ? mat(part(ring.id), 'silicone') : null;
    if (ring) parts[ring.id].items.push(it);   // P6 O 型環跟著螺栓一起爆炸/定位
    for (let i = 0; i < n; i++) {
      const a = a0 + i * TAU / n;
      const x = R * Math.sin(a), z = R * Math.cos(a);
      const g = new THREE.CylinderGeometry(r, r, h, 28); g.translate(x, y0 + h / 2, z);
      const s = new THREE.CylinderGeometry(r * 0.46, r * 0.46, 0.6, 6); s.translate(x, down ? y0 - 0.25 : y0 + h + 0.25, z);
      const geos = [g]; if (shank) { const k = new THREE.CylinderGeometry(4, 4, shank, 16); k.translate(x, y0 - shank / 2, z); geos.push(k); }
      const body = mergeGeometries(geos);
      for (const which of ['full', 'sec']) {
        if (which === 'sec' && inWedge(a)) continue;
        addMesh(it, which, body.clone(), mM); addMesh(it, which, s.clone(), mD);
        if (ring) {
          const t = new THREE.TorusGeometry(ring.R, ring.tube, 10, 32); t.rotateX(-HP); t.translate(x, ring.y, z);
          const m = new THREE.Mesh(t, mR); m.userData.partId = ring.id; it[which].add(m); parts[ring.id].meshes.push(m); pickables.push(m);
        }
      }
    }
    return it;
  }

  // 外殼組（焊接件）
  rev('c14', EX.asm, P.casing, 'metal2');
  rev('c12', EX.asm, P.airPipe, 'metal');
  for (const a of [0, HP, Math.PI, 3 * HP]) {
    const cx = 51.5 * Math.sin(a), cz = 51.5 * Math.cos(a);
    const keep = a === 0 ? [Math.PI, Math.PI] : a === HP ? [HP, Math.PI] : [0, TAU];
    rev('c13', EX.asm, P.pipe, 'metal', { cx, cz, keep });
  }
  rev('c11', EX.asm, P.cfIn, 'metal2');
  rev('c11', EX.asm, P.cfOut, 'metal2');
  bolts('b110', EX.asm, 8, 99, Math.PI / 8, 104.5, 8, 6.5);
  rev('p104', EX.g104, P.g104, 'silicone');
  rev('p101', EX.lock, P.lockNut, 'metal');
  rev('p3', EX.nut, P.setNut, 'metal');
  rev('p103', EX.g103, P.g103, 'teflon');
  rev('p4', EX.uag, P.uagIn, 'metal2');
  rev('p4', EX.uag, P.uagOut, 'metal2');
  torus('or135', EX.orA, 68.75, 1.55, 13);
  torus('or110', EX.orA, 56.25, 1.55, 13);
  torus('or90', EX.orA, 46.3, 1.55, 13);
  rev('p5', EX.ue, P.ue, 'edge');
  torus('or90', EX.orB, 46.3, 1.55, 9);
  rev('p6', EX.ce, P.ce, 'edge');
  torus('or90', EX.orC, 46.3, 1.55, -9);
  rev('p7', EX.le, P.le, 'edge');
  torus('or110', EX.orD, 56.25, 1.55, -13);
  rev('p8', EX.lag, P.lag, 'metal2');
  part('p109');
  bolts('b111', EX.lag, 6, 38, Math.PI / 6, -54, 6, 6.5, { shank: 22, ring: { id: 'p109', R: 4.8, tube: 0.95, y: -63 } });
  rev('p2', EX.shaft, P.shaft, 'metal');
  rev('p9', EX.airCap, P.airCap, 'metal');
  rev('p105', EX.g105, P.g105, 'teflon');
  rev('p10', EX.cap, P.cap, 'metal2');
  bolts('b112', EX.cap, 6, 66, Math.PI / 6, -133, 6, 6.5, { down: true });
  part('p102');

  // 流道填色（只在剖面＋未爆炸時顯示）
  const fillGroup = new THREE.Group(); root.add(fillGroup);
  const fillMats = {};
  for (const plane of ['A', 'B']) {
    const phi = plane === 'A' ? HP : TAU;
    for (const key of PLANE_FILLS[plane]) {
      const ck = key.startsWith('gas1') ? 'gas1' : key === 'bore1' ? 'liq1' : key === 'bore2' ? 'liq2' : key;
      const isLiq = ck.startsWith('liq');
      fillMats[ck] ||= new THREE.MeshBasicMaterial({ color: COLORS[ck], transparent: true, opacity: isLiq ? 0.88 : 0.30, side: THREE.DoubleSide, depthWrite: false });
      const shapes = FILL[key];
      // gas1 第二個元素是 holes；其餘是多個獨立多邊形
      const list = key === 'gas1' ? [[shapes[0], shapes[1]]] : shapes.map(s => [s, null]);
      for (const [poly, holes] of list) {
        const g = capGeo(poly, phi, holes);
        const off = isLiq ? 0.7 : 0.35;
        g.translate(plane === 'A' ? 0 : off, 0, plane === 'A' ? off : 0);
        const m = new THREE.Mesh(g, fillMats[ck]); m.renderOrder = isLiq ? 3 : 2; m.userData.fill = ck;
        fillGroup.add(m);
      }
    }
  }

  // 流動粒子
  const flowMat = pointsMaterial();
  const flowDefs = [];
  for (const plane of ['A', 'B']) for (const k of PLANE_FLOWS[plane]) {
    const d = PATHS[k]; const cum = [0];
    for (let i = 1; i < d.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(d.pts[i][0] - d.pts[i - 1][0], d.pts[i][1] - d.pts[i - 1][1]));
    const n = k.startsWith('G') ? 170 : (k.endsWith('g') ? 60 : 130);
    flowDefs.push({ k, plane, d, cum, L: cum[cum.length - 1], n, col: new THREE.Color(COLORS[d.c]), liq: k.startsWith('L') });
  }
  const NF = flowDefs.reduce((s, f) => s + f.n, 0);
  const flowPts = makePoints(NF, flowMat); flowPts.renderOrder = 5; root.add(flowPts);
  const fs = new Float32Array(NF), fu = new Float32Array(NF);
  for (let i = 0; i < NF; i++) { fs[i] = Math.random(); fu[i] = Math.random(); }

  // 噴霧（360° 圓盤狀霧滴）
  const NS = 3200;
  const sprayMat = pointsMaterial();
  const spray = makePoints(NS, sprayMat); spray.renderOrder = 6; root.add(spray);
  const sp = new Float32Array(NS * 3), sv = new Float32Array(NS * 3), sage = new Float32Array(NS), slife = new Float32Array(NS), ssz = new Float32Array(NS);
  const mistC = new THREE.Color(COLORS.mist);
  function respawn(i, age = 0) {
    const a = Math.random() * TAU, r = 119.5;
    sp[i * 3] = r * Math.sin(a); sp[i * 3 + 1] = (Math.random() - 0.5) * 1.2; sp[i * 3 + 2] = r * Math.cos(a);
    const v = 230 + Math.random() * 260, vy = (Math.random() - 0.5) * 46;
    sv[i * 3] = v * Math.sin(a); sv[i * 3 + 1] = vy; sv[i * 3 + 2] = v * Math.cos(a);
    sage[i] = age; slife[i] = 1.8 + Math.random() * 1.4; ssz[i] = 0.9 + Math.random() * 1.3;
  }
  for (let i = 0; i < NS; i++) { respawn(i); const pre = Math.random() * slife[i]; stepSpray(i, pre); }
  function stepSpray(i, dt) {
    sage[i] += dt;
    const k = Math.exp(-1.25 * dt);
    sv[i * 3] *= k; sv[i * 3 + 2] *= k; sv[i * 3 + 1] = sv[i * 3 + 1] * k - 34 * dt;
    sp[i * 3] += sv[i * 3] * dt; sp[i * 3 + 1] += sv[i * 3 + 1] * dt; sp[i * 3 + 2] += sv[i * 3 + 2] * dt;
  }

  const state = { flowSize: 1, section: false, explode: 0, flows: false, spray: false, focus: null, ghost: 0.13, sprayArc: TAU, sprayRate: 1 };

  function applyVis() {
    for (const it of items) { it.full.visible = !state.section; it.sec.visible = state.section; it.group.position.y = it.ex * state.explode; }
    const showFlow = state.section && state.explode < 0.01;
    fillGroup.visible = showFlow && state.flows;
    flowPts.visible = showFlow && state.flows;
    spray.visible = state.spray && state.explode < 0.01;
  }
  function applyFocus() {
    const f = state.focus;
    for (const p of Object.values(parts)) {
      const on = !f || f.includes(p.id);
      for (const m of p.mats) {
        const ghost = !on;
        m.transparent = ghost; m.opacity = ghost ? state.ghost : 1; m.depthWrite = !ghost;
        if (m.emissive) { m.emissive.set(f && on && f.length <= 3 ? 0xd9622b : 0x000000); m.emissiveIntensity = f && on ? 0.22 : 0; }
        m.needsUpdate = true;
      }
    }
  }
  applyVis(); applyFocus();

  const tmp = new THREE.Vector3();
  function planePos(plane, r, y, off, out) {
    return plane === 'A' ? out.set(r, y, off) : out.set(off, y, r);
  }
  function update(dt, filter) {
    dt = Math.min(dt, 0.05);
    if (flowPts.visible) {
      const pos = flowPts.geometry.attributes.position.array, col = flowPts.geometry.attributes.aColor.array;
      const al = flowPts.geometry.attributes.aAlpha.array, sz = flowPts.geometry.attributes.aSize.array;
      let idx = 0;
      for (const f of flowDefs) {
        const show = !filter || filter.includes(f.d.c);
        for (let j = 0; j < f.n; j++, idx++) {
          let s = fs[idx] * f.L;
          let seg = 1; while (seg < f.cum.length - 1 && f.cum[seg] < s) seg++;
          const t = (s - f.cum[seg - 1]) / Math.max(1e-6, f.cum[seg] - f.cum[seg - 1]);
          const a = f.d.pts[seg - 1], b = f.d.pts[seg];
          const w = f.d.w[seg - 1] + (f.d.w[seg] - f.d.w[seg - 1]) * t;
          const v = f.d.v * Math.min(4.5, Math.max(0.55, Math.pow(7 / Math.max(w, 0.8), 0.65)));
          fs[idx] += v * dt / f.L;
          if (fs[idx] >= 1) { fs[idx] -= 1; fu[idx] = Math.random(); }
          let dx = b[0] - a[0], dy = b[1] - a[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
          const o = (fu[idx] - 0.5) * w * 0.82;
          const r = a[0] + (b[0] - a[0]) * t - dy * o, y = a[1] + (b[1] - a[1]) * t + dx * o;
          planePos(f.plane, r, y, f.liq ? 1.1 : 0.9, tmp);
          pos[idx * 3] = tmp.x; pos[idx * 3 + 1] = tmp.y; pos[idx * 3 + 2] = tmp.z;
          col[idx * 3] = f.col.r; col[idx * 3 + 1] = f.col.g; col[idx * 3 + 2] = f.col.b;
          const u = fs[idx];
          al[idx] = show ? Math.min(1, u * 30) * Math.min(1, (1 - u) * 40) * (f.liq ? 0.95 : 0.8) : 0;
          sz[idx] = (f.liq ? Math.min(1.5, 0.3 + w * 0.16) : Math.min(1.9, 0.4 + w * 0.12)) * state.flowSize;
        }
      }
      for (const k of ['position', 'aColor', 'aAlpha', 'aSize']) flowPts.geometry.attributes[k].needsUpdate = true;
    }
    if (spray.visible) {
      const pos = spray.geometry.attributes.position.array, col = spray.geometry.attributes.aColor.array;
      const al = spray.geometry.attributes.aAlpha.array, sz = spray.geometry.attributes.aSize.array;
      for (let i = 0; i < NS; i++) {
        stepSpray(i, dt);
        if (sage[i] > slife[i]) respawn(i);
        const u = sage[i] / slife[i];
        let a = Math.min(1, u * 12) * Math.pow(1 - u, 1.3) * 0.85 * state.sprayRate;
        if (state.section) { const ang = Math.atan2(sp[i * 3], sp[i * 3 + 2]); if (inWedge(ang) && u < 0.02) a = 0; }
        pos[i * 3] = sp[i * 3]; pos[i * 3 + 1] = sp[i * 3 + 1]; pos[i * 3 + 2] = sp[i * 3 + 2];
        col[i * 3] = mistC.r; col[i * 3 + 1] = mistC.g; col[i * 3 + 2] = mistC.b;
        al[i] = a; sz[i] = ssz[i] * (0.9 + u * 3.2);
      }
      for (const k of ['position', 'aColor', 'aAlpha', 'aSize']) spray.geometry.attributes[k].needsUpdate = true;
    }
  }

  function anchor(id, out = new THREE.Vector3(), phiFull = null) {
    const a = ANCHORS[id]; if (!a) return null;
    const p = parts[id]; const it = p && p.items[0]; if (!it) return null;
    if (a.ang) { const [r, y] = state.section ? a.sec : a.full; out.copy(polar(r, y, a.ang[state.section ? 1 : 0] * Math.PI / 180)); }
    else if (state.section) { const [r, y] = a.sec; out.set(r, y, 0.8); }
    else { const [r, y] = a.full; out.copy(polar(r, y, phiFull ?? 0.62)); }
    out.y += it.ex * state.explode;
    return root.localToWorld(out);
  }

  return {
    root, parts, pickables, state, update, anchor, flowPts, spray, fillGroup,
    set(o) { Object.assign(state, o); applyVis(); if ('focus' in o || 'ghost' in o) applyFocus(); },
    setPointScale(s) { flowMat.uniforms.uScale.value = s; sprayMat.uniforms.uScale.value = s; },
    planePos, polar,
  };
}
