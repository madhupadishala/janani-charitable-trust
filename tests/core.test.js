import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hashPassword,checkPassword,token,tokenHash} from '../src/auth.js';
test('password hashes are salted and verify',()=>{
 const a=hashPassword('a-long-unique-password'),b=hashPassword('a-long-unique-password');
 assert.notEqual(a,b);
 assert.ok(checkPassword('a-long-unique-password',a));
 assert.equal(checkPassword('incorrect',a),false);
 assert.throws(()=>hashPassword('short'));
});
test('session tokens are random and not stored raw',()=>{
 const a=token(),b=token();
 assert.notEqual(a,b);assert.notEqual(a,tokenHash(a));assert.equal(tokenHash(a).length,64);
});
test('homepage and admin have the publishing integration',()=>{
 const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const admin=readFileSync(new URL('../public/admin.html',import.meta.url),'utf8');
 assert.match(home,/Our Work &amp; Stories/);
 assert.match(home,/\/api\/posts/);
 assert.match(admin,/Publish now/);
 assert.match(admin,/Team access/);
});
