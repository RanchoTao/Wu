import { logistic, nodes, edges, edgePath, growthVertex, projectVertex } from './model.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused = false;
let rate = .9, observation = 5, view = 'trajectory';
const paused = () => manuallyPaused || media.matches;
root.classList.add('js');
if (!paused()) root.classList.add('animate');

// A small, event-driven instrument. There is no frame loop for this plot.
function updateGrowth() {
  const rates = [.5,1.4,rate];
  ['a','b','c'].forEach((name,i) => {
    const points = Array.from({length:121},(_,j)=> {
      const t=j/12;
      return `${j?'L':'M'}${(64+t*59.4).toFixed(2)},${(390-logistic(t,rates[i])*3.2).toFixed(2)}`;
    }).join(' ');
    $('#curve-'+name).setAttribute('d',points);
    const value = logistic(observation,rates[i]);
    const dot = $('#observation-dots').children[i];
    dot.setAttribute('cx',64+observation*59.4);
    dot.setAttribute('cy',390-value*3.2);
    $('#value-'+name).textContent=value.toFixed(1);
  });
  const x=64+observation*59.4;
  $('#observation-line').setAttribute('x1',x);
  $('#observation-line').setAttribute('x2',x);
  $('#intersection-label').hidden = Math.abs(observation-5)>.01 || view==='snapshot';
  $('#intersection-label').style.display=Math.abs(observation-5)>.01 || view==='snapshot'?'none':'';
  $('#curve-paths').style.opacity = view==='snapshot'?'0':'1';
  $('#growth-rate-value').textContent=rate.toFixed(2);
  $('#hero-rate-value').textContent=rate.toFixed(2);
  $('#observation-time-value').textContent=observation.toFixed(1);
  $('#growth-insight').textContent = Math.abs(observation-5)<.01
    ? '在 t = 5，三条曲线重合于 50；单凭这个点无法区分生长速率。'
    : `在 t = ${observation.toFixed(1)}，A = ${logistic(observation,.5).toFixed(1)}，B = ${logistic(observation,1.4).toFixed(1)}，C = ${logistic(observation,rate).toFixed(1)}。移开交汇点后，轨迹差异显现。`;
  $('#plot-desc').textContent=`合成 Logistic 模型：K=100，t₀=5。A 速率 0.5，B 速率 1.4，C 速率 ${rate.toFixed(2)}；当前 t=${observation.toFixed(1)}，视图为${view==='snapshot'?'单点':'完整轨迹'}。`;
}
function setRate(value) {
  rate=Number(value);
  $('#growth-rate').value=rate;
  $('#hero-rate').value=rate;
  updateGrowth();
  hero.request();
}
$('#growth-rate').addEventListener('input',e=>setRate(e.target.value));
$('#hero-rate').addEventListener('input',e=>setRate(e.target.value));
$('#observation-time').addEventListener('input',e=>{observation=Number(e.target.value);updateGrowth()});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  view=button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  updateGrowth();
}));
$('#reset-growth').addEventListener('click',()=>{
  observation=5;view='trajectory';$('#observation-time').value='5';
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  setRate(.9);
});
updateGrowth();

