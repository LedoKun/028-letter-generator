import { sessionOf, displayValue, valueOf, conditionActive, templateProse } from './model.mjs';
const thaiWords=new Intl.Segmenter('th',{granularity:'word'});
function present(id,session){const v=valueOf(session,id);return !session.omitted.includes(id)&&(!session.availableFields||session.availableFields.includes(id)||session.converted?.includes(id))&&!!(Array.isArray(v)?v.length:String(v).trim());}
export function toPdf(doc) {
 const session=sessionOf(doc),H=globalThis.PdfGenerator?.helpers||globalThis.window?.PdfGenerator.helpers;
 const runs=(text,options)=>H.text(text,options).text.flatMap(run=>{
  const styled={...run,...options};
  // Empty runs let pdfmake wrap Thai words without inserting printable characters.
  return /[\u0E00-\u0E7F]/.test(run.text)?Array.from(thaiWords.segment(run.text),({segment})=>[{...styled,text:segment},{text:''}]).flat():[styled];
 });
 const supported=node=>!node.attrs?.hidden&&conditionActive(node.attrs?.condition,session)&&conditionActive(node.attrs?.printCondition,session)&&(node.attrs?.guard||[]).every(id=>present(id,session));
 const inline=(node,marks=[])=>{
  if(!supported(node))return [];
  const all=[...marks,...(node.marks||[])],options={};
  for(const m of all){if(m.type==='bold')options.bold=true;if(m.type==='italic')options.italics=true;if(m.type==='underline')options.decoration='underline';if(m.type==='textStyle'&&m.attrs?.fontSize)options.fontSize=parseFloat(m.attrs.fontSize);}
  if(node.type==='text'){const prose=all.find(m=>m.type==='templateText');return runs(prose?templateProse(node.text,prose.attrs,session):node.text,options);}
  if(node.type==='hardBreak')return runs('\n',options);
  if(node.type==='field') {
   if(!present(node.attrs.id,session))return [];
   if(valueOf(session,node.attrs.id)==='OTHER'||valueOf(session,node.attrs.id)==='Other')return [];
   const display=displayValue(session,node.attrs.id);if(!display)return [];const current=(node.content||[]).map(n=>n.type==='hardBreak'?'\n':n.text||'').join('').replace(/\u200B/g,'');
   if(current===display)return (node.content||[]).flatMap(child=>inline(child,all));
   return runs(display,{...options,...(node.content?.[0]?.marks||[]).reduce((o,m)=>({...o,...(m.type==='bold'?{bold:true}:m.type==='italic'?{italics:true}:m.type==='underline'?{decoration:'underline'}:m.type==='textStyle'&&m.attrs.fontSize?{fontSize:parseFloat(m.attrs.fontSize)}:{})}),{})});
  }
  return (node.content||[]).flatMap(child=>inline(child,all));
 };
 const meaningful=items=>items.some(n=>n.text?.some?.(t=>String(t.text||'').trim())||n.stack?.length||n.ul?.length||n.ol?.length||n.pageBreak);
 const blocks=(nodes,inList=false)=>nodes.flatMap(node=>{
  if(!supported(node)||['sessionData','insertionPoint'].includes(node.type))return [];
  const children=node.content||[];
  if(node.type==='picture'){const width=180*72/25.4*(node.attrs.width/100),height=233*72/25.4-80;return [{stack:[{image:node.attrs.src,fit:[width,height],alignment:'center'},...(node.attrs.caption?[{text:runs(node.attrs.caption,{}),fontSize:10,margin:[0,4,0,0],alignment:'center'}]:[])],unbreakable:true,margin:[0,8,0,8]}];}
  if(node.type==='pageBreak')return [{text:'',pageBreak:'before'}];
  if(['paragraph','heading'].includes(node.type)) {
   const text=inline(node),combined=text.map(n=>n.text).join('');
   if(!combined.trim())return node.attrs?.spacingAfter>5?[{text:'',margin:[0,0,0,node.attrs.spacingAfter]}]:[];
   const title=node.type==='heading';return [{text,alignment:node.attrs?.textAlign||'left',bold:title||undefined,fontSize:title?(node.attrs.level===1?16:11):11,lineHeight:1.05,margin:[(node.attrs?.indent||0)*12,title?4:0,0,node.attrs?.spacingAfter??(inList?2:5)]}];
  }
  if(['bulletList','orderedList'].includes(node.type)) {
   const items=children.filter(supported).map(child=>({stack:blocks(child.content||[],true)})).filter(item=>meaningful(item.stack));
   return items.length?[{[node.type==='bulletList'?'ul':'ol']:items,margin:[12,0,0,2],...(node.type==='orderedList'?{start:node.attrs?.start||1}:{})}]:[];
  }
  if(node.type==='clinicalSection'||node.type==='clinicalGroup') {
   if(node.attrs.id==='art'){const item=children.find(child=>child.type==='bulletList')?.content?.[0];if(item&&!meaningful(blocks(item.content.slice(1),true)))return [];}
   const output=blocks(children,inList),body=blocks(children.filter(c=>c.type!=='heading'),inList);
   if(node.type==='clinicalGroup'&&node.attrs.id==='signature'&&children.length===4&&children.every(child=>child.type==='paragraph')&&output.flatMap(n=>n.text||[]).map(run=>run.text).join('').length<400)return [{stack:output,unbreakable:true}];
   return meaningful(body)||node.attrs.diagnosis&&meaningful(output)?output:[];
  }
  if(node.type==='medicationRow'){
   const kind=node.attrs.kind,id=node.attrs.id;
   if(!present(`${kind}.${id}.name`,session))return [];
   const content=blocks(children,true);return content.length?[{ul:content.map(item=>({stack:[item]})),margin:[12,0,0,2]}]:[];
  }
  return blocks(children,inList);
 });
 return blocks(doc.content||[]);
}
