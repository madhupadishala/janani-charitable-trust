import Database from 'better-sqlite3';
import {mkdirSync} from 'node:fs';import {dirname} from 'node:path';
import {hashPassword} from './auth.js';
export function openDb(path,adminEmail,adminPassword){mkdirSync(dirname(path),{recursive:true});const db=new Database(path);db.pragma('journal_mode = WAL');db.pragma('foreign_keys = ON');db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','writer')),active INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY,slug TEXT UNIQUE NOT NULL,title TEXT NOT NULL,excerpt TEXT NOT NULL DEFAULT '',body TEXT NOT NULL,section TEXT NOT NULL CHECK(section IN ('our-work','stories','campaigns','events','announcements','impact')),cover TEXT,author_id INTEGER NOT NULL REFERENCES users(id),status TEXT NOT NULL CHECK(status IN ('draft','published')),created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,published_at TEXT);
CREATE TABLE IF NOT EXISTS media(id INTEGER PRIMARY KEY,path TEXT UNIQUE NOT NULL,author_id INTEGER NOT NULL REFERENCES users(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),action TEXT NOT NULL,target TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_posts_public ON posts(status,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);`);
if(db.prepare('SELECT COUNT(*) n FROM users').get().n===0){if(!adminEmail||!adminPassword)throw Error('Set JANANI_ADMIN_EMAIL and JANANI_ADMIN_PASSWORD before first start');db.prepare('INSERT INTO users(email,password_hash,role) VALUES(?,?,?)').run(adminEmail.toLowerCase().trim(),hashPassword(adminPassword),'admin');}
return db;}
