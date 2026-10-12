import test from 'node:test';
import assert from 'node:assert/strict';
import {newId,hydrate,walk} from '../public/editor/model.mjs';
import {createDocument} from '../public/editor/templates.mjs';

test('uses the native UUID API when available',()=>{
 assert.match(newId(),/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});
test('generates unique cryptographic IDs and hydrates templates without randomUUID',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto'),native=globalThis.crypto;
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:native.getRandomValues.bind(native)}});
 try{
  const ids=Array.from({length:1000},()=>newId());assert.equal(new Set(ids).size,ids.length);for(const id of ids)assert.match(id,/^[a-f0-9]{32}$/);
  for(const template of ['referral','medical','medication','freeform']){
   const doc=hydrate(createDocument(template,'en')),occurrences=[];walk(doc,node=>{if(node.type==='field')occurrences.push(node.attrs.occurrence);});assert.ok(occurrences.length);assert.equal(new Set(occurrences).size,occurrences.length);for(const id of occurrences)assert.match(id,/^[a-f0-9]{32}$/);
  }
 }finally{Object.defineProperty(globalThis,'crypto',descriptor);}
});
