import test from 'node:test';
import assert from 'node:assert/strict';
import {installDom,text} from './helpers/fake-dom.mjs';
import {SCREENS} from '../src/screens/screen-table.js';
import {ROUTE_TABLE,routeFor} from '../src/shared/route-table.js';

const paths=['/','/story','/lab','/contract','/practice','/code','/summary'];
const names=['home','story','lab','contract','practice','code','summary'];
const tutorial={schema:1,meta:{appTitle:'RENAME / FIELD',htmlTitle:'Rename Field 배우기',tagline:'이름은 명확하게',description:'테스트'},routes:paths.map((path,i)=>({path,title:'화면 '+i,shortTitle:'단계 '+i})),screens:Object.fromEntries(names.map(name=>[name,{eyebrow:name,title:name+' 제목',lead:'같은 값, 더 분명한 이름.'}])),story:{oldLabel:'amt',newLabel:'totalAmount',value:10000,steps:[{title:'뜻을 알아보기',body:'총 주문 금액'},{title:'이름 바꾸기',body:'필드의 이름'},{title:'읽는 곳 맞추기',body:'같은 값'}]},summary:{points:['의미를 확인한다.','읽는 곳을 함께 바꾼다.'],sources:[{title:'Martin Fowler',url:'https://refactoring.com/catalog/renameField.html'}]}};
const practice={schema:1,draft:{noteMaxLength:1000},items:Array.from({length:6},(_,i)=>({id:'q'+(i+1),title:'문제 '+(i+1),story:'카페 주문',question:'필드 이름은?',choices:[{id:'a',label:'amt'},{id:'b',label:'totalAmount'}],answer:'b',explanation:'필드 이름은 값을 설명해요.'}))};
const code={schema:1,before:['const order = { amt: 10000 };','order.amt;'],after:['const order = { totalAmount: 10000 };','order.totalAmount;'],explanation:'키와 읽는 곳을 함께 바꿔요.',output:10000};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function store(overrides={}){return {available:true,async loadDraft(){return null;},async saveDraft(){},async clearDraft(){},...overrides};}
async function mounted(path,storage=store(),labStorage=store()){
  const dom=installDom(),root=document.createElement('main'),titles=[];
  const entry=routeFor(path),ctx={content:{async load(name){return {tutorial,practice,code}[name];}},storage,labStorage,setTitle:title=>titles.push(title),toast(){}};
  const screen=new SCREENS[entry.screen](ctx,root,{path,params:new URLSearchParams()},entry);
  await screen.mount();return {screen,root,titles,cleanup(){screen.dispose();dom.restore();}};
}
function change(input,value,event='input'){if(input.type==='checkbox'||input.type==='radio')input.checked=value;else input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));}

