import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, BriefcaseBusiness, CalendarDays,
  CheckCircle2, ChevronDown, ChevronLeft, Clock3, Download, Edit3, FileText,
  FolderTree, GitBranch, LayoutDashboard, ListChecks, LockKeyhole, Menu,
  Network, Plus, RotateCcw, Search, Settings2, ShieldCheck, Trash2, Users,
  Wallet, X
} from 'lucide-react'
import {
  calculateSchedule, dateFa, dateAtWorkOffset, downloadData, isDatabase,
  loadDatabase, projectCategories, roles, saveDatabase, seedDatabase, uid,
  wbsCodes, taskStatuses,
  type Database, type Project, type ProjectStatus, type WbsNode,
  type Activity as ScheduleActivity, type PmoTask, type CostItem, type TaskStatus
} from './model'

type Page = 'dashboard' | 'projects' | 'wbs' | 'gantt' | 'network' | 'tasks' | 'costs' | 'access' | 'settings'
type Kind = 'project' | 'wbs' | 'activity' | 'task' | 'cost'
type Editor = {kind: Kind; id?: string} | null

const pages: {id:Page;name:string;icon:typeof LayoutDashboard;section:string}[] = [
  {id:'dashboard',name:'داشبورد مدیریتی',icon:LayoutDashboard,section:'مدیریت'},
  {id:'projects',name:'سبد کلان‌پروژه‌ها',icon:BriefcaseBusiness,section:'مدیریت'},
  {id:'wbs',name:'ساختار شکست کار',icon:FolderTree,section:'برنامه‌ریزی'},
  {id:'gantt',name:'گانت و زمان‌بندی',icon:CalendarDays,section:'برنامه‌ریزی'},
  {id:'network',name:'شبکه وابستگی‌ها',icon:Network,section:'برنامه‌ریزی'},
  {id:'tasks',name:'مدیریت تکالیف',icon:ListChecks,section:'اجرا و کنترل'},
  {id:'costs',name:'ساختار هزینه CBS',icon:Wallet,section:'اجرا و کنترل'},
  {id:'access',name:'کاربران و دسترسی',icon:Users,section:'مدیریت سامانه'},
  {id:'settings',name:'تنظیمات و داده‌ها',icon:Settings2,section:'مدیریت سامانه'},
]
const projectStates:ProjectStatus[] = ['نامشخص','برنامه‌ریزی','در حال اجرا','متوقف','تکمیل‌شده']
const n=(v:number)=>v.toLocaleString('fa-IR')
const validNumber=(v:string|undefined)=>Math.max(0,Number(v||0)||0)
const statusTone=(v:string)=> v==='انجام‌شده'||v==='تکمیل‌شده'?'success':v==='متوقف'?'danger':v==='در حال اجرا'||v==='در حال انجام'?'teal':v==='برنامه‌ریزی'?'blue':'neutral'

function Badge({children,tone}:{children:ReactNode;tone?:string}){return <span className={'badge badge-'+(tone||statusTone(String(children)))}>{children}</span>}
function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={'card '+className}>{children}</section>}
function Empty({title,detail}:{title:string;detail?:string}){return <div className="empty"><FolderTree size={34}/><strong>{title}</strong>{detail&&<p>{detail}</p>}</div>}
function Field({name,children}:{name:string;children:ReactNode}){return <label className="field"><span>{name}</span>{children}</label>}
function FieldHelp({children}:{children:ReactNode}){return <small className="hint">{children}</small>}

