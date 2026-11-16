/** All values in this module are synthetic and dimensionless. No empirical data. */
export const logistic = (t, r = .9, K = 100, t0 = 5) => K / (1 + Math.exp(-r * (t - t0)));
export const nodes = [
  { id:'G1', label:'G₁', kind:'基因节点', x:160, y:105 },
  { id:'G2', label:'G₂', kind:'基因节点', x:160, y:245 },
  { id:'G3', label:'G₃', kind:'基因节点', x:160, y:385 },
  { id:'C1', label:'C₁', kind:'细胞节点', x:450, y:85 },
  { id:'C2', label:'C₂', kind:'细胞节点', x:450, y:245 },
  { id:'C3', label:'C₃', kind:'细胞节点', x:450, y:405 },
  { id:'P1', label:'P₁', kind:'性状节点', x:740, y:105 },
  { id:'P2', label:'P₂', kind:'性状节点', x:740, y:245 },
  { id:'P3', label:'P₃', kind:'性状节点', x:740, y:385 }
];
export const edges = [
  { from:'G1', to:'C1', weight:.8 }, { from:'G2', to:'C2', weight:.7 },
  { from:'G3', to:'C3', weight:.9 }, { from:'G1', to:'C2', weight:-.3 },
  { from:'G3', to:'C1', weight:-.2 }, { from:'C1', to:'C2', weight:-.4 },
  { from:'C2', to:'C3', weight:.5 }, { from:'C3', to:'C1', weight:-.6 },
  { from:'C1', to:'P1', weight:.8 }, { from:'C2', to:'P2', weight:.6 },
  { from:'C3', to:'P3', weight:.7 }, { from:'C2', to:'P1', weight:-.2 }
];
export function edgePath(edge) {
  const a = nodes.find(n => n.id === edge.from), b = nodes.find(n => n.id === edge.to);
  if (a.x === b.x) {
    const bend = edge.from === 'C3' ? -115 : 90;
    return `M${a.x},${a.y} C${a.x+bend},${a.y} ${b.x+bend},${b.y} ${b.x},${b.y}`;
  }
  const d = (b.x-a.x)*.45;
  return `M${a.x},${a.y} C${a.x+d},${a.y} ${b.x-d},${b.y} ${b.x},${b.y}`;
}

/** A parameter sheet, not a model of real anatomy. */
export function growthVertex(t,u,rate=.9) {
  const r = .3 + u*1.1 + rate*.35;
  const x = (t-5)*.94;
  const y = (logistic(t,r,100,4.3+u*1.4)-50)*.078;
  const z = (u-.5)*5.8;
  const cy=Math.cos(-.5), sy=Math.sin(-.5), cp=Math.cos(.56), sp=Math.sin(.56);
  const xx=cy*x+sy*z, zz=-sy*x+cy*z;
  return [xx, cp*y-sp*zz, sp*y+cp*zz];
}
export function projectVertex(v,w,h) {
  const perspective = 17/(17+v[2]);
  const scale = Math.min(w/12.7,h/10.4);
  return [w*.52+v[0]*scale*perspective,h*.51-v[1]*scale*perspective];
}
