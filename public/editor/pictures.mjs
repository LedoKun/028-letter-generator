export const PICTURE_LIMITS={bytes:12*1024*1024,pixels:40_000_000,dimension:20000,caption:240};
export function validatePicture(bytes) {
 if(bytes.length>PICTURE_LIMITS.bytes)throw new Error('Choose a picture smaller than 12 MB.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let type,width,height;
 if(bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){
  if(String.fromCharCode(...bytes.slice(12,16))!=='IHDR')throw new Error('Invalid PNG picture.');
  type='image/png';width=view.getUint32(16);height=view.getUint32(20);
 }else if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216){
  type='image/jpeg';let offset=2;
  while(offset+4<=bytes.length){
   if(bytes[offset++]!==255)throw new Error('Invalid JPEG picture.');
   while(bytes[offset]===255)offset++;
   const marker=bytes[offset++];if(marker===217||marker===218)break;
   if(marker===1||(marker>=208&&marker<=215))continue;
   if(offset+2>bytes.length)break;
   const length=view.getUint16(offset);if(length<2||offset+length>bytes.length)throw new Error('Invalid JPEG picture.');
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
    if(length<8)throw new Error('Invalid JPEG dimensions.');height=view.getUint16(offset+3);width=view.getUint16(offset+5);break;
   }
   offset+=length;
  }
 }else throw new Error('Choose a PNG or JPEG picture.');
 if(!width||!height||width>PICTURE_LIMITS.dimension||height>PICTURE_LIMITS.dimension||width*height>PICTURE_LIMITS.pixels)throw new Error('Picture dimensions are invalid or exceed 40 megapixels.');
 return {type,width,height};
}
export async function readPicture(file) {
 if(file.size>PICTURE_LIMITS.bytes)throw new Error('Choose a picture smaller than 12 MB.');
 validatePicture(new Uint8Array(await file.arrayBuffer()));
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{
  if(bitmap.width*bitmap.height>PICTURE_LIMITS.pixels)throw new Error('Picture exceeds 40 megapixels.');
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  canvas.getContext('2d').drawImage(bitmap,0,0);
  // Re-encoding removes file metadata while preserving the decoded pixels and orientation.
  return {src:canvas.toDataURL('image/png'),naturalWidth:bitmap.width,naturalHeight:bitmap.height,width:100,alt:'Inserted picture',caption:''};
 }finally{bitmap.close();}
}
export function pictureWidthPercent(attrs){
 const maximum=Math.min(100,(233*72/25.4-80)/(180*72/25.4)*attrs.naturalWidth/attrs.naturalHeight*100);
 return Math.max(Math.min(10,maximum),Math.min(Number(attrs.width)||100,maximum));
}