test('route table exposes only Rename Field lessons and missing fallback',()=>{
  assert.deepEqual(ROUTE_TABLE.filter(entry=>entry.screen!=='notFound').map(entry=>entry.path),paths);
  assert.equal(routeFor('/steps/1').screen,'notFound');
});
test('home lets the learner rename a real key while keeping the value unchanged',async()=>{
  const view=await mounted('/');try{
    assert.match(text(view.root),/RENAME/);assert.match(text(view.root),/10000/);
    view.root.querySelector('[data-action="hero-rename"]').click();
    assert.equal(text(view.root.querySelector('[data-testid="hero-key"]')),'totalAmount');
    assert.equal(text(view.root.querySelector('[data-testid="hero-value"]')),'10000');
    assert.equal(view.screen.readState().dirty,false);
  }finally{view.cleanup();}
});
test('lab reveals incomplete readers, completes them, saves and discards its checkpoint',async()=>{
  const view=await mounted('/lab');try{
    const get=selector=>view.root.querySelector(selector);
    change(get('[data-part="producer"]'),true,'change');
    assert.equal(text(get('[data-testid="record-key"]')),'totalAmount');
    assert.match(text(get('[data-testid="receipt-value"]')),/찾을 수 없/);
    assert.equal(view.screen.readState().dirty,true);
    get('[data-action="rename-all"]').click();
    assert.equal(text(get('[data-testid="receipt-value"]')),'10000');
    assert.equal(text(get('[data-testid="report-value"]')),'10000');
    await view.screen.save();assert.equal(view.screen.readState().dirty,false);
    get('[data-action="reset-lab"]').click();assert.equal(view.screen.readState().dirty,true);
    await view.screen.discard();assert.equal(text(get('[data-testid="record-key"]')),'totalAmount');
    assert.equal(view.screen.readState().dirty,false);
  }finally{view.cleanup();}
});
test('lab rejects unsafe names and renders the typed value as text',async()=>{
  const view=await mounted('/lab');try{
    change(view.root.querySelector('[data-testid="rename-name"]'),'<img src=x onerror=alert(1)>');
    view.root.querySelector('[data-action="rename-all"]').click();
    assert.equal(text(view.root.querySelector('[data-testid="record-key"]')),'amt');
    assert.match(text(view.root.querySelector('[data-testid="lab-status"]')),/이름|사용|필드/);
    assert.equal(view.root.querySelector('img'),null);
  }finally{view.cleanup();}
});
test('lab checkpoint restores after a document transition',async()=>{
  let saved=null;const storage=store({async saveDraft(value){saved=structuredClone(value);},async loadDraft(){return saved;}});
  let view=await mounted('/lab',store(),storage);
  try{view.root.querySelector('[data-action="rename-all"]').click();await view.screen.save();assert.ok(saved);assert.equal(view.screen.readState().dirty,false);}finally{view.cleanup();}
  view=await mounted('/lab',store(),storage);
  try{assert.equal(text(view.root.querySelector('[data-testid="record-key"]')),'totalAmount');assert.equal(view.screen.readState().dirty,false);}finally{view.cleanup();}
});
test('lab delayed checkpoint does not clear newer edits and failed save preserves the draft',async()=>{
  let finish;const wait=new Promise(resolve=>{finish=resolve;});
  const view=await mounted('/lab',store(),store({async saveDraft(){await wait;}}));
  try{
    change(view.root.querySelector('[data-part="producer"]'),true,'change');const saving=view.screen.save();await tick();
    assert.equal(view.screen.readState().saving,true);
    change(view.root.querySelector('[data-testid="rename-name"]'),'grossAmount');finish();await saving;
    assert.equal(view.screen.readState().dirty,true);await view.screen.discard();
    assert.equal(view.root.querySelector('[data-testid="rename-name"]').value,'totalAmount');
  }finally{view.cleanup();}
  const failed=await mounted('/lab',store(),store({async saveDraft(){throw Error('quota');}}));
  try{change(failed.root.querySelector('[data-part="producer"]'),true,'change');await assert.rejects(failed.screen.save());assert.equal(failed.screen.readState().dirty,true);assert.equal(failed.screen.readState().saving,false);}finally{failed.cleanup();}
});
test('contract transition shows matching old and new readers',async()=>{
  const view=await mounted('/contract');try{
    view.root.querySelector('[data-mode="transition"]').click();
    assert.equal(text(view.root.querySelector('[data-testid="legacy-reader"]')),'10000');
    assert.equal(text(view.root.querySelector('[data-testid="modern-reader"]')),'10000');
    assert.match(text(view.root),/amt/);assert.match(text(view.root),/totalAmount/);
  }finally{view.cleanup();}
});
test('practice has six native radio groups, feedback, and note draft',async()=>{
  const view=await mounted('/practice');try{
    assert.equal(view.root.querySelectorAll('[data-question]').length,6);
    change(view.root.querySelector('[data-question="q1"] input[value="b"]'),true,'change');
    view.root.querySelector('[data-action="check"]').click();
    assert.match(text(view.root.querySelector('[data-feedback="q1"]')),/정답/);
    change(view.root.querySelector('[data-testid="practice-note"]'),'<b>총 금액</b>');
    assert.equal(view.screen.session.snapshot().note,'<b>총 금액</b>');
    assert.equal(view.root.querySelector('b'),null);
    assert.equal(view.screen.readState().dirty,true);
    await view.screen.save();assert.equal(view.screen.readState().dirty,false);
  }finally{view.cleanup();}
});
test('practice failed save keeps answers dirty and offers retry',async()=>{
  const view=await mounted('/practice',store({async saveDraft(){throw Error('quota');}}));try{
    change(view.root.querySelector('[data-testid="practice-note"]'),'메모');
    await assert.rejects(view.screen.save());
    assert.equal(view.screen.readState().dirty,true);assert.equal(view.screen.readState().saving,false);
    assert.match(text(view.root.querySelector('[data-testid="save-status"]')),/저장하지 못/);
    assert.equal(view.root.querySelector('[data-action="save"]').disabled,false);
  }finally{view.cleanup();}
});
test('late practice save never marks newer edits saved, and discard waits for the save',async()=>{
  let finish;const pending=new Promise(resolve=>{finish=resolve;});
  const view=await mounted('/practice',store({async saveDraft(){await pending;}}));try{
    const note=view.root.querySelector('[data-testid="practice-note"]');change(note,'첫 메모');
    const saving=view.screen.save();await tick();assert.equal(view.screen.readState().saving,true);
    change(note,'새 메모');finish();await saving;
    assert.equal(view.screen.readState().dirty,true);
    await view.screen.discard();assert.equal(view.screen.session.snapshot().note,'첫 메모');
    assert.equal(view.screen.readState().dirty,false);
  }finally{view.cleanup();}
});
test('save captures the requested snapshot before any subsequent edits',async()=>{
  let saved;const view=await mounted('/practice',store({async saveDraft(snapshot){saved=snapshot;}}));
  try{
    const note=view.root.querySelector('[data-testid="practice-note"]');change(note,'저장할 내용');
    const saving=view.screen.save();change(note,'이후에 작성한 내용');await saving;
    assert.equal(saved.note,'저장할 내용');assert.equal(view.screen.readState().dirty,true);
  }finally{view.cleanup();}
  let checkpoint;const lab=await mounted('/lab',store(),store({async saveDraft(snapshot){checkpoint=snapshot;}}));
  try{
    const name=lab.root.querySelector('[data-testid="rename-name"]');change(name,'grossAmount');
    const saving=lab.screen.save();change(name,'netAmount');await saving;
    assert.equal(checkpoint.newName,'grossAmount');assert.equal(lab.screen.readState().dirty,true);
  }finally{lab.cleanup();}
});
test('practice discard waits for an active save and restores its completed snapshot',async()=>{
  let finish;const waiting=new Promise(resolve=>{finish=resolve;});
  const view=await mounted('/practice',store({async saveDraft(){await waiting;}}));
  try{
    const note=view.root.querySelector('[data-testid="practice-note"]');change(note,'저장할 메모');const saving=view.screen.save();await tick();
    change(note,'버릴 메모');let discarded=false;const discard=view.screen.discard().then(()=>{discarded=true;});await tick();assert.equal(discarded,false);
    finish();await Promise.all([saving,discard]);assert.equal(view.screen.session.snapshot().note,'저장할 메모');assert.equal(view.screen.readState().dirty,false);
  }finally{view.cleanup();}
});
test('practice reset requires confirmation and clears persisted draft',async()=>{
  let clears=0;const view=await mounted('/practice',store({async clearDraft(){clears++;}}));try{
    change(view.root.querySelector('[data-testid="practice-note"]'),'메모');
    view.root.querySelector('[data-action="reset"]').click();assert.equal(clears,0);
    assert.equal(view.root.querySelector('dialog').open,true);
    view.root.querySelector('[data-reset="confirm"]').click();await tick();
    assert.equal(clears,1);assert.equal(view.screen.session.snapshot().note,'');
  }finally{view.cleanup();}
});
test('reset of a restored practice draft establishes a clean empty checkpoint',async()=>{
  const view=await mounted('/practice',store({async loadDraft(){return {schema:1,answers:{q1:'b'},note:'이전 메모',savedAt:'2026-11-13T00:00:00.000Z'};}}));
  try{await view.screen.reset();assert.equal(view.screen.session.snapshot().note,'');assert.equal(view.screen.readState().dirty,false);await view.screen.discard();assert.deepEqual(view.screen.session.snapshot().answers,{});}finally{view.cleanup();}
});
test('all reading screens render a heading and route title, unknown path returns home',async()=>{
  for(const path of ['/story','/code','/summary','/missing']){
    const view=await mounted(path);try{assert.ok(view.root.querySelector('h1'));assert.ok(view.titles[0]);if(path==='/missing')assert.ok(view.root.querySelector('a[href="#/"]'));}finally{view.cleanup();}
  }
});
