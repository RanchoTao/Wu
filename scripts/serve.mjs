import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.env.SERVE_DIST==='1'?'dist':'.');
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/markdown; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  // Test the same files at a GitHub Pages-like repository prefix too.
  if(pathname.startsWith('/rongling-wu-tribute/'))pathname=pathname.slice('/rongling-wu-tribute'.length);
  const file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  const info=await stat(file),target=info.isDirectory()?path.join(file,'index.html'):file;
  if(pathname.split('/').some(p=>p.startsWith('.')&&p!=='.nojekyll')||pathname.includes('node_modules')){res.writeHead(403);res.end();return}
  const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('404 — File not found')}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/rongling-wu-tribute/`));
