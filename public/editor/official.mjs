// Protected letterhead; typography follows the user-approved Sarabun and size changes.
export function officialHeader() {
 const header=document.createElement('div');header.className='official-header';header.contentEditable='false';
 header.innerHTML='<img src="/media/logo/028-logo.png" alt="Clinic logo"><div><strong>ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี<br>Public Health Center 28 Krung Thon Buri</strong><br><span>สำนักอนามัย / Health Department<br>กรุงเทพมหานคร / Bangkok Metropolitan Administration</span></div>';
 return header;
}
export function officialFooter(page,count,date=new Date()) {
 const d=Common.formatDate(date,Common.ERA_CE),footer=document.createElement('div');footer.className='official-footer';footer.contentEditable='false';
 const texts=[`เอกสารฉบับนี้จะสมบูรณ์เมื่อมีตราประทับเท่านั้น / Valid only with an official stamp.\nพิมพ์เมื่อ / Printed on: ${d} (DD/MM/YYYY) · หน้า / Page: ${page} of ${count}`,'ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี 124/16 ถนนกรุงธนบุรี แขวงบางลำภูล่าง เขตคลองสาน กรุงเทพฯ 10600','Public Health Center 28 Krung Thon Buri 124/16 Krung Thon Buri Road, Khlong San, Bangkok 10600, Thailand','โทร / Tel: +66 (0) 96 797 1610, +66 (0) 96 323 1696 - อีเมล / Email: 028tbclinic@gmail.com'];
 for(const [i,text]of texts.entries()){const p=document.createElement(i===0?'strong':'div');p.textContent=text;footer.append(p);}
 const logo=document.createElement('img');logo.src='/media/logo/logo.png';logo.alt='Health Department logo';logo.className='footer-logo';footer.append(logo);return footer;
}