// The sheet is made only of sampled Logistic curves. Cap DPR and active FPS.
function createHero() {
  const canvas=$('#living-canvas');
  let ctx;
  try { ctx=canvas.getContext('2d',{alpha:true}); } catch { return {request(){},sync(){}}; }
  if(!ctx) return {request(){},sync(){}};
  canvas.hidden=false;$('.hero-fallback').hidden=true;
  let width=0,height=0,frame=0,last=0,visible=true,dirty=true;
  function resize(){
    const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;request();
  }
  function draw(now){
    ctx.clearRect(0,0,width,height);
    const rows=width<500?23:37,cols=width<500?57:85;
    const pts=[];
    for(let i=0;i<rows;i++){
      const u=i/(rows-1),row=[];
      for(let j=0;j<cols;j++) row.push(projectVertex(growthVertex(j/(cols-1)*10,u,rate),width,height));
      pts.push(row);
    }
    // Translucent strips reveal the parameter sheet without obscuring its curves.
    for(let i=0;i<rows-1;i++){
      ctx.beginPath();pts[i].forEach((p,j)=>j?ctx.lineTo(...p):ctx.moveTo(...p));
      [...pts[i+1]].reverse().forEach(p=>ctx.lineTo(...p));ctx.closePath();
      ctx.fillStyle=`rgba(${110+i*2},${158+i},${123+i},${.07+i/rows*.06})`;ctx.fill();
    }
    for(let j=0;j<cols;j+=2){
      ctx.beginPath();for(let i=0;i<rows;i++){const p=pts[i][j];i?ctx.lineTo(...p):ctx.moveTo(...p)}
      ctx.strokeStyle='rgba(183,214,188,.19)';ctx.lineWidth=.55;ctx.stroke();
    }
    for(let i=0;i<rows;i++){
      ctx.beginPath();pts[i].forEach((p,j)=>j?ctx.lineTo(...p):ctx.moveTo(...p));
      ctx.strokeStyle=`rgba(192,224,179,${.29+i/rows*.49})`;ctx.lineWidth=i%6===0?1.05:.6;ctx.stroke();
    }
    // An actual time slice, shared by all trajectories, travels across the sheet.
    const t=paused()?5:5+3.8*Math.sin(now*.00017);
    ctx.beginPath();
    for(let i=0;i<rows;i++){
      const p=projectVertex(growthVertex(t,i/(rows-1),rate),width,height);
      i?ctx.lineTo(...p):ctx.moveTo(...p);
    }
    ctx.strokeStyle='#e4a38b';ctx.lineWidth=1.1;ctx.stroke();
    for(let i=0;i<rows;i+=6){
      const p=projectVertex(growthVertex(t,i/(rows-1),rate),width,height);
      ctx.beginPath();ctx.arc(...p,2,0,Math.PI*2);ctx.fillStyle='#f3d6b9';ctx.fill();
    }
    // A faint coordinate floor and registered corner marks give the plate scale.
    const lower=height*.86;
    ctx.strokeStyle='rgba(185,215,187,.13)';ctx.lineWidth=.6;
    for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(width*.13+i*width*.09,lower);ctx.lineTo(width*.28+i*width*.08,lower-height*.12);ctx.stroke()}
    [0,1,2,3].forEach(i=>{ctx.beginPath();ctx.moveTo(width*(.13+i*.05),lower-i*height*.04);ctx.lineTo(width*(.67+i*.03),lower-i*height*.04);ctx.stroke()});
    dirty=false;
  }
  function tick(now){
    frame=0;
    if(!visible||document.hidden)return;
    if(dirty||now-last>=33){draw(now);last=now}
    if(!paused())frame=requestAnimationFrame(tick);
  }
  function request(){dirty=true;if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick)}
  function sync(){cancelAnimationFrame(frame);frame=0;request()}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;if(visible)request();else{cancelAnimationFrame(frame);frame=0}},{threshold:0}).observe(canvas);
  document.addEventListener('visibilitychange',sync);
  resize();
  return {request,sync};
}
const hero=createHero();

