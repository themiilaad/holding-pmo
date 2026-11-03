export type ProjectStatus = 'نامشخص' | 'برنامه‌ریزی' | 'در حال اجرا' | 'متوقف' | 'تکمیل‌شده'
export type TaskStatus = 'شروع نشده' | 'در حال انجام' | 'انجام‌شده' | 'متوقف'
export type Role = 'مدیر سامانه' | 'مدیر PMO' | 'مدیر پروژه' | 'کارشناس' | 'مشاهده‌گر'

export interface Project {
  id: string
  code: string
  name: string
  category: string
  province: string
  managerId: string
  status: ProjectStatus
  description: string
  lastUpdate: string
  startDate: string
  archived?: boolean
}
export interface WbsNode {
  id: string
  projectId: string
  parentId: string | null
  title: string
  description: string
  deliverable: string
  acceptance: string
  weight: number
}
export interface Activity {
  id: string
  projectId: string
  wbsId: string
  title: string
  duration: number
  dependsOn: string[]
  progress: number
  ownerId: string
  milestone: boolean
  actualStart?: string
  actualFinish?: string
}
export interface PmoTask {
  id: string
  projectId: string
  wbsId: string
  title: string
  description: string
  ownerId: string
  collaboratorIds: string[]
  dueDate: string
  priority: 1 | 2 | 3
  status: TaskStatus
}
export interface CostItem {
  id: string
  projectId: string
  wbsId: string
  costCode: string
  title: string
  budget: number
  actual: number
}
export interface User {
  id: string
  name: string
  role: Role
}
export interface Audit {
  id: string
  at: string
  event: string
}
export interface Database {
  projects: Project[]
  wbs: WbsNode[]
  activities: Activity[]
  tasks: PmoTask[]
  costs: CostItem[]
  users: User[]
  audit: Audit[]
}
export const projectCategories = ['ایستگاه انرژی', 'سایت لجستیک', 'بازارچه و تجاری', 'حمل‌ونقل پاک', 'ساختمانی و خدماتی', 'سایر']
export const taskStatuses: TaskStatus[] = ['شروع نشده', 'در حال انجام', 'انجام‌شده', 'متوقف']
export const roles: Role[] = ['مدیر سامانه', 'مدیر PMO', 'مدیر پروژه', 'کارشناس', 'مشاهده‌گر']
export const sampleStart = '2026-11-07'
export const uid = () => 'id-' + Math.random().toString(36).slice(2, 10)

