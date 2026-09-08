import { createGateway } from './app.js';
const port=Number(process.env.PORT??4000); const keys=(process.env.GATEWAY_API_KEYS??'development-key').split(',').map(x=>x.trim());
const {app,proxy}=createGateway({apiKeys:keys,logPath:process.env.ACCESS_LOG_PATH,routes:{'/auth':process.env.AUTH_SERVICE_URL??'http://127.0.0.1:4101','/users':process.env.USERS_SERVICE_URL??'http://127.0.0.1:4102','/billing':process.env.BILLING_SERVICE_URL??'http://127.0.0.1:4103'}});
const server=app.listen(port,()=>console.log(`Tollbooth gateway on http://localhost:${port}`)); for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{proxy.close();process.exit(0);}));
