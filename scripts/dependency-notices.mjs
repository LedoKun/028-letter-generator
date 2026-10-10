import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
const lock=JSON.parse(readFileSync('package-lock.json')),records=[],notices=[];
const allowed=new Set(['MIT','Apache-2.0','ISC','BSD-3-Clause','MPL-2.0']);
for(const [path,entry]of Object.entries(lock.packages)){
 if(!path)continue;if(!allowed.has(entry.license))throw new Error(`Review dependency licence: ${path}: ${entry.license}`);
 const name=path.split('node_modules/').at(-1),installed=existsSync(path+'/package.json'),pkg=installed?JSON.parse(readFileSync(path+'/package.json')):{};
 const source=typeof pkg.repository==='object'?pkg.repository.url:pkg.repository;
 records.push({name,version:entry.version,licence:entry.license,optional:!!entry.optional,installed,source:source||entry.resolved,phase:/^(?:@tiptap\/|prosemirror-|orderedmap$|rope-sequence$|w3c-keyname$)/.test(name)?'browser':'build/test'});
 if(installed)for(const file of readdirSync(path).filter(file=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(file))){try{notices.push(`${name}@${entry.version} — ${entry.license}\n${readFileSync(path+'/'+file,'utf8')}`);}catch{}}
}
notices.push('Vendored pdfmake 0.3.9 — MIT\nSource: https://github.com/bpampuch/pdfmake/tree/0.3.9\n'+readFileSync('public/vendor/pdfmake/LICENSE','utf8'));
for(const name of ['OFL-Sarabun.txt','OFL-NotoSans.txt','OFL-NotoSansThai.txt'])notices.push(readFileSync('public/vendor/fonts/'+name,'utf8'));
notices.push('Lightning CSS (MPL-2.0) is used unmodified during CSS compilation. Its source is available at https://github.com/parcel-bundler/lightningcss. No compiler binaries are shipped in the Caddy application image.');
writeFileSync('public/third-party-notices.txt',notices.join('\n\n--------------------\n\n')+'\n');
writeFileSync('docs/dependency-licenses.json',JSON.stringify(records,null,2)+'\n');console.log(`Checked ${records.length} locked dependency licences.`);
