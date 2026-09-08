import { appendFile, mkdir } from 'node:fs/promises'; import { dirname } from 'node:path';
export function accessLogger(path) {
  let writes=Promise.resolve();
  return (req,_res,next)=>{ const route=req.path.split('/').filter(Boolean)[0]??'root'; const record={ip:req.ip,timestamp:new Date().toISOString(),targetRoute:`/${route}`,method:req.method}; writes=writes.then(()=>mkdir(dirname(path),{recursive:true})).then(()=>appendFile(path,`${JSON.stringify(record)}\n`,{mode:0o600})).catch(e=>console.error('Access log write failed:',e.message)); next(); };
}
