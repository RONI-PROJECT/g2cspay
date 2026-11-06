import speakeasy from 'speakeasy';
const secret = process.argv[2];
if (!secret) {
  console.log('Usage: node scripts/show-totp.js <SECRET>');
  process.exit(1);
}
const code = speakeasy.totp({ secret, encoding: 'base32' });
const sisa = 30 - (Math.floor(Date.now() / 1000) % 30);
console.log('Kode TOTP: ' + code);
console.log('Sisa: ' + sisa + ' detik');
