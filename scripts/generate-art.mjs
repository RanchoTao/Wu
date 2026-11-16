import { writeFile, readFile } from 'node:fs/promises';
import { logistic, growthVertex, projectVertex, nodes, edges, edgePath } from '../assets/model.js';
const head=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
const path=points=>points.map((p,i)=>`${i?'L':'M'}${p.map(v=>v.toFixed(2)).join(',')}`).join(' ');
let growth=head(900,760)+'<g fill="none">';
for(let i=0;i<37;i++)growth+=`<path d="${path(Array.from({length:85},(_,j)=>projectVertex(growthVertex(j/84*10,i/36),900,760)))}" stroke="#bad7ae" stroke-opacity="${.3+i/37*.45}" stroke-width=".8"/>`;
for(let j=0;j<85;j+=3)growth+=`<path d="${path(Array.from({length:37},(_,i)=>projectVertex(growthVertex(j/84*10,i/36),900,760)))}" stroke="#b7d6bc" stroke-opacity=".2" stroke-width=".6"/>`;
growth+='</g></svg>';
await writeFile('assets/growth-study.svg',growth);
const network= head(900,510)+`<defs><marker id="a" markerWidth="12" markerHeight="12" refX="44" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L11 6L1 11" fill="none" stroke="#b7d6bc"/></marker><marker id="b" markerWidth="10" markerHeight="12" refX="42" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M7 1V11" stroke="#e4a38b"/></marker></defs>`+edges.map(e=>`<path d="${edgePath(e)}" fill="none" stroke="${e.weight>0?'#b7d6bc':'#e4a38b'}" ${e.weight<0?'stroke-dasharray="5 6"':''} marker-end="url(#${e.weight>0?'a':'b'})"/>`).join('')+nodes.map(n=>`<circle cx="${n.x}" cy="${n.y}" r="22" fill="#103d36" stroke="#b7d6bc"/><text x="${n.x}" y="${n.y+5}" fill="#f2f0e7" font-family="Georgia,serif" font-size="18" text-anchor="middle">${n.label}</text>`).join('')+'</svg>';
await writeFile('assets/network-study.svg',network);
let scholar=head(600,680)+'<rect width="600" height="680" fill="#dce3d5"/><g stroke="#103d36" fill="none">';
for(let i=0;i<29;i++){
 const r=.28+i*.055;
 const points=Array.from({length:101},(_,j)=>{const t=j/10;return [70+t*46,435-logistic(t,r)*3.6]});
 scholar+=`<path d="${path(points)}" stroke-width="${i%7===0?1.2:.6}" opacity="${.3+i/29*.4}"/>`;
}
for(let i=0;i<10;i++)scholar+=`<line x1="${70+i*51}" x2="${70+i*51}" y1="85" y2="480" stroke-width=".4" opacity=".18"/>`;
scholar+='<path d="M70 255H530M300 60V550" stroke-width=".7" stroke-dasharray="3 7" opacity=".4"/></g><circle cx="300" cy="255" r="6" fill="#a25037"/><circle cx="300" cy="255" r="15" stroke="#a25037" fill="none" stroke-width=".5"/><g stroke="#103d36" fill="#dce3d5" stroke-width=".7">';
for(let i=0;i<3;i++)for(let j=0;j<3;j++){
 const x=180+i*120,y=535+j*43;
 if(i<2)scholar+=`<path d="M${x} ${y}L${x+120} ${535+(2-j)*43}" opacity=".4"/>`;
 if(j<2)scholar+=`<path d="M${x} ${y}L${x} ${y+43}" opacity=".3"/>`;
 scholar+=`<circle cx="${x}" cy="${y}" r="4"/>`;
}
scholar+='</g><g fill="#49654f" font-family="monospace" font-size="8" letter-spacing="2"><text x="36" y="35">THE FORM OF A PROCESS</text><text x="36" y="657">R. WU / A STUDY IN RELATIONS</text><text x="498" y="35">02 / 08</text></g></svg>';
await writeFile('assets/scholar-study.svg',scholar);
await writeFile('assets/mark.svg',head(48,48)+'<rect width="48" height="48" rx="24" fill="#103d36"/><g fill="none" stroke="#b7d6bc"><circle cx="24" cy="24" r="19" stroke-width=".6"/><path d="M6 32C17 32 14 12 24 12S32 32 42 32M6 24C17 24 16 18 24 18S32 24 42 24"/></g><circle cx="24" cy="24" r="2" fill="#e4a38b"/></svg>');
const social=head(1200,630)+'<rect width="1200" height="630" fill="#103d36"/><text x="70" y="70" font-family="monospace" font-size="15" letter-spacing="3" fill="#b7d6bc">RONGLING WU / AN INDEPENDENT ACADEMIC TRIBUTE</text><g transform="translate(510 20) scale(.8)">'+growth.replace(/<svg[^>]*>|<\/svg>/g,'')+'</g><g fill="#f2f0e7" font-family="Georgia,serif"><text x="70" y="205" font-size="67">The Mathematics</text><text x="70" y="287" font-size="67">of Living Systems.</text><text x="70" y="390" font-size="58" font-family="SimSun,serif">生命系统的数学</text><text x="70" y="458" font-size="24">邬荣领 · Rongling Wu</text></g><path d="M70 535H1130" stroke="#b7d6bc" stroke-opacity=".3"/><text x="70" y="578" font-size="13" fill="#b7d6bc" font-family="monospace">GROWTH / TIME / RELATIONSHIPS</text></svg>';
await writeFile('assets/social.svg',social);
// Keep the no-JavaScript plot mathematically identical to the interactive version.
let html=await readFile('index.html','utf8');
['a','b','c'].forEach((id,i)=>{
 const d=path(Array.from({length:121},(_,j)=>[64+j/12*59.4,390-logistic(j/12,[.5,1.4,.9][i])*3.2]));
 html=html.replace(new RegExp(`(id="curve-${id}"[^>]*?d=")[^"]*`),`$1${d}`);
});
await writeFile('index.html',html);
console.log('Generated original mathematical SVG plates and accurate static plot.');
