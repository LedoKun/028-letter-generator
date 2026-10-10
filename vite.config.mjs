import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({root:'public',publicDir:false,build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input:Object.fromEntries(['index.html','referral/index.html','medical-certificate/index.html','certificate-medication-letter/index.html','free-form-letter/index.html'].map((path,i)=>[String(i),resolve('public',path)]))}},server:{host:'127.0.0.1'}});
