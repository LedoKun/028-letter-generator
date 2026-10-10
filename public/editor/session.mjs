import { Step, StepResult } from '@tiptap/pm/transform';
import { definition } from './fields.mjs';
import { sessionOf } from './model.mjs';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const maps=new Set(['values','archives','fieldArchives']);
const read=(attrs,path)=>path.length===1?attrs[path[0]]:attrs[path[0]]?.[path[1]];

// Undo changes only the edited records, preserving facts updated in another template.
class SessionPatch extends Step {
 constructor(changes){super();this.changes=changes;}
 apply(doc){
  if(doc.firstChild?.type.name!=='sessionData')return StepResult.fail('Missing clinical session');
  const attrs={...doc.firstChild.attrs};
  for(const {path,value,remove}of this.changes){
   if(path.length===1){if(remove)delete attrs[path[0]];else attrs[path[0]]=value;}
   else{attrs[path[0]]={...attrs[path[0]]};if(remove)delete attrs[path[0]][path[1]];else attrs[path[0]][path[1]]=value;}
  }
  return StepResult.ok(doc.copy(doc.content.replaceChild(0,doc.firstChild.type.create(attrs))));
 }
 invert(doc){return new SessionPatch(this.changes.map(({path})=>{const value=read(doc.firstChild.attrs,path);return {path,...(value===undefined?{remove:true}:{value})};}));}
 map(){return this;}
 toJSON(){return {stepType:'clinicalSessionPatch',changes:this.changes};}
 static fromJSON(schema,json){return new SessionPatch(json.changes);}
}
Step.jsonID('clinicalSessionPatch',SessionPatch);

export function patchSession(tr,next){
 const previous=sessionOf(tr.doc),changes=[];
 for(const key of new Set([...Object.keys(previous),...Object.keys(next)])){
  if(maps.has(key))for(const id of new Set([...Object.keys(previous[key]||{}),...Object.keys(next[key]||{})])){
   if(!same(previous[key]?.[id],next[key]?.[id])){const value=next[key]?.[id];changes.push({path:[key,id],...(value===undefined?{remove:true}:{value})});}
  }
  else if(!same(previous[key],next[key]))changes.push({path:[key],...(next[key]===undefined?{remove:true}:{value:next[key]})});
 }
 return changes.length?tr.step(new SessionPatch(changes)):tr;
}

export const reusableField=id=>!!definition(id)&&!definition(id).calculated&&!id.startsWith('document.')&&!id.startsWith('referral.');
export class PatientSession {
 constructor(){this.values={};this.documents=new Map();}
 capture(next,previous){
  for(const id of new Set([...Object.keys(next.values),...Object.keys(previous?.values||{})])){
   if(reusableField(id)&&(!previous||!same(next.values[id],previous.values[id])))this.values[id]=structuredClone(next.values[id]||{value:'',status:'manual'});
  }
 }
 merge(session){return {...session,values:{...session.values,...structuredClone(this.values)}};}
 remember(state,baseline){this.documents.set(sessionOf(state.doc).template,{state,baseline});}
 dirty(state,baseline){return !state.doc.eq(baseline)||[...this.documents.values()].some(d=>!d.state.doc.eq(d.baseline));}
 clear(){this.values={};this.documents.clear();}
}
