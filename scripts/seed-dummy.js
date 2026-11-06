import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import { one, all, sql, close } from '../src/db/index.js';

const email = 'iaa@gmail.com';
const name = 'ronixf';
const password = 'r';
const SALDO = 500000;

async function main() {
  const uCols = (await all(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`)).map(r => r.column_name);
  const tCols = (await all(`SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions'`)).map(r => r.column_name);

  const pwCol = uCols.find(n => /^password$/i.test(n)) || uCols.find(n => /pass/i.test(n));
  const secretCol = uCols.find(n => /totp.*secret/i.test(n));
  const enabledCol = uCols.find(n => /totp.*enabl/i.test(n));
  const roleCol = uCols.includes('role') ? 'role' : null;
  const createdAtUser = uCols.find(n => /^createdat$/i.test(n));

  const hash = await bcrypt.hash(password, 10);
  const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;

  // Clean
  await sql(`DELETE FROM transactions WHERE "userId" IN (SELECT id FROM users WHERE email = $1)`, [email]).catch(()=>{});
  await sql(`DELETE FROM withdrawals WHERE "userId" IN (SELECT id FROM users WHERE email = $1)`, [email]).catch(()=>{});
  await sql(`DELETE FROM users WHERE email = $1`, [email]).catch(()=>{});

  // User
  const c = ['email', 'name', `"${pwCol}"`];
  const v = ['$1', '$2', '$3'];
  const p = [email, name, hash];
  c.push(`"${secretCol}"`); v.push('$4'); p.push(totpSecret);
  if (enabledCol) { c.push(`"${enabledCol}"`); v.push('true'); }
  if (roleCol) { c.push(`"${roleCol}"`); v.push("'user'"); }
  if (createdAtUser) { c.push(`"${createdAtUser}"`); v.push('NOW()'); }

  const user = await one(`INSERT INTO users (${c.join(',')}) VALUES (${v.join(',')}) RETURNING id, email`, p);
  console.log('user:', user);

  // Transaction PAID — isi semua kolom yang perlu
  const trxId = 'CSP-DUMMY' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const fee = 0;
  const total = SALDO;
  const payAmount = SALDO;
  const amountToPay = SALDO;
  const merchantAmount = SALDO;
  const feeAmount = 0;
  const feePercent = 0;
  const adminFee = 0;
  const uniqueCode = 0;
  const qrString = 'DUMMY';

  const fields = {
    '"trxId"': '$1',
    'status': "'PAID'",
    'amount': '$2',
    'fee': '$3',
    'total': '$4',
    '"payAmount"': '$5',
    '"uniqueCode"': '$6',
    '"qrString"': '$7',
    '"createdAt"': 'NOW()',
    '"paidAt"': 'NOW()',
    '"expiresAt"': "NOW() + INTERVAL '1 hour'",
    '"userId"': '$8',
    '"amountToPay"': '$5',
    '"feeAmount"': '$3',
    '"merchantAmount"': '$5',
    '"feePercent"': '0',
    '"adminFee"': '0',
  };

  // Filter cuma kolom yang ada di schema
  const tc = [], tv = [];
  for (const [k, val] of Object.entries(fields)) {
    const cleanKey = k.replace(/"/g, '');
    if (tCols.includes(cleanKey)) {
      tc.push(k);
      tv.push(val);
    }
  }

  const tp = [trxId, SALDO, fee, total, payAmount, uniqueCode, qrString, user.id];

  await sql(`INSERT INTO transactions (${tc.join(',')}) VALUES (${tv.join(',')})`, tp);
  console.log('trx:', trxId);

  const code = speakeasy.totp({ secret: totpSecret, encoding: 'base32' });
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  Email:    ' + email);
  console.log('  Password: ' + password);
  console.log('  TOTP Secret: ' + totpSecret);
  console.log('  Kode TOTP:   ' + code);
  console.log('  Saldo:    Rp ' + SALDO.toLocaleString('id-ID'));
  console.log('═══════════════════════════════════════');

  await close();
}

main().catch(async (e) => { console.error('', e.message); await close(); process.exit(1); });