// Directed, signed and weighted relationships, with a full keyboard equivalent.
const NS='http://www.w3.org/2000/svg';
let networkRevealed=false;
function svgElement(name,attributes,parent){const el=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,value);parent.append(el);return el}
const edgeElements=edges.map(edge=>svgElement('path',{d:edgePath(edge),class:`net-edge${edge.weight<0?' negative':''}`,'marker-end':`url(#${edge.weight<0?'negative-bar':'positive-arrow'})`},$('#network-edges')));
const nodeElements=nodes.map(node=>{
  const group=svgElement('g',{class:'net-node',role:'button',tabindex:0,'aria-label':`探索 ${node.label} ${node.kind}`,'aria-pressed':'false',transform:`translate(${node.x} ${node.y})`},$('#network-nodes'));
  svgElement('circle',{r:56,class:'hit-area'},group);
  svgElement('circle',{r:31,class:'node-ring'},group);
  svgElement('circle',{r:22,class:'node-circle'},group);
  svgElement('text',{x:0,y:0},group).textContent=node.label;
  group.addEventListener('click',()=>selectNode(node.id));
  group.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();selectNode(node.id)}
    if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){
      e.preventDefault();const delta=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;
      nodeElements[(nodes.indexOf(node)+delta+nodes.length)%nodes.length].focus();
    }
  });
  return group;
});
function selectNode(id,reveal=true){
  const node=nodes.find(n=>n.id===id);if(!node)return;
  if(reveal){networkRevealed=true;drawMorph()}
  $('#node-select').value=id;
  nodeElements.forEach((el,i)=>el.setAttribute('aria-pressed',String(nodes[i].id===id)));
  edges.forEach((edge,i)=>{const connected=edge.from===id||edge.to===id;edgeElements[i].classList.toggle('connected',connected);edgeElements[i].classList.toggle('dimmed',!connected)});
  const connected=edges.filter(edge=>edge.from===id||edge.to===id);
  const panel=$('#node-details');panel.replaceChildren();
  const title=document.createElement('h3');title.append(node.label+' ');
  const kind=document.createElement('span');kind.textContent=node.kind;title.append(kind);panel.append(title);
  const text=document.createElement('p');text.textContent=`${connected.filter(e=>e.to===id).length} 条输入，${connected.filter(e=>e.from===id).length} 条输出。正负符号表示示意模型中的促进或抑制，关系可以跨越不同层次。`;panel.append(text);
  const list=document.createElement('ul');list.className='edge-list';
  connected.forEach(edge=>{
    const li=document.createElement('li');
    const a=nodes.find(n=>n.id===edge.from),b=nodes.find(n=>n.id===edge.to);
    li.append(`${a.label} → ${b.label}`);
    const weight=document.createElement('b');weight.textContent=(edge.weight>0?'+':'−')+Math.abs(edge.weight).toFixed(1);
    if(edge.weight<0)weight.className='negative-weight';li.append(weight);list.append(li);
  });panel.append(list);
}
$('#node-select').addEventListener('change',e=>selectNode(e.target.value));
selectNode('C2',false);

