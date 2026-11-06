const email = process.argv[2] || (await import('node:fs')).readFileSync('.env','utf8').match(/^GOPAY_EMAIL="?([^"\r\n]+)"?/m)?.[1];
const pass  = process.argv[3] || (await import('node:fs')).readFileSync('.env','utf8').match(/^GOPAY_PASSWORD="?([^"\r\n]+)"?/m)?.[1];
const H = () => ({'Accept':'application/json, text/plain, */*','Accept-Language':'id','Authentication-Type':'go-id','Authorization':'X-API-Key','Content-Type':'application/json','Gojek-Country-Code':'ID','Gojek-Timezone':'Asia/Jakarta','Origin':'https://portal.gofoodmerchant.co.id','Referer':'https://portal.gofoodmerchant.co.id/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','X-AppVersion':'platform-v3.107.0-94ce5d57','X-PhoneMake':'Windows 10 64-bit','X-PhoneModel':'Chrome 149','X-Platform':'Web','X-User-Locale':'en-US','X-User-Type':'merchant','x-DeviceOS':'Web','x-appId':'go-biz-web-dashboard','x-uniqueid':crypto.randomUUID()});
const post = async (u, b) => { const r = await fetch(u,{method:'POST',headers:H(),body:JSON.stringify(b)}); return [r.status, await r.json().catch(()=>({}))]; };
console.log('email:', email, '| pass:', '*'.repeat((pass||'').length));
const [s1,b1] = await post('https://api.gobiz.co.id/goid/login/request',{email,login_type:'password',client_id:'go-biz-web-new'});
console.log('[1] validasi email -> HTTP', s1, JSON.stringify(b1.errors||'OK').slice(0,150));
const [s2,b2] = await post('https://api.gobiz.co.id/goid/token',{client_id:'go-biz-web-new',grant_type:'password',data:{email,password:pass}});
console.log('[2] login -> HTTP', s2, b2.access_token ? 'LOGIN BERHASIL (token didapat)' : JSON.stringify(b2.errors||b2).slice(0,200));
