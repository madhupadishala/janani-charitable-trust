import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import multer from 'multer';
import {join,extname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {openDb} from './db.js';
import {hashPassword,checkPassword,token,tokenHash} from './auth.js';
const root=join(fileURLToPath(new URL('.',import.meta.url)),'..');
const dataDir=process.env.JANANI_DATA_DIR||join(root,'data');
const mediaDir=join(dataDir,'media');
mkdirSync(mediaDir,{recursive:true});
const db=openDb(join(dataDir,'janani.sqlite'),process.env.JANANI_ADMIN_EMAIL,process.env.JANANI_ADMIN_PASSWORD);
const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'100kb'}));
app.use('/uploads',express.static(mediaDir,{immutable:true,maxAge:'7d'}));
app.use(express.static(join(root,'public')));
const auth=(req,res,next)=>{
 const bearer=req.get('authorization')||'';
 const raw=bearer.startsWith('Bearer ')?bearer.slice(7):'';
 if(!raw)return res.status(401).json({error:'Sign in required'});
 const user=db.prepare(`SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.id=? AND s.expires_at>? AND u.active=1`).get(tokenHash(raw),Date.now());
 if(!user)return res.status(401).json({error:'Invalid session'});
 req.user=user;req.session=tokenHash(raw);next();
};
const admin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'Administrators only'});
const fail=(res,msg='Invalid input')=>res.status(400).json({error:msg});
const log=(uid,action,target)=>db.prepare('INSERT INTO audit(user_id,action,target) VALUES(?,?,?)').run(uid,action,String(target));
const safeBody=s=>sanitizeHtml(s||'',{
 allowedTags:['p','br','strong','em','b','i','u','h2','h3','h4','blockquote','ul','ol','li','a','img'],
 allowedAttributes:{a:['href','target','rel'],img:['src','alt']},
 allowedSchemes:['https','http'],
 allowedSchemesByTag:{img:['https','http']},
 transformTags:{a:sanitizeHtml.simpleTransform('a',{rel:'noopener noreferrer'})}
});
const sections=new Set(['our-work','stories','campaigns','events','announcements','impact']);
const slugify=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,90);
app.post('/api/login',rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:'draft-7',legacyHeaders:false}),(req,res)=>{
 const {email,password}=req.body||{};
 const u=db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(String(email||'').toLowerCase().trim());
 if(!u||!checkPassword(password,u.password_hash))return res.status(401).json({error:'Invalid credentials'});
 const t=token();
 db.prepare('INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)').run(tokenHash(t),u.id,Date.now()+8*60*60*1000);
 res.json({token:t,user:{id:u.id,email:u.email,role:u.role}});
});
app.post('/api/logout',auth,(req,res)=>{db.prepare('DELETE FROM sessions WHERE id=?').run(req.session);res.json({ok:true});});
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.get('/api/users',auth,admin,(req,res)=>res.json(db.prepare('SELECT id,email,role,active,created_at FROM users ORDER BY id DESC').all()));
app.post('/api/users',auth,admin,(req,res)=>{
 const {email,password,role}=req.body||{};
 if(!/^\S+@\S+\.\S+$/.test(email||'')||!['admin','writer'].includes(role))return fail(res);
 try{
 const info=db.prepare('INSERT INTO users(email,password_hash,role) VALUES(?,?,?)').run(email.toLowerCase().trim(),hashPassword(password),role);
 log(req.user.id,'user.created',info.lastInsertRowid);res.status(201).json({id:info.lastInsertRowid});
 }catch(e){return fail(res,e.message.includes('UNIQUE')?'Email already registered':'Invalid password or email');}
});
app.patch('/api/users/:id',auth,admin,(req,res)=>{
 const id=Number(req.params.id),active=req.body?.active;
 if(!Number.isSafeInteger(id)||typeof active!=='boolean'||id===req.user.id)return fail(res,'Invalid change');
 const i=db.prepare('UPDATE users SET active=? WHERE id=?').run(active?1:0,id);
 if(!i.changes)return res.sendStatus(404);
 if(!active)db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
 log(req.user.id,'user.status',id);res.json({ok:true});
});
const listPost='SELECT p.id,p.slug,p.title,p.excerpt,p.body,p.section,p.cover,p.status,p.created_at,p.updated_at,p.published_at,u.email author FROM posts p JOIN users u ON p.author_id=u.id';
app.get('/api/posts',(req,res)=>{
 const section=req.query.section;const params=['published'];let sql=listPost+' WHERE p.status=?';
 if(section&&sections.has(section)){sql+=' AND p.section=?';params.push(section);}
 sql+=' ORDER BY p.published_at DESC LIMIT 100';
 res.json(db.prepare(sql).all(...params));
});
app.get('/api/posts/:slug',(req,res)=>{
 const p=db.prepare(listPost+" WHERE p.slug=? AND p.status='published'").get(req.params.slug);
 p?res.json(p):res.sendStatus(404);
});
app.get('/api/admin/posts',auth,(req,res)=>res.json(db.prepare(listPost+(req.user.role==='admin'?'':' WHERE p.author_id=?')+' ORDER BY p.updated_at DESC').all(...(req.user.role==='admin'?[]:[req.user.id]))));
app.post('/api/admin/posts',auth,(req,res)=>{
 const {title,body,excerpt='',section,status='draft',cover=''}=req.body||{};
 if(!title||title.length>150||!sections.has(section)||!['draft','published'].includes(status)||typeof body!=='string'||body.length>100000)return fail(res);
 const slug=slugify(title)+'-'+randomUUID().slice(0,6);
 const info=db.prepare('INSERT INTO posts(slug,title,excerpt,body,section,status,cover,author_id,published_at) VALUES(?,?,?,?,?,?,?,?,?)').run(slug,title.slice(0,150),String(excerpt).slice(0,350),safeBody(body),section,status,String(cover).slice(0,500),req.user.id,status==='published'?new Date().toISOString():null);
 log(req.user.id,'post.created',info.lastInsertRowid);res.status(201).json({id:info.lastInsertRowid,slug});
});
app.patch('/api/admin/posts/:id',auth,(req,res)=>{
 const id=Number(req.params.id);const previous=db.prepare('SELECT * FROM posts WHERE id=?').get(id);
 if(!previous)return res.sendStatus(404);
 if(req.user.role!=='admin'&&previous.author_id!==req.user.id)return res.sendStatus(403);
 const x={...previous,...req.body};
 if(!x.title||x.title.length>150||!sections.has(x.section)||!['draft','published'].includes(x.status)||typeof x.body!=='string'||x.body.length>100000)return fail(res);
 db.prepare('UPDATE posts SET title=?,excerpt=?,body=?,section=?,cover=?,status=?,updated_at=CURRENT_TIMESTAMP,published_at=? WHERE id=?').run(x.title,String(x.excerpt||'').slice(0,350),safeBody(x.body),x.section,String(x.cover||'').slice(0,500),x.status,x.status==='published'?(previous.published_at||new Date().toISOString()):null,id);
 log(req.user.id,'post.updated',id);res.json({ok:true});
});
app.delete('/api/admin/posts/:id',auth,(req,res)=>{
 const row=db.prepare('SELECT * FROM posts WHERE id=?').get(Number(req.params.id));
 if(!row)return res.sendStatus(404);
 if(req.user.role!=='admin'&&row.author_id!==req.user.id)return res.sendStatus(403);
 db.prepare('DELETE FROM posts WHERE id=?').run(row.id);
 log(req.user.id,'post.deleted',row.id);res.json({ok:true});
});
const upload=multer({storage:multer.diskStorage({
 destination:mediaDir,
 filename:(req,f,cb)=>cb(null,randomUUID()+extname(f.originalname).toLowerCase())
}),limits:{fileSize:3*1024*1024,files:1},fileFilter:(req,f,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(f.mimetype))});
app.post('/api/upload',auth,upload.single('photo'),(req,res)=>{
 if(!req.file)return fail(res,'Upload JPEG, PNG, or WebP up to 3 MB');
 const path='/uploads/'+req.file.filename;
 db.prepare('INSERT INTO media(path,author_id) VALUES(?,?)').run(path,req.user.id);
 log(req.user.id,'media.uploaded',path);res.status(201).json({url:path});
});
app.get('/api/audit',auth,admin,(req,res)=>res.json(db.prepare('SELECT a.*,u.email FROM audit a LEFT JOIN users u ON a.user_id=u.id ORDER BY a.id DESC LIMIT 100').all()));
app.get('/admin',(req,res)=>res.sendFile(join(root,'public','admin.html')));
app.get('/stories/:slug',(req,res)=>res.sendFile(join(root,'public','story.html')));
app.use((err,req,res,next)=>{
 if(err instanceof multer.MulterError)return res.status(400).json({error:err.message});
 console.error(err.message);res.status(500).json({error:'Server error'});
});
if(process.env.NODE_ENV!=='test')app.listen(Number(process.env.PORT||3000),()=>console.log('Janani CMS listening'));
export {app,db};
