import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { one, sql, close } from '../src/db/index.js';

const email = process.argv[2] || 'iaa@gmail.com';
const newPass = process.argv[3] || 'gacor123';

const hash = await bcrypt.hash(newPass, 10);
await sql(`UPDATE users SET password = $1 WHERE email = $2`, [hash, email]);
const u = await one(`SELECT id, email, name FROM users WHERE email = $1`, [email]);
console.log('Password updated:', u, '→', newPass);
await close();
