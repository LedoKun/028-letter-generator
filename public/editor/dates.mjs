import '../js/common.js';
export function parseClinicalDate(value) {
 let raw = String(value || '').trim();
 if (/^\d{8}$/.test(raw)) raw = Common.formatDateInputValue(raw);
 const iso = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
 const full = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 const partial = raw.match(/^(\d{1,2})\/(\d{4})$/);
 let year, month, day;
 if (iso) { year = Number(iso[1]); month = Number(iso[2]); day = iso[3] ? Number(iso[3]) : undefined; }
 else if (full) { year=Number(full[3]); month=Number(full[2]); day=Number(full[1]); }
 else if (partial) { year=Number(partial[2]); month=Number(partial[1]); }
 else if (/^\d{4}$/.test(raw)) year=Number(raw);
 else return null;
 if (!iso && year>=2300) year-=543;
 if (year<100 || year>2299 || (month!==undefined && (month<1 || month>12))) return null;
 if (day!==undefined) {
  const d=new Date(Date.UTC(year,month-1,day));
  if(d.getUTCFullYear()!==year || d.getUTCMonth()!==month-1 || d.getUTCDate()!==day)return null;
 }
 const precision=day!==undefined?'day':month!==undefined?'month':'year';
 return {year,month,day,precision,iso:String(year).padStart(4,'0')+(month!==undefined?`-${String(month).padStart(2,'0')}`:'')+(day!==undefined?`-${String(day).padStart(2,'0')}`:'')};
}
export function displayDate(value,language) {
 const d=parseClinicalDate(value); if(!d)return String(value||'');
 const y=d.year+(language==='th'?543:0);
 return (d.day!==undefined?`${String(d.day).padStart(2,'0')}/`:'')+(d.month!==undefined?`${String(d.month).padStart(2,'0')}/`:'')+y;
}
export function exactDate(value) { const d=parseClinicalDate(value);return d?.precision==='day'?d:null; }
const utc = d => Date.UTC(d.year,d.month-1,d.day);
export function calculateAge(dob,reference) {
 const d=exactDate(dob), r=exactDate(reference);if(!d||!r||utc(d)>utc(r))return null;
 return r.year-d.year-Number(r.month<d.month || (r.month===d.month && r.day<d.day));
}
export function addCalendarDays(value,days) {
 const d=exactDate(value);if(!d)return '';
 const date=new Date(utc(d));date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);
}
export function inclusiveDays(start,end) {
 const a=exactDate(start), b=exactDate(end);return a&&b&&utc(b)>=utc(a)?(utc(b)-utc(a))/86400000+1:null;
}
export function today() { return Common.formatDate(new Date(),Common.ERA_CE); }
