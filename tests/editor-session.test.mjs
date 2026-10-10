import test from 'node:test';
import assert from 'node:assert/strict';
import {Schema} from '@tiptap/pm/model';
import {EditorState} from '@tiptap/pm/state';
import {history,undo} from '@tiptap/pm/history';
import {patchSession,PatientSession} from '../public/editor/session.mjs';
const schema=new Schema({nodes:{doc:{content:'sessionData paragraph'},sessionData:{atom:true,attrs:{template:{default:'referral'},language:{default:'en'},values:{default:{}},archives:{default:{}}}},paragraph:{content:'text*'},text:{}}});
const make=attrs=>EditorState.create({schema,plugins:[history()],doc:schema.node('doc',null,[schema.node('sessionData',attrs),schema.node('paragraph',null,[schema.text('Clinical prose')])])});
test('undoing a section archive preserves a patient name updated from another template',()=>{
 let state=make({values:{'patient.name':{value:'FIRST PATIENT'}}}),next=structuredClone(state.doc.firstChild.attrs);
 next.archives.hiv={type:'clinicalSection'};state=state.apply(patchSession(state.tr,next));
 next=structuredClone(state.doc.firstChild.attrs);next.values['patient.name']={value:'SECOND PATIENT'};state=state.apply(patchSession(state.tr,next).setMeta('addToHistory',false));
 assert.equal(undo(state,tr=>state=state.apply(tr)),true);assert.equal(state.doc.firstChild.attrs.values['patient.name'].value,'SECOND PATIENT');assert.deepEqual(state.doc.firstChild.attrs.archives,{});
});
test('shared facts include explicit clearing and keep document calculations separate',()=>{
 const session=new PatientSession(),first={values:{'patient.name':{value:'PATIENT'},'hiv.initialCD4':{value:'325'},'patient.age':{value:'26',status:'override'},'document.date':{value:'2026-10-10'}}};
 session.capture(first);const merged=session.merge({values:{'document.date':{value:'2026-10-11'}}});assert.equal(merged.values['patient.name'].value,'PATIENT');assert.equal(merged.values['hiv.initialCD4'].value,'325');assert.equal(merged.values['patient.age'],undefined);assert.equal(merged.values['document.date'].value,'2026-10-11');
 session.capture({values:{}},first);assert.equal(session.merge({values:{'patient.name':{value:'OLD'}}}).values['patient.name'].value,'');session.clear();assert.deepEqual(session.values,{});
});
