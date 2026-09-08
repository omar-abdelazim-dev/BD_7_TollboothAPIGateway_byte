import { createHash, timingSafeEqual } from 'node:crypto';
const digest = value => createHash('sha256').update(value).digest();
export function apiKeyAuth(keys) {
  const accepted = keys.filter(Boolean).map(digest);
  return (req,res,next) => {
    const supplied=req.get('x-api-key');
    const suppliedDigest=supplied?digest(supplied):Buffer.alloc(32);
    const valid=accepted.reduce((match,key)=>timingSafeEqual(key,suppliedDigest)||match,false);
    if(!valid) return res.status(401).json({error:'INVALID_API_KEY',message:'A valid X-API-Key header is required.'});
    next();
  };
}
