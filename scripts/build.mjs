import { cp, mkdir, readFile, writeFile, readdir, stat, rm } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const out=path.resolve(root,'dist');
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw Error('Output must be project/dist');
// Remove only this fixed build directory, never any source or sibling repository.
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of ['index.html','sources.html','assets','docs'])await cp(name,path.join(out,name),{recursive:true});
await writeFile(path.join(out,'.nojekyll'),'');
let html=await readFile(path.join(out,'index.html'),'utf8');
if(process.env.SITE_URL){
  const site=new URL(process.env.SITE_URL.replace(/\/$/,'')+'/');
  html=html.replace('content="assets/social.png"',`content="${new URL('assets/social.png',site).href}"`);
  html=html.replace('</head>',`  <meta property="og:url" content="${site.href}">\n  <link rel="canonical" href="${site.href}">\n</head>`);
  await writeFile(path.join(out,'index.html'),html);
}
if(/(?:src|href)="\/(?!\/)/.test(html))throw Error('Root-absolute asset URL is not project-path safe');
async function size(dir){let total=0;for(const file of await readdir(dir)){const p=path.join(dir,file),s=await stat(p);total+=s.isDirectory()?await size(p):s.size}return total}
console.log(`Built dist/ (${Math.round(await size(out)/1024)} KiB). No runtime dependencies.`);
