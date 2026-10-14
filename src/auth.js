import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
export function hashPassword(p){if(typeof p!=='string'||p.length<12)throw Error('Password must contain at least 12 characters');const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(p,salt,64).toString('hex')}`;}
export function checkPassword(p,h){try {const [salt,digest]=h.split(':');const a=scryptSync(p,salt,64),b=Buffer.from(digest,'hex');return a.length===b.length&&timingSafeEqual(a,b);}catch{return false;}}
export function token(){return randomBytes(32).toString('base64url');}
export function tokenHash(t){return createHash('sha256').update(t).digest('hex');}
