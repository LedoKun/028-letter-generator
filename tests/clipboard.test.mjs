import test from 'node:test';
import assert from 'node:assert/strict';
import {Schema,Slice,Fragment} from '@tiptap/pm/model';
import {cleanClipboardSlice} from '../public/editor/nodes.mjs';

const schema=new Schema({nodes:{
 doc:{content:'block*'},text:{group:'inline'},
 paragraph:{group:'block',content:'inline*',attrs:{hidden:{default:false},prosePlaceholder:{default:false},writingSpace:{default:false}}},
 field:{inline:true,group:'inline',content:'inline*',attrs:{hidden:{default:false}}},
 phrase:{inline:true,group:'inline',content:'inline*',attrs:{hidden:{default:false}}},
 hardBreak:{inline:true,group:'inline'},
 sessionData:{group:'block',atom:true,attrs:{values:{default:{}}}},
 insertionPoint:{group:'block',atom:true}
}});
test('clipboard removes hidden values, session data, prompts and editor-only characters',()=>{
 const text='ภาษาไทย; A / ≤ 20\u200D';
 const paragraph=schema.node('paragraph',null,[schema.text('Name: '),schema.node('field',null,schema.text('\u200B'+text+'\uFEFF')),schema.node('hardBreak'),schema.text('Second line\uFFFC'),schema.node('phrase',{hidden:true},schema.text('HIDDEN RESULT'))]);
 const fragment=Fragment.fromArray([schema.node('sessionData',{values:{secret:'ARCHIVE VALUE'}}),paragraph,schema.node('paragraph',{prosePlaceholder:true}),schema.node('insertionPoint'),schema.node('paragraph',{prosePlaceholder:true,writingSpace:true})]);
 const original=new Slice(fragment,0,0),cleaned=cleanClipboardSlice(original);
 assert.equal(cleaned.content.childCount,2);
 assert.equal(cleaned.content.textBetween(0,cleaned.content.size,'\n\n',node=>node.type.name==='hardBreak'?'\n':''),'Name: '+text+'\nSecond line\n\n');
 assert.doesNotMatch(JSON.stringify(cleaned.toJSON()),/ARCHIVE VALUE|HIDDEN RESULT|sessionData|insertionPoint|200B|FEFF|FFFC/);
 assert.equal(original.content,fragment);
});
test('clipboard keeps partial-field slice depth valid after removing an empty field',()=>{
 const original=new Slice(Fragment.from(schema.node('paragraph',null,schema.node('field',null,schema.text('\u200B')))),2,2);
 const cleaned=cleanClipboardSlice(original);
 assert.equal(cleaned.content.firstChild.type.name,'paragraph');assert.equal(cleaned.openStart,1);assert.equal(cleaned.openEnd,1);assert.equal(cleaned.size,0);
});