const projectTitles: Array<[string,string,string]> = [
  ['احداث ایستگاه‌های انرژی کرج','ایستگاه انرژی','البرز'],
  ['ایجاد شبکه حمل‌ونقل پاک کرج','حمل‌ونقل پاک','البرز'],
  ['فروش اتوبوس کرج','حمل‌ونقل پاک','البرز'],
  ['بندر خشک آپرین','سایت لجستیک','تهران'],
  ['احداث ایستگاه‌های انرژی مشهد','ایستگاه انرژی','خراسان رضوی'],
  ['ایجاد شبکه حمل‌ونقل پاک مشهد','حمل‌ونقل پاک','خراسان رضوی'],
  ['بازسازی مراکز اقامتی مشهد','ساختمانی و خدماتی','خراسان رضوی'],
  ['سایت لجستیک خواف','سایت لجستیک','خراسان رضوی'],
  ['احداث ایستگاه‌های انرژی اروند','ایستگاه انرژی','خوزستان'],
  ['ایجاد شبکه حمل‌ونقل پاک اروند','حمل‌ونقل پاک','خوزستان'],
  ['بازارچه پل آبادان','بازارچه و تجاری','خوزستان'],
  ['سایت لجستیک شلمچه','سایت لجستیک','خوزستان'],
  ['بازارچه شلمچه','بازارچه و تجاری','خوزستان'],
  ['سایت لجستیک ریمدان','سایت لجستیک','سیستان و بلوچستان'],
  ['ایجاد شبکه حمل‌ونقل پاک سنندج','حمل‌ونقل پاک','کردستان'],
  ['سایت لجستیک باشماق','سایت لجستیک','کردستان'],
  ['مرکز تجاری بانه','بازارچه و تجاری','کردستان'],
  ['واردات تلفن همراه مریوان','سایر','کردستان'],
  ['سایت لجستیک اینچه‌برون','سایت لجستیک','گلستان'],
  ['سایت سوارکاری بندر ترکمن','سایر','گلستان'],
  ['احداث ایستگاه‌های انرژی گنبدکاووس','ایستگاه انرژی','گلستان'],
  ['احداث ایستگاه‌های انرژی اراک','ایستگاه انرژی','مرکزی'],
  ['ایجاد شبکه حمل‌ونقل پاک اراک','حمل‌ونقل پاک','مرکزی'],
  ['احداث ایستگاه‌های انرژی تهران','ایستگاه انرژی','تهران'],
  ['ساختمان بوستان گفت‌وگو','ساختمانی و خدماتی','تهران'],
  ['سالن کنسرت','ساختمانی و خدماتی','تهران'],
  ['احداث ایستگاه‌های انرژی شیراز','ایستگاه انرژی','فارس'],
  ['راه‌اندازی شعبه استان فارس','ساختمانی و خدماتی','فارس'],
  ['احداث ایستگاه‌های انرژی اصفهان','ایستگاه انرژی','اصفهان'],
]
const wbsSeed: Array<[string,string|null,string,string]> = [
  ['w01',null,'زمین، مجوزها و تحویل کارگاه','تحویل زمین و مجوزهای موردنیاز'],
  ['w011','w01','تعیین و تأیید موقعیت','موقعیت مصوب'],
  ['w012','w01','تحویل زمین','صورت‌جلسه تحویل زمین'],
  ['w02',null,'مطالعات و مهندسی','مدارک طراحی تأییدشده'],
  ['w021','w02','سایت‌پلان و جانمایی','سایت‌پلان مصوب'],
  ['w022','w02','نقشه‌های اجرایی','نقشه‌های اجرایی تأییدشده'],
  ['w03',null,'زیرساخت و عملیات عمرانی','مجموعه کارهای عمرانی اجراشده'],
  ['w031','w03','آماده‌سازی و محوطه‌سازی','محوطه آماده و قابل بهره‌برداری'],
  ['w032','w03','فونداسیون و سازه','فونداسیون‌ها و سازه‌های اجراشده'],
  ['w04',null,'انشعابات و تأسیسات','شبکه‌های متصل و آزمایش‌شده'],
  ['w041','w04','برق و شبکه تغذیه','تجهیزات و تأسیسات برق'],
  ['w042','w04','آب و سایر انشعابات','انشعابات موردنیاز'],
  ['w05',null,'تأمین و نصب تجهیزات','تجهیزات نصب‌شده'],
  ['w051','w05','تأمین تجهیزات','تجهیزات خریداری و تحویل‌شده'],
  ['w052','w05','نصب و اتصال تجهیزات','تجهیزات نصب‌شده و متصل'],
  ['w06',null,'آزمایش، راه‌اندازی و تحویل','تحویل موقت و مدارک تکمیلی'],
  ['w061','w06','آزمایش و راه‌اندازی','صورت‌جلسات آزمایش'],
  ['w062','w06','تحویل و مستندات','مدارک و تحویل موقت'],
]
const activitySeed: Array<[string,string,string,number,string[],boolean]> = [
  ['a01','w011','تعیین و تأیید موقعیت',3,[],false],
  ['a02','w012','تحویل زمین و مدارک',2,['a01'],false],
  ['a03','w021','تهیه سایت‌پلان',4,['a01'],false],
  ['a04','w022','تهیه نقشه‌های اجرایی',5,['a03'],false],
  ['a05','w022','تأیید نقشه‌های اجرایی',0,['a04'],true],
  ['a06','w031','آماده‌سازی کارگاه',3,['a02','a05'],false],
  ['a07','w032','اجرای فونداسیون',6,['a06'],false],
  ['a08','w041','اجرای زیرساخت برق',5,['a06'],false],
  ['a09','w042','تکمیل سایر انشعابات',4,['a06'],false],
  ['a10','w051','تأمین تجهیزات',8,['a05'],false],
  ['a11','w052','نصب تجهیزات',4,['a07','a08','a09','a10'],false],
  ['a12','w061','آزمایش و راه‌اندازی',3,['a11'],false],
  ['a13','w062','تحویل موقت',0,['a12'],true],
]
export function seedDatabase(): Database {
  const projects: Project[] = projectTitles.map(([name,category,province],i)=>({
    id:'p'+String(i+1).padStart(3,'0'),
    code:'PRJ-'+String(i+1).padStart(3,'0'),
    name,category,province,managerId:'',status:'نامشخص',
    description:'',lastUpdate:'',startDate:sampleStart,
  }))
  const wbs: WbsNode[] = wbsSeed.map(([id,parentId,title,deliverable])=>({
    id,projectId:'p009',parentId,title,description:'نمونه آزمایشی؛ نیازمند تأیید محدوده واقعی قرارداد',
    deliverable,acceptance:'مطابق اسناد مصوب و تأیید دستگاه نظارت (در نمونه صرفاً نمایشی)',weight:1,
  }))
  const activities: Activity[] = activitySeed.map(([id,wbsId,title,duration,dependsOn,milestone])=>({
    id,projectId:'p009',wbsId,title,duration,dependsOn,milestone,progress:0,ownerId:'',
  }))
  const users: User[] = [
    {id:'u1',name:'آقای بلوچ',role:'مدیر PMO'},
    {id:'u2',name:'آقای حسینی',role:'مدیر پروژه'},
    {id:'u3',name:'آقای احمدی',role:'کارشناس'},
    {id:'u4',name:'خانم نعمتی',role:'مدیر پروژه'},
    {id:'u5',name:'مدیریت ارشد (نمونه)',role:'مشاهده‌گر'},
  ]
  const tasks: PmoTask[] = [
    {id:'t1',projectId:'p009',wbsId:'w011',title:'تعیین محل ایستگاه و تعیین تکلیف قرارداد',description:'تکلیف ثبت‌شده در صورت‌جلسه؛ هنوز انجام‌شدن آن تأیید نشده است.',ownerId:'u2',collaboratorIds:['u4'],dueDate:'',priority:1,status:'شروع نشده'},
    {id:'t2',projectId:'p009',wbsId:'w022',title:'تهیه نقشه‌های اجرایی و ارائه سایت‌پلان',description:'ارجاع اولیه به خانم نعمتی',ownerId:'u4',collaboratorIds:[],dueDate:'2026-11-05',priority:1,status:'شروع نشده'},
    {id:'t3',projectId:'p009',wbsId:'w012',title:'پیگیری قرارداد با منطقه آزاد اروند',description:'براساس صورت‌جلسه ۱۰ آبان',ownerId:'u2',collaboratorIds:[],dueDate:'',priority:2,status:'شروع نشده'},
    {id:'t4',projectId:'p008',wbsId:'',title:'جلسه با شرکت راه‌آهن درباره وضعیت و تأخیرها',description:'تکلیف مشترک',ownerId:'u1',collaboratorIds:['u3'],dueDate:'2026-11-05',priority:1,status:'شروع نشده'},
    {id:'t5',projectId:'p014',wbsId:'',title:'معرفی مشاور پروژه به شرکت‌های تابعه',description:'مصوبه جلسه ۱۰ آبان',ownerId:'u4',collaboratorIds:[],dueDate:'2026-11-04',priority:1,status:'شروع نشده'},
  ]
  const costs: CostItem[] = [
    {id:'c1',projectId:'p009',wbsId:'w032',costCode:'C-01',title:'مصالح و بتن (نمونه)',budget:420,actual:0},
    {id:'c2',projectId:'p009',wbsId:'w032',costCode:'C-02',title:'دستمزد اجرا (نمونه)',budget:180,actual:0},
    {id:'c3',projectId:'p009',wbsId:'w041',costCode:'C-03',title:'برق و کابل (نمونه)',budget:320,actual:0},
    {id:'c4',projectId:'p009',wbsId:'w051',costCode:'C-04',title:'تجهیزات (نمونه)',budget:890,actual:0},
  ]
  return {projects,wbs,activities,tasks,costs,users,audit:[{id:'init',at:new Date().toISOString(),event:'ایجاد داده اولیه آزمایشی؛ اطلاعات عملیاتی واقعی وارد نشده است'}]}
}
const KEY='holding-pmo-demo-v1'
export function loadDatabase():Database {
  try {
    const raw=localStorage.getItem(KEY)
    if(raw){
      const parsed:unknown=JSON.parse(raw)
      if(isDatabase(parsed))return parsed
    }
  } catch { /* ignore invalid local backup */ }
  return seedDatabase()
}
export function isDatabase(value:unknown):value is Database {
  if(!value || typeof value!=='object')return false
  const object=value as Record<string,unknown>
  return ['projects','wbs','activities','tasks','costs','users','audit'].every(key=>Array.isArray(object[key]))
}
export function saveDatabase(db:Database):void {localStorage.setItem(KEY,JSON.stringify(db))}
export function dateFa(iso?:string):string {
  if(!iso)return 'تعیین نشده'
  try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso+'T12:00:00Z'))}
  catch{return iso}
}
function addDays(start:Date,days:number):Date {const d=new Date(start);d.setUTCDate(d.getUTCDate()+days);return d}
export function dateAtWorkOffset(iso:string,offset:number):string {
  let date=new Date((iso||sampleStart)+'T12:00:00Z')
  while(date.getUTCDay()===5)date=addDays(date,1)
  for(let i=0;i<Math.max(0,offset);i++){date=addDays(date,1);while(date.getUTCDay()===5)date=addDays(date,1)}
  return date.toISOString().slice(0,10)
}
export type Scheduled = Activity & {startOffset:number;endOffset:number;start:string;finish:string}
export function calculateSchedule(activities:Activity[],iso:string):{rows:Scheduled[],errors:string[]} {
  const byId=new Map(activities.map(a=>[a.id,a]))
  const cache=new Map<string,Scheduled>()
  const active=new Set<string>()
  const errors=new Set<string>()
  const visit=(id:string):Scheduled|null=>{
    const existing=cache.get(id);if(existing)return existing
    const item=byId.get(id);if(!item){errors.add('پیش‌نیاز نامعتبر: '+id);return null}
    if(active.has(id)){errors.add('دور در شبکه وابستگی فعالیت‌ها');return null}
    active.add(id)
    let begin=0
    for(const dep of item.dependsOn){
      if(dep===id){errors.add('فعالیت نمی‌تواند پیش‌نیاز خودش باشد: '+item.title);continue}
      const earlier=visit(dep)
      if(earlier)begin=Math.max(begin,earlier.endOffset+1)
    }
    active.delete(id)
    const finishOffset=begin+Math.max(0,item.duration-1)
    const row={...item,startOffset:begin,endOffset:finishOffset,start:dateAtWorkOffset(iso,begin),finish:dateAtWorkOffset(iso,finishOffset)}
    cache.set(id,row)
    return row
  }
  activities.forEach(a=>visit(a.id))
  return {rows:activities.map(a=>cache.get(a.id)).filter((x):x is Scheduled=>!!x),errors:[...errors]}
}
export function wbsCodes(nodes:WbsNode[]):Record<string,string>{
  const codes:Record<string,string>={}
  function walk(parent:string|null,prefix=''){
    const children=nodes.filter(x=>x.parentId===parent)
    children.forEach((n,i)=>{
      const code=(prefix?prefix+'.':'')+String(i+1).padStart(2,'0')
      codes[n.id]=code
      walk(n.id,code)
    })
  }
  walk(null)
  return codes
}
export function downloadData(name:string,content:string,type='application/json;charset=utf-8') {
  const blob=new Blob([content],{type})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=name;a.click()
  setTimeout(()=>URL.revokeObjectURL(url),300)
}