// This interpolates drawings, never estimates a network from data.
const morphCanvas=$('#network-morph');
let morphContext;try{morphContext=morphCanvas.getContext('2d')}catch{}
let scrollFrame=0;
function drawMorph(){
  const section=$('.network-scroll'),rect=section.getBoundingClientRect();
  const distance=Math.max(1,section.offsetHeight-$('.network-sticky').offsetHeight);
  const progress=paused()||networkRevealed?1:Math.max(0,Math.min(1,(115-rect.top)/Math.min(distance,500)));
  const p=progress*progress*(3-2*progress);
  $('#morph-label').textContent=p<.15?'01 — 独立轨迹':p<.85?'02 — 关系逐渐浮现':'03 — 多层相互作用';
  // Keep nodes usable in every stage: selecting one completes the visible network.
  $('#network-edges').style.opacity=String(.16+.84*p);
  $('#network-nodes').style.opacity=String(.5+.5*p);
  if(!morphContext)return;
  const width=morphCanvas.clientWidth,height=morphCanvas.clientHeight;
  const dpr=Math.min(devicePixelRatio||1,2);
  if(morphCanvas.width!==Math.round(width*dpr)||morphCanvas.height!==Math.round(height*dpr)){
    morphCanvas.width=Math.round(width*dpr);morphCanvas.height=Math.round(height*dpr);morphContext.setTransform(dpr,0,0,dpr,0,0);
  }
  morphContext.clearRect(0,0,width,height);
  if(p>=.999)return;
  const project=([x,y])=>[x/900*width,y/510*height];
  for(let i=0;i<21;i++){
    morphContext.beginPath();
    for(let j=0;j<=100;j++){
      const t=j/10,u=i/20;
      const start=[100+t*70,425-logistic(t,.4+u*1.1)*3.5];
      const target=[nodes[i%9].x+(j/100-.5)*35,nodes[i%9].y];
      const point=project([start[0]*(1-p)+target[0]*p,start[1]*(1-p)+target[1]*p]);
      j?morphContext.lineTo(...point):morphContext.moveTo(...point);
    }
    morphContext.strokeStyle=`rgba(183,214,188,${.36*(1-p)})`;morphContext.lineWidth=.8;morphContext.stroke();
  }
  nodes.forEach((node,i)=>{
    const t=(i%3)*3+2,start=[100+t*70,425-logistic(t,.4+i/9*1.1)*3.5];
    const point=project([start[0]*(1-p)+node.x*p,start[1]*(1-p)+node.y*p]);
    morphContext.beginPath();morphContext.arc(...point,2.5,0,Math.PI*2);morphContext.fillStyle='#e4a38b';morphContext.fill();
  });
}
if(morphContext)morphCanvas.hidden=false;
let networkVisible=false;
new IntersectionObserver(entries=>{networkVisible=entries[entries.length-1].isIntersecting;if(networkVisible)drawMorph()},{rootMargin:'100px'}).observe($('.network-scroll'));
function onScroll(){
  if(scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;
    const max=root.scrollHeight-innerHeight;
    $('.reading-progress').style.transform=`scaleX(${max>0?scrollY/max:0})`;
    if(networkVisible)drawMorph();
  });
}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{onScroll();if(networkVisible)drawMorph()},{passive:true});
drawMorph();onScroll();

// Filters are a real local interaction; the full bibliography exists without JS.
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let count=0;document.querySelectorAll('.work').forEach(work=>{work.hidden=filter!=='all'&&work.dataset.kind!==filter;if(!work.hidden)count++});
  $('#works-count').textContent=`显示 ${count} 篇${filter==='preprint'?'预印本':filter==='published'?'已发表成果':'精选成果'}`;
}));

function syncMotion(){
  const stop=paused();root.classList.toggle('motion-paused',stop);root.classList.toggle('animate',!stop);
  $('.motion-control').setAttribute('aria-pressed',String(stop));
  $('.motion-label').textContent=stop?'恢复动效':'暂停动效';
  $('.motion-icon').textContent=stop?'▷':'Ⅱ';
  $('.motion-control').setAttribute('aria-label',media.matches?'系统已启用降低动态效果':stop?'恢复自动扫描与入场动画':'暂停自动扫描与入场动画');
  $('.motion-control').title=media.matches?'跟随系统的降低动态效果设置':stop?'恢复自动扫描与入场动画':'暂停自动扫描与入场动画';
  // The system preference is always respected; the button explains its state.
  $('.motion-control').disabled=media.matches;
  hero.sync();drawMorph();
}
$('.motion-control').addEventListener('click',()=>{manuallyPaused=!manuallyPaused;syncMotion()});
media.addEventListener('change',syncMotion);syncMotion();
const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){if(!paused())entry.target.classList.add('reveal-in');revealObserver.unobserve(entry.target)}});
},{threshold:.12});
document.querySelectorAll('.section-title-row,.science-note,.journey-heading,.scholar-copy').forEach(el=>revealObserver.observe(el));
const activeObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}});
},{rootMargin:'-15% 0px -60% 0px'});
document.querySelectorAll('main>section[id]').forEach(el=>activeObserver.observe(el));
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>$('.mobile-menu').open=false));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('.mobile-menu').open=false});
document.addEventListener('click',e=>{if(!$('.mobile-menu').contains(e.target))$('.mobile-menu').open=false});
