import express from 'express'; import httpProxy from 'http-proxy'; import { apiKeyAuth } from './apiKeys.js'; import { accessLogger } from './logger.js';
export function createGateway(options={}) {
  const app=express(); app.disable('x-powered-by'); app.set('trust proxy',options.trustProxy??false);
  const proxy=httpProxy.createProxyServer({changeOrigin:false,xfwd:true,timeout:10_000,proxyTimeout:10_000});
  proxy.on('proxyReq',proxyReq=>proxyReq.removeHeader('x-api-key'));
  proxy.on('error',(error,_req,res)=>{if(!res.headersSent)res.writeHead(502,{'content-type':'application/json'});res.end(JSON.stringify({error:'UPSTREAM_UNAVAILABLE',message:'The target service is unavailable.'}));console.error('Proxy error:',error.message);});
  app.use(accessLogger(options.logPath??'./logs/access.jsonl'));
  app.get('/health',(_q,r)=>r.json({status:'ok'}));
  app.use(apiKeyAuth(options.apiKeys??[]));
  const routes=options.routes??{};
  for(const [prefix,target] of Object.entries(routes)) app.use(prefix,(req,res)=>proxy.web(req,res,{target,ignorePath:false}));
  app.use((req,res)=>res.status(404).json({error:'ROUTE_NOT_FOUND',message:'No microservice is mapped to this path.'}));
  return {app,proxy};
}
