import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePicture,pictureWidthPercent,PICTURE_LIMITS} from '../public/editor/pictures.mjs';
test('accepts local PNG metadata before decoding',()=>{const bytes=readFileSync('public/media/favicon/android-chrome-192x192.png');assert.deepEqual(validatePicture(bytes),{type:'image/png',width:192,height:192});});
test('rejects SVG disguised as PNG and truncated JPEG data',()=>{assert.throws(()=>validatePicture(Buffer.from('<svg><script>alert(1)</script></svg>')),/PNG or JPEG/);assert.throws(()=>validatePicture(Uint8Array.of(255,216,255,192,0,20)),/Invalid JPEG/);});
test('rejects excessive pixel dimensions before browser allocation',()=>{const bytes=Buffer.from(readFileSync('public/media/favicon/android-chrome-192x192.png'));bytes.writeUInt32BE(30000,16);assert.throws(()=>validatePicture(bytes),/dimensions/);});
test('rejects oversized files without decoding',()=>{assert.throws(()=>validatePicture(new Uint8Array(PICTURE_LIMITS.bytes+1)),/12 MB/);});
test('reads JPEG dimensions from supported SOF records',()=>{const bytes=Uint8Array.of(255,216,255,192,0,8,8,0,100,0,200,1);assert.deepEqual(validatePicture(bytes),{type:'image/jpeg',width:200,height:100});});
test('proportional width respects A4 height and width bounds',()=>{
 assert.equal(pictureWidthPercent({naturalWidth:1000,naturalHeight:1000,width:50}),50);
 const percent=pictureWidthPercent({naturalWidth:800,naturalHeight:2400,width:100});assert.ok(percent<50);assert.ok(180*percent/100*3<=233-80*25.4/72+0.001);
 assert.equal(pictureWidthPercent({naturalWidth:2400,naturalHeight:800,width:150}),100);
});
