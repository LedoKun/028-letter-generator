import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
export const PAGE={width:210*96/25.4,height:297*96/25.4,top:34*96/25.4,bottom:30*96/25.4,side:15*96/25.4,gap:24};
const key=new PluginKey('clinicalPagination');
const graphemes=new Intl.Segmenter(undefined,{granularity:'grapheme'});
function lines(view) {
 const origin=view.dom.getBoundingClientRect().top,scale=Number(view.dom.closest('.document-surface')?.dataset.zoom)||1,records=[];
 view.state.doc.descendants((node,pos)=>{
  if(node.attrs.hidden)return false;
  if(node.type.name==='insertionPoint'||node.attrs.prosePlaceholder&&!node.attrs.writingSpace&&!node.content.size)return false;
  if(node.type.name==='pageBreak'){records.push({pos,top:(view.nodeDOM(pos).getBoundingClientRect().top-origin)/scale,manual:true});return false;}
  if(node.type.name==='clinicalGroup'&&node.attrs.id==='signature'){const r=view.nodeDOM(pos).getBoundingClientRect();let manual=false;node.descendants(child=>{if(child.type.name==='pageBreak')manual=true;});if(!manual&&r.height/scale<=PAGE.height-PAGE.top-PAGE.bottom){records.push({pos,top:(r.top-origin)/scale,bottom:(r.bottom-origin)/scale});return false;}}
  if(node.type.name==='picture'){const r=view.nodeDOM(pos).getBoundingClientRect();records.push({pos,top:(r.top-origin)/scale,bottom:(r.bottom-origin)/scale});return false;}
  if(!node.isTextblock)return;
  const dom=view.nodeDOM(pos);if(!dom?.getClientRects().length)return false;
  let lastTop=-Infinity;const $pos=view.state.doc.resolve(pos),listStart=['listItem','medicationRow'].includes($pos.parent.type.name)&&$pos.index()===0?$pos.before($pos.depth):null;
  const add=(p,r)=>{const top=(r.top-origin)/scale;if(r.height&&r.width&&Math.abs(top-lastTop)>4){records.push({pos:listStart!==null&&!Number.isFinite(lastTop)?listStart:p,top,bottom:(r.bottom-origin)/scale});lastTop=top;}};
  const walker=document.createTreeWalker(dom,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode(n){
   if(n.nodeType===1){if(n.matches('[hidden],.page-spacer,.inline-choice,.field-remove,.editor-dropdown'))return NodeFilter.FILTER_REJECT;if(n.matches('.clinical-field[data-empty="true"]'))return NodeFilter.FILTER_ACCEPT;return NodeFilter.FILTER_SKIP;}
   return NodeFilter.FILTER_ACCEPT;
  }});
  let n;const range=document.createRange();
  while(n=walker.nextNode()) {
   if(n.nodeType===1){add(view.posAtDOM(n,0)-1,n.getBoundingClientRect());continue;}
   for(const part of graphemes.segment(n.data)) {range.setStart(n,part.index);range.setEnd(n,part.index+part.segment.length);add(view.posAtDOM(n,part.index),range.getBoundingClientRect());}
  }
  if(!Number.isFinite(lastTop)) {const r=(dom.querySelector(':scope > br.ProseMirror-trailingBreak')||dom).getBoundingClientRect();records.push({pos:pos+1,top:(r.top-origin)/scale,bottom:(r.bottom-origin)/scale});}
  return false;
 });
 return records;
}
function decorations(doc,breaks) {
 return DecorationSet.create(doc,[...breaks].map(([pos,height])=>Decoration.widget(pos,()=>{
  const dom=document.createElement('span');dom.className='page-spacer';dom.contentEditable='false';dom.setAttribute('aria-hidden','true');dom.style.height=`${height}px`;return dom;
 },{side:-1,key:`${pos}:${height}`})));
}
export const Pagination=Extension.create({
 name:'clinicalPagination',addOptions(){return {onLayout:()=>{}};},
 addProseMirrorPlugins(){const onLayout=this.options.onLayout;
 return [new Plugin({key,
  state:{init:()=>DecorationSet.empty,apply:(tr,value)=>tr.getMeta(key)??value.map(tr.mapping,tr.doc)},
  props:{decorations:state=>key.getState(state)},
  view(view){let frame=0,dead=false;
   const apply=(breaks)=>view.dispatch(view.state.tr.setMeta(key,decorations(view.state.doc,breaks)).setMeta('addToHistory',false));
   const paginate=()=>{
    if(dead)return;if(view.composing){frame=requestAnimationFrame(paginate);return;}
    apply(new Map());
    const breaks=new Map();let offset=0,page=0;
    for(const line of lines(view)) {
     const top=line.top+offset,bottom=(line.bottom??line.top)+offset,end=page*(PAGE.height+PAGE.gap)+PAGE.height-PAGE.bottom;
     if(line.manual||bottom>end+0.5){
      page++;
      const height=Math.max(0,page*(PAGE.height+PAGE.gap)+PAGE.top-top);
      breaks.set(line.pos,(breaks.get(line.pos)||0)+height);offset+=height;
     }
    }
    apply(breaks);
    let attempts=0;
    const refine=()=>{
     if(dead)return;
     let changed=false,lastBottom=PAGE.top;
     for(const line of lines(view)) {
      if(line.manual){lastBottom=Math.max(lastBottom,line.top);continue;}lastBottom=Math.max(lastBottom,line.bottom);
      const page=Math.floor(line.top/(PAGE.height+PAGE.gap));
      const start=page*(PAGE.height+PAGE.gap)+PAGE.top,end=page*(PAGE.height+PAGE.gap)+PAGE.height-PAGE.bottom;
      if(line.top<start-0.5||line.bottom>end+0.5) {
       const target=line.top<start-0.5?start:(page+1)*(PAGE.height+PAGE.gap)+PAGE.top;
       const height=target-line.top;
       if(height>0){breaks.set(line.pos,(breaks.get(line.pos)||0)+height);changed=true;break;}
      }
     }
     if(changed&&attempts++<12){apply(breaks);frame=requestAnimationFrame(refine);return;}
     const pages=Math.max(1,Math.ceil((lastBottom+PAGE.bottom)/(PAGE.height+PAGE.gap)));
     onLayout({pages,stable:!changed});
    };
    frame=requestAnimationFrame(refine);
   };
   const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paginate);};
   view.dom.addEventListener('load',schedule,true);window.addEventListener('resize',schedule);document.addEventListener('clinical-layout',schedule);document.fonts.addEventListener('loadingdone',schedule);schedule();
   return {update(v,old){if(!v.state.doc.eq(old.doc))schedule();},destroy(){dead=true;cancelAnimationFrame(frame);view.dom.removeEventListener('load',schedule,true);window.removeEventListener('resize',schedule);document.removeEventListener('clinical-layout',schedule);document.fonts.removeEventListener('loadingdone',schedule);}};
  }
 })];}
});