export default function App(){
  const [db,setDb]=useState<Database>(loadDatabase)
  const [page,setPage]=useState<Page>('dashboard')
  const [projectId,setProjectId]=useState('p009')
  const [query,setQuery]=useState('')
  const [statusFilter,setStatusFilter]=useState('همه')
  const [editor,setEditor]=useState<Editor>(null)
  const [draft,setDraft]=useState<Record<string,string>>({})
  const [deps,setDeps]=useState<string[]>([])
  const [collabs,setCollabs]=useState<string[]>([])
  const [drawer,setDrawer]=useState(false)
  const [toast,setToast]=useState('')
  const [expanded,setExpanded]=useState<string[]>([])
  const projects=db.projects.filter(p=>!p.archived)
  const project=projects.find(p=>p.id===projectId)||projects[0]
  const wbs=db.wbs.filter(w=>w.projectId===project?.id)
  const activities=db.activities.filter(a=>a.projectId===project?.id)
  const costs=db.costs.filter(c=>c.projectId===project?.id)
  const schedule=useMemo(()=>calculateSchedule(activities,project?.startDate||'2026-11-07'),[activities,project?.startDate])
  const codes=wbsCodes(wbs)
  const projectName=(id:string)=>db.projects.find(p=>p.id===id)?.name||'پروژه نامشخص'
  const userName=(id:string)=>db.users.find(u=>u.id===id)?.name||'تعیین نشده'
  const nav=(p:Page)=>{setPage(p);setDrawer(false);setQuery('');setStatusFilter('همه')}
  useEffect(()=>saveDatabase(db),[db])
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer)},[toast])
  function mutate(label:string,fn:(prev:Database)=>Database){
    setDb(prev=>{const next=fn(prev);return {...next,audit:[{id:uid(),at:new Date().toISOString(),event:label},...prev.audit].slice(0,100)}})
    setToast('تغییر در حافظه همین مرورگر ذخیره شد.')
  }
  const isoToday=new Date().toISOString().slice(0,10)
  const overdue=db.tasks.filter(t=>t.dueDate&&t.dueDate<isoToday&&t.status!=='انجام‌شده')
  const done=db.tasks.filter(t=>t.status==='انجام‌شده').length
  const categories=Object.entries(projects.reduce<Record<string,number>>((r,p)=>({...r,[p.category]:(r[p.category]||0)+1}),{}))
  const currentTitle=pages.find(p=>p.id===page)?.name||'داشبورد'
  function open(kind:Kind,id?:string){
    let old:Record<string,unknown>|undefined
    if(kind==='project')old=db.projects.find(x=>x.id===id) as unknown as Record<string,unknown>|undefined
    if(kind==='wbs')old=db.wbs.find(x=>x.id===id) as unknown as Record<string,unknown>|undefined
    if(kind==='activity')old=db.activities.find(x=>x.id===id) as unknown as Record<string,unknown>|undefined
    if(kind==='task')old=db.tasks.find(x=>x.id===id) as unknown as Record<string,unknown>|undefined
    if(kind==='cost')old=db.costs.find(x=>x.id===id) as unknown as Record<string,unknown>|undefined
    const values:Record<string,string>={projectId:project?.id||''}
    if(old)for(const [k,v] of Object.entries(old))if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')values[k]=String(v)
    setDraft(values)
    setDeps(kind==='activity'&&old&&Array.isArray(old.dependsOn)?old.dependsOn as string[]:[])
    setCollabs(kind==='task'&&old&&Array.isArray(old.collaboratorIds)?old.collaboratorIds as string[]:[])
    setEditor({kind,id})
  }
  const change=(key:string,value:string)=>setDraft(prev=>({...prev,[key]:value}))
  function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    if(!editor)return
    const kind=editor.kind,id=editor.id||uid()
    const title=(draft.name||draft.title||'').trim()
    if(!title){setToast('عنوان الزامی است.');return}
    const pid=draft.projectId||project?.id||''
    if(kind==='project'){
      const item:Project={id,code:draft.code||'PRJ-'+String(db.projects.length+1).padStart(3,'0'),name:title,category:draft.category||'سایر',province:draft.province||'',managerId:draft.managerId||'',status:(draft.status||'نامشخص') as ProjectStatus,description:draft.description||'',lastUpdate:draft.lastUpdate||'',startDate:draft.startDate||'2026-11-07',archived:false}
      mutate('ذخیره پروژه '+title,old=>({...old,projects:editor.id?old.projects.map(x=>x.id===id?item:x):[...old.projects,item]}))
      setProjectId(id)
    }else if(kind==='wbs'){
      const parentId=draft.parentId||null
      let cursor=parentId
      const seen=new Set<string>()
      while(cursor){if(cursor===id||seen.has(cursor)){setToast('ارتباط والد موجب ایجاد دور می‌شود.');return}seen.add(cursor);cursor=db.wbs.find(w=>w.id===cursor)?.parentId||null}
      const item:WbsNode={id,projectId:pid,parentId,title,description:draft.description||'',deliverable:draft.deliverable||'',acceptance:draft.acceptance||'',weight:validNumber(draft.weight)||1}
      mutate('ذخیره WBS '+title,old=>({...old,wbs:editor.id?old.wbs.map(x=>x.id===id?item:x):[...old.wbs,item]}))
    }else if(kind==='activity'){
      const item:ScheduleActivity={id,projectId:pid,wbsId:draft.wbsId||'',title,duration:Math.round(validNumber(draft.duration)),dependsOn:deps,progress:Math.min(100,validNumber(draft.progress)),ownerId:draft.ownerId||'',milestone:draft.milestone==='true'}
      const prospective=editor.id?db.activities.map(a=>a.id===id?item:a):[...db.activities,item]
      const errors=calculateSchedule(prospective.filter(a=>a.projectId===pid),project?.startDate||'2026-11-07').errors
      if(errors.length){setToast(errors.join('؛ '));return}
      mutate('ذخیره فعالیت '+title,old=>({...old,activities:prospective}))
    }else if(kind==='task'){
      const item:PmoTask={id,projectId:pid,wbsId:draft.wbsId||'',title,description:draft.description||'',ownerId:draft.ownerId||'',collaboratorIds:collabs.filter(u=>u!==draft.ownerId),dueDate:draft.dueDate||'',priority:Number(draft.priority||2) as 1|2|3,status:(draft.status||'شروع نشده') as TaskStatus}
      mutate('ذخیره تکلیف '+title,old=>({...old,tasks:editor.id?old.tasks.map(t=>t.id===id?item:t):[...old.tasks,item]}))
    }else if(kind==='cost'){
      const item:CostItem={id,projectId:pid,wbsId:draft.wbsId||'',costCode:draft.costCode||'C-'+String(db.costs.length+1).padStart(2,'0'),title,budget:validNumber(draft.budget),actual:validNumber(draft.actual)}
      mutate('ذخیره CBS '+title,old=>({...old,costs:editor.id?old.costs.map(c=>c.id===id?item:c):[...old.costs,item]}))
    }
    setEditor(null)
  }
  function erase(kind:Kind,id:string){
    if(!window.confirm('حذف این رکورد تأیید شود؟'))return
    const names:{[K in Kind]:keyof Database}={project:'projects',wbs:'wbs',activity:'activities',task:'tasks',cost:'costs'}
    if(kind==='project'&&(db.tasks.some(x=>x.projectId===id)||db.wbs.some(x=>x.projectId===id)||db.activities.some(x=>x.projectId===id))){setToast('این پروژه اطلاعات وابسته دارد؛ حذف مجاز نیست.');return}
    if(kind==='wbs'&&(db.wbs.some(x=>x.parentId===id)||db.activities.some(x=>x.wbsId===id)||db.costs.some(x=>x.wbsId===id))){setToast('ابتدا وابستگی‌های این بسته کاری را برطرف کنید.');return}
    if(kind==='activity'&&db.activities.some(x=>x.dependsOn.includes(id))){setToast('این فعالیت پیش‌نیاز فعالیت دیگری است.');return}
    const key=names[kind]
    mutate('حذف رکورد '+id,old=>({...old,[key]:(old[key] as {id:string}[]).filter(x=>x.id!==id)}))
  }
  function tree(parent:string|null,depth:number):ReactNode{
    return wbs.filter(w=>w.parentId===parent).map(w=>{
      const children=wbs.some(x=>x.parentId===w.id)
      const collapsed=expanded.includes(w.id)
      const related=activities.filter(a=>a.wbsId===w.id)
      const progress=related.length?Math.round(related.reduce((s,a)=>s+a.progress,0)/related.length):0
      return <div key={w.id}>
        <div className="tree-row" style={{paddingRight:(depth*22+12)+'px'}}>
          <button className="fold" onClick={()=>setExpanded(v=>v.includes(w.id)?v.filter(x=>x!==w.id):[...v,w.id])} disabled={!children}>{children?(collapsed?<ChevronLeft size={16}/>:<ChevronDown size={16}/>):<span className="small-dot"/>}</button>
          <span className="code" dir="ltr">{codes[w.id]}</span>
          <div className="tree-label"><b>{w.title}</b><small>{w.deliverable||'اقلام قابل تحویل تعیین نشده'}</small></div>
          <span className="tree-progress"><span style={{width:progress+'%'}}/></span>
          <button className="icon-button" title="ویرایش" onClick={()=>open('wbs',w.id)}><Edit3 size={15}/></button>
          <button className="icon-button danger" title="حذف" onClick={()=>erase('wbs',w.id)}><Trash2 size={15}/></button>
        </div>
        {children&&!collapsed&&tree(w.id,depth+1)}
      </div>
    })
  }
  const scopedPages:Page[]=['wbs','gantt','network','costs']
  const filteredProjects=projects.filter(p=>(statusFilter==='همه'||statusFilter===p.status)&&[p.name,p.code,p.province].join(' ').includes(query))
  const filteredTasks=db.tasks.filter(t=>(statusFilter==='همه'||statusFilter===t.status)&&[t.title,projectName(t.projectId),userName(t.ownerId)].join(' ').includes(query))
  const budget=costs.reduce((s,c)=>s+c.budget,0),actual=costs.reduce((s,c)=>s+c.actual,0)
  const ganttRows=schedule.rows
  const ganttLength=Math.max(32,...ganttRows.map(r=>r.endOffset+5))
  const goToExample=(target:Page)=>{setProjectId('p009');nav(target)}
  return <div className="app" dir="rtl">
    <aside className={'sidebar '+(drawer?'sidebar-open':'')}>
      <div className="brand"><span className="brand-mark"><GitBranch size={24}/></span><div><strong>CONTROL<span>HUB</span></strong><small>مدیریت پروژه‌های هلدینگ</small></div><button className="icon-button mobile-only" onClick={()=>setDrawer(false)}><X size={20}/></button></div>
      <div className="workspace"><span className="workspace-icon"><BriefcaseBusiness size={20}/></span><div><b>دفتر مدیریت پروژه</b><small>محیط آزمایشی</small></div></div>
      <nav className="navigation">{pages.map((p,i)=><div key={p.id}>{(i===0||p.section!==pages[i-1].section)&&<span className="nav-section">{p.section}</span>}<button className={'nav-item '+(page===p.id?'nav-active':'')} onClick={()=>nav(p.id)}><p.icon size={18}/><span>{p.name}</span></button></div>)}</nav>
      <div className="side-foot"><LockKeyhole size={19}/><div><b>حالت Demo</b><small>فاقد سرور احراز هویت</small></div></div>
    </aside>
    {drawer&&<button className="backdrop" aria-label="بستن منو" onClick={()=>setDrawer(false)}/>}
    <main className="main">
      <header className="topbar"><button className="icon-button mobile-only" onClick={()=>setDrawer(true)}><Menu size={22}/></button><span className="breadcrumb">دفتر مدیریت پروژه <ChevronLeft size={15}/> <b>{currentTitle}</b></span><div className="top-actions"><Badge tone="blue">نسخه ۰.۱ آزمایشی</Badge><span className="avatar">PM</span></div></header>
      <div className="container">
        <div className="warning"><AlertTriangle size={18}/><span><b>نسخه نمونه و بدون ورود:</b> هیچ نام کاربری یا رمز پیش‌فرضی وجود ندارد. تغییرات فقط در مرورگر شما ذخیره می‌شوند؛ اطلاعات محرمانه واقعی وارد نکنید.</span></div>
        <div className="page-title"><div><small>PROJECT MANAGEMENT OFFICE</small><h1>{currentTitle}</h1><p>{page==='dashboard'?'نمای یکپارچه برای تصمیم‌گیری و کنترل پروژه‌ها':page==='projects'?'فهرست کلان‌پروژه‌ها و اطلاعات پایه، بدون جعل وضعیت اجرا':page==='wbs'?'اقلام قابل تحویل، کدگذاری سلسله‌مراتبی و دیکشنری WBS':page==='gantt'?'زمان‌بندی محاسباتی با روابط پایان به شروع':page==='network'?'نمایش پیش‌نیازهای فعالیت‌های ثبت‌شده':page==='tasks'?'یک تکلیف با مسئول اصلی و همکاران متعدد':page==='costs'?'ارتباط سرفصل هزینه با بسته‌های کاری WBS':page==='access'?'نقش‌های پیشنهادی و محدودیت‌های امنیتی نسخه آزمایشی':'پشتیبان‌گیری و مدیریت داده‌های نمونه'}</p></div><div className="title-actions">{page==='projects'&&<button className="btn primary" onClick={()=>open('project')}><Plus size={17}/> پروژه جدید</button>}{page==='wbs'&&<button className="btn primary" onClick={()=>open('wbs')}><Plus size={17}/> بسته کاری جدید</button>}{page==='gantt'&&<button className="btn primary" onClick={()=>open('activity')}><Plus size={17}/> فعالیت جدید</button>}{page==='tasks'&&<button className="btn primary" onClick={()=>open('task')}><Plus size={17}/> تکلیف جدید</button>}{page==='costs'&&<button className="btn primary" onClick={()=>open('cost')}><Plus size={17}/> سرفصل هزینه</button>}</div></div>
        {scopedPages.includes(page)&&<div className="project-select"><span>پروژه انتخاب‌شده</span><select value={project?.id||''} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><span className="project-code" dir="ltr">{project?.code}</span></div>}
        {page==='dashboard'&&<>
          <div className="metrics">
            <Card className="metric"><span className="metric-icon blue"><BriefcaseBusiness size={22}/></span><div><small>کلان‌پروژه‌ها</small><strong>{n(projects.length)}</strong><span>ثبت‌شده در فهرست نمونه</span></div></Card>
            <Card className="metric"><span className="metric-icon purple"><ListChecks size={22}/></span><div><small>تکالیف ثبت‌شده</small><strong>{n(db.tasks.length)}</strong><span>نمونه نمایشی، نه ۵۷ تکلیف واقعی</span></div></Card>
            <Card className="metric"><span className="metric-icon amber"><Clock3 size={22}/></span><div><small>سررسید گذشته</small><strong>{n(overdue.length)}</strong><span>با تاریخ میلادی دستگاه شما</span></div></Card>
            <Card className="metric"><span className="metric-icon green"><CheckCircle2 size={22}/></span><div><small>تکالیف انجام‌شده</small><strong>{n(done)}</strong><span>براساس ثبت نسخه آزمایشی</span></div></Card>
          </div>
          <div className="two-panels">
            <Card><div className="section-heading"><div><h2>ترکیب سبد کلان‌پروژه‌ها</h2><p>دسته‌بندی پروژه‌های ثبت‌شده</p></div><button className="text-button" onClick={()=>nav('projects')}>مشاهده همه <ArrowLeft size={15}/></button></div><div className="category-chart">{categories.map(([name,count],i)=><div className="category-row" key={name}><span className={'category-dot dot-'+i%6}/><span className="category-label">{name}</span><div className="meter"><span style={{width:100*count/Math.max(1,projects.length)+'%'}}/></div><b>{n(count)}</b></div>)}</div></Card>
            <Card><div className="section-heading"><div><h2>آخرین تکالیف</h2><p>نمونه عملیاتی، وضعیت‌ها قابل تغییر هستند</p></div><button className="text-button" onClick={()=>nav('tasks')}>همه تکالیف <ArrowLeft size={15}/></button></div><div className="recent-tasks">{db.tasks.slice(0,5).map(t=><div key={t.id} className="recent-task"><div><b>{t.title}</b><small>{projectName(t.projectId)}</small></div><Badge>{t.status}</Badge></div>)}</div></Card>
          </div>
          <Card className="featured"><div><span className="eyebrow">DEMO PROJECT · EGA</span><h2>ایستگاه انرژی اروند</h2><p>این پروژه برای آزمایش WBS درختی، نمودار گانت محاسباتی، شبکه پیش‌نیازی و اتصال به CBS وارد شده است. مدت‌ها و هزینه‌ها صرفاً آزمایشی‌اند.</p><div className="featured-actions"><button className="btn light" onClick={()=>goToExample('wbs')}>مشاهده WBS <ArrowLeft size={16}/></button><button className="btn ghost-light" onClick={()=>goToExample('gantt')}>گانت پروژه</button></div></div><GitBranch className="featured-symbol" size={180} strokeWidth={0.8}/></Card>
        </>}
        {page==='projects'&&<Card className="table-card"><div className="table-toolbar"><label className="search"><Search size={18}/><input placeholder="جست‌وجوی نام پروژه، استان یا کد…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>همه</option>{projectStates.map(s=><option key={s}>{s}</option>)}</select><span className="result-label">{n(filteredProjects.length)} پروژه</span></div><div className="table-scroll"><table><thead><tr><th>کد پروژه</th><th>عنوان کلان‌پروژه</th><th>دسته</th><th>استان</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{filteredProjects.map(p=><tr key={p.id}><td dir="ltr" className="mono">{p.code}</td><td><button className="link-strong" onClick={()=>{setProjectId(p.id);nav('wbs')}}>{p.name}</button></td><td>{p.category}</td><td>{p.province||'—'}</td><td><Badge>{p.status}</Badge></td><td><div className="actions"><button className="icon-button" title="ویرایش" onClick={()=>open('project',p.id)}><Edit3 size={16}/></button><button className="icon-button" title="ساختار شکست" onClick={()=>{setProjectId(p.id);nav('wbs')}}><FolderTree size={16}/></button></div></td></tr>)}</tbody></table></div></Card>}
        {page==='wbs'&&<><div className="summary-strip"><span><b>{n(wbs.length)}</b> عنصر WBS</span><span><b>{n(wbs.filter(x=>!x.parentId).length)}</b> بسته سطح اول</span><span><b>{n(activities.length)}</b> فعالیت مرتبط</span><Badge tone="blue">تحویل‌دادنی‌محور</Badge></div>{wbs.length?<div className="two-panels wbs-panels"><Card><div className="section-heading"><h2>ساختار درختی پروژه</h2><span className="muted">ویرایش و افزودن زیرمجموعه امکان‌پذیر است</span></div><div className="tree">{tree(null,0)}</div></Card><Card><div className="section-heading"><h2>دیکشنری WBS</h2><span className="muted">تعریف خروجی و معیار پذیرش</span></div><div className="dictionary">{wbs.filter(w=>!w.parentId).map(w=><div key={w.id} className="dictionary-item"><span className="code" dir="ltr">{codes[w.id]}</span><div><b>{w.title}</b><p>{w.deliverable||'خروجی ثبت نشده'}</p><small>پذیرش: {w.acceptance||'تعریف نشده'}</small></div></div>)}</div></Card></div>:<Card><Empty title="برای این پروژه WBS تعریف نشده است" detail="از دکمه بسته کاری جدید استفاده کنید."/></Card>}</>}
        {page==='gantt'&&<><div className="summary-strip"><span><b>{n(activities.length)}</b> فعالیت</span><span><b>{n(activities.filter(x=>x.milestone).length)}</b> نقطه عطف</span><span>تاریخ نمونه شروع: <b>{dateFa(project?.startDate)}</b></span><span>پایان محاسبه‌شده: <b>{ganttRows.length?dateFa(dateAtWorkOffset(project.startDate,Math.max(...ganttRows.map(r=>r.endOffset)))):'—'}</b></span></div>{schedule.errors.length>0&&<div className="warning"><AlertTriangle size={17}/>{schedule.errors.join('؛ ')}</div>}<Card><div className="section-heading"><div><h2>گانت فعالیت‌ها</h2><p>تقویم نمونه: شنبه تا پنجشنبه کاری، جمعه تعطیل؛ رابطه پایان به شروع FS</p></div><Badge tone="blue">محاسبه پویا</Badge></div>{ganttRows.length?<div className="gantt-outer"><div className="gantt-title-col"><div className="gantt-header">فعالیت و پیشرفت</div>{ganttRows.map(a=><div className="gantt-name" key={a.id}><div><b>{a.title}</b><small>{dateFa(a.start)} تا {dateFa(a.finish)}</small></div><button className="icon-button" onClick={()=>open('activity',a.id)} title="ویرایش"><Edit3 size={14}/></button></div>)}</div><div className="gantt-chart"><div style={{width:ganttLength*29}}><div className="gantt-header gantt-header-days">{Array.from({length:ganttLength},(_,i)=><span key={i} title={dateFa(dateAtWorkOffset(project.startDate,i))}>{n(i+1)}</span>)}</div>{ganttRows.map(a=><div className="gantt-row" key={a.id}><div className={'gantt-bar '+(a.milestone?'milestone':'')} style={{right:(a.startOffset*29)+'px',width:a.milestone?'16px':(Math.max(1,a.duration)*29-4)+'px'}} title={a.title+' | '+dateFa(a.start)+' تا '+dateFa(a.finish)}>{a.milestone?'◆':<><span className="gantt-complete" style={{width:a.progress+'%'}}/><small>{a.progress? n(a.progress)+'٪':''}</small></>}</div></div>)}</div></div></div>:<Empty title="هنوز فعالیتی برای این پروژه ثبت نشده است"/>}</Card>{ganttRows.length>0&&<Card className="table-card"><div className="section-heading"><h2>جدول فعالیت‌ها</h2><span className="muted">زمان‌بندی از وابستگی‌ها محاسبه می‌شود</span></div><div className="table-scroll"><table><thead><tr><th>عنوان فعالیت</th><th>مدت</th><th>پیش‌نیاز</th><th>شروع</th><th>پایان</th><th>پیشرفت</th><th></th></tr></thead><tbody>{ganttRows.map(a=><tr key={a.id}><td className="strong">{a.title}</td><td>{a.milestone?'نقطه عطف':n(a.duration)+' روز'}</td><td>{a.dependsOn.map(id=>activities.find(z=>z.id===id)?.title||id).join('، ')||'—'}</td><td>{dateFa(a.start)}</td><td>{dateFa(a.finish)}</td><td>{n(a.progress)}٪</td><td><button className="icon-button" onClick={()=>open('activity',a.id)}><Edit3 size={16}/></button></td></tr>)}</tbody></table></div></Card>}</>}
        {page==='network'&&<Card><div className="section-heading"><h2>شبکه پیش‌نیازی فعالیت‌ها</h2><Badge tone="blue">روابط FS</Badge></div>{schedule.errors.length>0&&<div className="warning">{schedule.errors.join('؛ ')}</div>}{ganttRows.length?<div className="network-list">{ganttRows.map(a=><div key={a.id} className="network-card"><div className="network-sequence"><Activity size={17}/><span dir="ltr">{a.id}</span></div><div><b>{a.title}</b><small>{dateFa(a.start)} تا {dateFa(a.finish)} · {n(a.duration)} روز کاری</small></div><div className="network-predecessors">{a.dependsOn.length?a.dependsOn.map(id=><span key={id} className="network-link"><GitBranch size={13}/>{activities.find(x=>x.id===id)?.title||id}</span>):<span className="muted">بدون پیش‌نیاز</span>}</div></div>)}</div>:<Empty title="شبکه خالی است" detail="ابتدا در صفحه گانت فعالیت ایجاد کنید."/>}</Card>}
        {page==='tasks'&&<Card className="table-card"><div className="table-toolbar"><label className="search"><Search size={18}/><input placeholder="جست‌وجو در تکالیف و مسئولان…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>همه</option>{taskStatuses.map(s=><option key={s}>{s}</option>)}</select><span className="result-label">{n(filteredTasks.length)} تکلیف</span></div><div className="table-scroll"><table><thead><tr><th>عنوان تکلیف</th><th>پروژه</th><th>مسئول / همکاران</th><th>سررسید</th><th>اولویت</th><th>وضعیت</th><th></th></tr></thead><tbody>{filteredTasks.map(t=><tr key={t.id}><td className="strong">{t.title}</td><td>{projectName(t.projectId)}</td><td><b>{userName(t.ownerId)}</b><small className="cell-second">{t.collaboratorIds.map(userName).join('، ')||'—'}</small></td><td>{dateFa(t.dueDate)}</td><td><Badge tone={t.priority===1?'danger':t.priority===2?'amber':'neutral'}>اولویت {n(t.priority)}</Badge></td><td><select className="table-select" value={t.status} onChange={e=>mutate('تغییر وضعیت تکلیف '+t.title,old=>({...old,tasks:old.tasks.map(x=>x.id===t.id?{...x,status:e.target.value as TaskStatus}:x)}))}>{taskStatuses.map(s=><option key={s}>{s}</option>)}</select></td><td><div className="actions"><button className="icon-button" onClick={()=>open('task',t.id)} title="ویرایش"><Edit3 size={16}/></button><button className="icon-button danger" onClick={()=>erase('task',t.id)} title="حذف"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></Card>}
        {page==='costs'&&<><div className="summary-strip"><span><b>{n(costs.length)}</b> ردیف هزینه</span><span>بودجه نمونه: <b>{n(budget)}</b></span><span>هزینه نمونه: <b>{n(actual)}</b></span><Badge tone="amber">واحد فرضی · DEMO</Badge></div><Card className="table-card"><div className="section-heading"><div><h2>ساختار هزینه و ارتباط با WBS</h2><p>اعداد برای آزمایش جمع‌بندی و نگاشت WBS/CBS هستند و ارزش مالی واقعی ندارند</p></div></div><div className="table-scroll"><table><thead><tr><th>کد CBS</th><th>سرفصل هزینه</th><th>بسته کاری WBS</th><th>بودجه نمونه</th><th>هزینه نمونه</th><th>اختلاف</th><th></th></tr></thead><tbody>{costs.map(c=><tr key={c.id}><td className="mono" dir="ltr">{c.costCode}</td><td className="strong">{c.title}</td><td>{codes[c.wbsId]||'—'} · {wbs.find(x=>x.id===c.wbsId)?.title||'تعیین نشده'}</td><td>{n(c.budget)}</td><td>{n(c.actual)}</td><td>{n(c.budget-c.actual)}</td><td><div className="actions"><button className="icon-button" onClick={()=>open('cost',c.id)}><Edit3 size={16}/></button><button className="icon-button danger" onClick={()=>erase('cost',c.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>{costs.length===0&&<Empty title="ردیف هزینه‌ای ثبت نشده است"/>}</Card></>}
        {page==='access'&&<><Card><div className="section-heading"><h2>الگوی نقش‌های پیشنهادی</h2><Badge tone="amber">صرفاً نمایشی؛ فاقد کنترل سمت سرور</Badge></div><div className="role-grid">{roles.map((r,i)=><div className="role-card" key={r}><ShieldCheck size={21}/><b>{r}</b><small>{['پیکربندی، کاربران و تنظیمات','کنترل سبد پروژه، خطوط مبنا و گزارش‌ها','مدیریت پروژه‌های تخصیص‌یافته','ثبت وضعیت فعالیت‌ها و تکالیف مجاز','مشاهده گزارش‌های مجاز'][i]}</small></div>)}</div></Card><Card><h2>موارد لازم پیش از بهره‌برداری واقعی</h2><div className="security-list">{['ورود سازمانی SSO یا حساب‌های ایجادشده توسط IT','مدیریت مجوزها بر اساس پروژه، نقش و مالکیت رکورد در بک‌اند','پایگاه داده سازمانی با نسخه پشتیبان و بازیابی آزموده‌شده','گزارش تغییرات غیرقابل دستکاری برای خط مبنا، بودجه و وضعیت','اعمال الزامات شبکه داخلی، رمزنگاری، محدودیت تلاش ورود و نشست امن'].map(x=><div key={x}><LockKeyhole size={16}/>{x}</div>)}</div></Card></>}
        {page==='settings'&&<div className="two-panels"><Card><div className="section-heading"><h2>مدیریت داده آزمایشی</h2><Badge tone="neutral">Local Storage</Badge></div><p className="settings-p">اطلاعات تنها در همین مرورگر نگهداری می‌شوند؛ برای نگهداری نسخه پشتیبان، فایل JSON دریافت کنید. ورود داده واقعی محرمانه ممنوع است.</p><div className="settings-actions"><button className="btn primary" onClick={()=>downloadData('holding-pmo-demo-backup.json',JSON.stringify(db,null,2))}><Download size={17}/> دریافت پشتیبان JSON</button><label className="btn outline upload"><FileText size={17}/> بازیابی فایل JSON<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const data:unknown=JSON.parse(await file.text());if(!isDatabase(data)){setToast('ساختار فایل پشتیبان معتبر نیست.');return}if(window.confirm('اطلاعات مرورگر با اطلاعات فایل جایگزین شود؟')){mutate('بازیابی نسخه پشتیبان',()=>data);setToast('نسخه پشتیبان در حافظه مرورگر بارگذاری شد.')}}catch{setToast('فایل JSON قابل خواندن نیست.')}e.target.value=''}}/></label><button className="btn danger-btn" onClick={()=>{if(window.confirm('تمام تغییرات محلی حذف و داده نمونه اولیه بارگذاری شود؟')){setDb(seedDatabase());setProjectId('p009');setToast('داده‌های نمونه بازنشانی شدند.')}}}><RotateCcw size={17}/> بازنشانی نمونه</button></div></Card><Card><h2>مرزهای نسخه آزمایشی</h2><div className="security-list">{['بدون سرور، پایگاه داده مشترک یا ذخیره‌سازی ابری','بدون احراز هویت و کنترل دسترسی واقعی','بدون محاسبه مسیر بحرانی، شناوری و EVM','روابط زمان‌بندی FS و تقویم ساده آزمایشی','بدون همگام‌سازی با MSP یا اطلاعات Google Sheets'].map(x=><div key={x}><AlertTriangle size={16}/>{x}</div>)}</div><h3 className="audit-heading">آخرین رویدادهای محلی</h3>{db.audit.slice(0,8).map(a=><div className="audit" key={a.id}><span>{a.event}</span><small>{new Date(a.at).toLocaleString('fa-IR')}</small></div>)}</Card></div>}
      </div>
    </main>
    {toast&&<div className="toast" role="status">{toast}</div>}
    {editor&&<div className="modal-cover" onMouseDown={e=>{if(e.target===e.currentTarget)setEditor(null)}}><form className="modal" onSubmit={save}><div className="modal-head"><div><small>ویرایش اطلاعات نسخه آزمایشی</small><h2>{editor.kind==='project'?'اطلاعات پروژه':editor.kind==='wbs'?'بسته کاری WBS':editor.kind==='activity'?'فعالیت برنامه زمان‌بندی':editor.kind==='task'?'اطلاعات تکلیف':'سرفصل هزینه CBS'}</h2></div><button type="button" className="icon-button" onClick={()=>setEditor(null)}><X size={20}/></button></div><div className="modal-fields">
      <Field name={editor.kind==='project'?'عنوان پروژه':'عنوان'}><input required value={draft[editor.kind==='project'?'name':'title']||''} onChange={e=>change(editor.kind==='project'?'name':'title',e.target.value)}/></Field>
      {editor.kind==='project'&&<>
        <div className="form-row"><Field name="کد پروژه"><input value={draft.code||''} onChange={e=>change('code',e.target.value)}/></Field><Field name="استان"><input value={draft.province||''} onChange={e=>change('province',e.target.value)}/></Field></div>
        <div className="form-row"><Field name="دسته پروژه"><select value={draft.category||'سایر'} onChange={e=>change('category',e.target.value)}>{projectCategories.map(c=><option key={c}>{c}</option>)}</select></Field><Field name="وضعیت"><select value={draft.status||'نامشخص'} onChange={e=>change('status',e.target.value)}>{projectStates.map(s=><option key={s}>{s}</option>)}</select></Field></div>
        <Field name="شروع برنامه (میلادی برای ذخیره‌سازی)"><input type="date" value={draft.startDate||'2026-11-07'} onChange={e=>change('startDate',e.target.value)}/></Field>
        <Field name="توضیحات"><textarea rows={3} value={draft.description||''} onChange={e=>change('description',e.target.value)}/></Field>
      </>}
      {editor.kind==='wbs'&&<>
        <Field name="والد در ساختار"><select value={draft.parentId||''} onChange={e=>change('parentId',e.target.value)}><option value="">سطح اول پروژه</option>{wbs.filter(w=>w.id!==editor.id).map(w=><option key={w.id} value={w.id}>{codes[w.id]} · {w.title}</option>)}</select></Field>
        <Field name="خروجی قابل تحویل"><input value={draft.deliverable||''} onChange={e=>change('deliverable',e.target.value)}/></Field>
        <Field name="معیار پذیرش"><textarea rows={2} value={draft.acceptance||''} onChange={e=>change('acceptance',e.target.value)}/></Field>
        <Field name="توضیحات بسته کاری"><textarea rows={2} value={draft.description||''} onChange={e=>change('description',e.target.value)}/></Field>
        <Field name="وزن پیشنهادی بسته"><input type="number" min="0" step="0.1" value={draft.weight??'1'} onChange={e=>change('weight',e.target.value)}/></Field>
      </>}
      {editor.kind==='activity'&&<>
        <Field name="بسته کاری WBS"><select value={draft.wbsId||''} onChange={e=>change('wbsId',e.target.value)}><option value="">انتخاب نشده</option>{wbs.map(w=><option value={w.id} key={w.id}>{codes[w.id]} · {w.title}</option>)}</select></Field>
        <div className="form-row"><Field name="مدت (روز کاری)"><input type="number" min="0" value={draft.duration??'1'} onChange={e=>change('duration',e.target.value)}/></Field><Field name="پیشرفت (%)"><input type="number" min="0" max="100" value={draft.progress??'0'} onChange={e=>change('progress',e.target.value)}/></Field></div>
        <Field name="نوع فعالیت"><select value={draft.milestone||'false'} onChange={e=>{change('milestone',e.target.value);if(e.target.value==='true')change('duration','0')}}><option value="false">فعالیت</option><option value="true">نقطه عطف (مدت صفر)</option></select></Field>
        <Field name="پیش‌نیازها (FS)"><div className="check-list">{activities.filter(a=>a.id!==editor.id).map(a=><label key={a.id}><input type="checkbox" checked={deps.includes(a.id)} onChange={e=>setDeps(old=>e.target.checked?[...old,a.id]:old.filter(x=>x!==a.id))}/>{a.title}</label>)}{activities.length===0&&<small>هنوز فعالیت دیگری ثبت نشده است.</small>}</div></Field>
        <FieldHelp>برای روابط چرخه‌ای و پیش‌نیاز نامعتبر پیام خطا نمایش داده می‌شود.</FieldHelp>
      </>}
      {editor.kind==='task'&&<>
        <Field name="پروژه"><select value={draft.projectId||project?.id||''} onChange={e=>change('projectId',e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field name="شرح تکلیف"><textarea rows={2} value={draft.description||''} onChange={e=>change('description',e.target.value)}/></Field>
        <div className="form-row"><Field name="مسئول اصلی"><select value={draft.ownerId||''} onChange={e=>change('ownerId',e.target.value)}><option value="">انتخاب نشده</option>{db.users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Field><Field name="وضعیت"><select value={draft.status||'شروع نشده'} onChange={e=>change('status',e.target.value)}>{taskStatuses.map(s=><option key={s}>{s}</option>)}</select></Field></div>
        <div className="form-row"><Field name="اولویت"><select value={draft.priority||'2'} onChange={e=>change('priority',e.target.value)}><option value="1">اولویت ۱</option><option value="2">اولویت ۲</option><option value="3">اولویت ۳</option></select></Field><Field name="سررسید (میلادی)"><input type="date" value={draft.dueDate||''} onChange={e=>change('dueDate',e.target.value)}/></Field></div>
        <Field name="همکاران تکلیف (بدون ثبت رکورد تکراری)"><div className="check-list">{db.users.map(u=><label key={u.id}><input type="checkbox" checked={collabs.includes(u.id)} disabled={u.id===draft.ownerId} onChange={e=>setCollabs(old=>e.target.checked?[...old,u.id]:old.filter(x=>x!==u.id))}/>{u.name}</label>)}</div></Field>
      </>}
      {editor.kind==='cost'&&<>
        <Field name="کد CBS"><input value={draft.costCode||''} placeholder="C-01" onChange={e=>change('costCode',e.target.value)}/></Field>
        <Field name="بسته WBS مرتبط"><select value={draft.wbsId||''} onChange={e=>change('wbsId',e.target.value)}><option value="">تعیین نشده</option>{wbs.map(w=><option key={w.id} value={w.id}>{codes[w.id]} · {w.title}</option>)}</select></Field>
        <div className="form-row"><Field name="بودجه فرضی"><input type="number" min="0" value={draft.budget||'0'} onChange={e=>change('budget',e.target.value)}/></Field><Field name="هزینه فرضی"><input type="number" min="0" value={draft.actual||'0'} onChange={e=>change('actual',e.target.value)}/></Field></div>
        <FieldHelp>هیچ واحد پولی برای این مقادیر تعریف نشده؛ داده‌ها نمایشی هستند.</FieldHelp>
      </>}
    </div><div className="modal-foot"><button type="button" className="btn outline" onClick={()=>setEditor(null)}>انصراف</button><button className="btn primary" type="submit"><CheckCircle2 size={17}/> ذخیره تغییرات</button></div></form></div>}
  </div>
}
