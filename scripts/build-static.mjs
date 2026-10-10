import {createHash} from 'node:crypto';
import {cp,readFile,writeFile,readdir} from 'node:fs/promises';
for(const path of ['css','vendor','media','shared/pdf-generator.js','shared/print-header-footer.js','shared/print-header-footer.css','favicon.ico','site.webmanifest','js/offline.js','third-party-notices.txt'])await cp(`public/${path}`,`dist/${path}`,{recursive:true});
const paths=[];
async function scan(dir){for(const file of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${file.name}`;if(file.isDirectory())await scan(path);else paths.push('/'+path.slice(5));}}
await scan('dist');
let worker=await readFile('public/service-worker.js','utf8');
worker=worker.replace(/const APP_SHELL = \[[\s\S]*?\];/,`const APP_SHELL = ${JSON.stringify(['/',...paths.sort()],null,2)};`);
const hash=createHash('sha256');for(const path of paths.sort())hash.update(await readFile('dist'+path));hash.update(worker);
worker=worker.replace(/const CACHE_NAME = .*?;/,`const CACHE_NAME = 'clinical-letter-generators-v22-${hash.digest('hex').slice(0,12)}';`);
await writeFile('dist/service-worker.js',worker);
