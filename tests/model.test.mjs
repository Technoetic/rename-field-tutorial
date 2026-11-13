import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRename,contractPreview} from '../src/tutorial/rename-model.js';
import {validateDraftShape,validateDraft,PracticeSession} from '../src/tutorial/practice-model.js';

const config={schema:1,draft:{noteMaxLength:1000},items:[
  {id:'field',choices:[{id:'rename'},{id:'convert'}],answer:'rename'},
  {id:'reader',choices:[{id:'sync'},{id:'ignore'}],answer:'sync'}
]};
const draft=(extra={})=>({schema:1,answers:{field:'rename'},note:'값은 그대로',...extra});

test('the original order and both readers work before any rename',()=>{
  const state=evaluateRename();
  assert.deepEqual(state.record,{amt:10000});assert.equal(state.fieldName,'amt');
  assert.deepEqual(state.receipt,{key:'amt',ok:true,value:10000});
  assert.deepEqual(state.report,{key:'amt',ok:true,value:10000});
  assert.equal(state.done,false);assert.equal(state.nameValid,true);assert.equal(state.error,null);
});

test('a renamed producer exposes missing fields in readers that were not updated',()=>{
  const state=evaluateRename({producer:true,receipt:true});
  assert.deepEqual(state.record,{totalAmount:10000});assert.equal(state.fieldName,'totalAmount');
  assert.deepEqual(state.receipt,{key:'totalAmount',ok:true,value:10000});
  assert.deepEqual(state.report,{key:'amt',ok:false,value:undefined});assert.equal(state.done,false);
});

test('updating a reader before the producer also exposes a missing field',()=>{
  const state=evaluateRename({receipt:true,report:true});
  assert.deepEqual(state.record,{amt:10000});assert.equal(state.receipt.ok,false);assert.equal(state.report.ok,false);
});

test('a complete rename preserves the value, including zero, without treating naming quality as automatic',()=>{
  for(const value of [10000,0,64000]){
    const state=evaluateRename({newName:'cafeAmount',producer:true,receipt:true,report:true,value});
    assert.deepEqual(state.record,{cafeAmount:value});assert.equal(state.receipt.value,value);
    assert.equal(state.report.value,value);assert.equal(state.done,true);assert.equal(state.valuesUnchanged,true);
  }
});

test('invalid, reserved, colliding and dangerous names preserve the original order',()=>{
  for(const newName of ['', ' ', 'total amount','1total','x-y','amt','__proto__','constructor','prototype','class','return',null,3]){
    const state=evaluateRename({newName,producer:true,receipt:true,report:true});
    assert.equal(state.nameValid,false,String(newName));assert.ok(state.error);assert.equal(state.done,false);
    assert.deepEqual(state.record,{amt:10000});assert.equal(state.fieldName,'amt');
    assert.deepEqual(state.receipt,{key:'amt',ok:true,value:10000});
  }
  assert.equal({}.totalAmount,undefined);
});

test('Unicode and dollar identifiers can be used as ordinary object field names',()=>{
  for(const newName of ['주문금액','$total','_total2']){
    const state=evaluateRename({newName,producer:true,receipt:true,report:true});
    assert.equal(state.nameValid,true);assert.equal(state.record[newName],10000);assert.equal(state.done,true);
  }
});

test('the contract preview shows the compatibility cost and the temporary handover',()=>{
  assert.deepEqual(contractPreview('legacy'),{payload:{amt:10000},legacyReader:{ok:true,value:10000},modernReader:{ok:false,value:undefined}});
  assert.deepEqual(contractPreview('breaking'),{payload:{totalAmount:10000},legacyReader:{ok:false,value:undefined},modernReader:{ok:true,value:10000}});
  assert.deepEqual(contractPreview('transition'),{payload:{amt:10000,totalAmount:10000},legacyReader:{ok:true,value:10000},modernReader:{ok:true,value:10000}});
  assert.throws(()=>contractPreview('unknown'));
});

test('the practice session grades arbitrary configured IDs and counts unanswered questions',()=>{
  const session=new PracticeSession(config);
  assert.deepEqual(session.grade('field'),{status:'unanswered',correct:false});
  assert.deepEqual(session.summary(),{correct:0,wrong:0,unanswered:2,total:2});
  session.select('field','rename');session.select('reader','ignore');
  assert.deepEqual(session.grade('field'),{status:'correct',correct:true});
  assert.deepEqual(session.grade('reader'),{status:'wrong',correct:false});
  assert.deepEqual(session.summary(),{correct:1,wrong:1,unanswered:0,total:2});
  assert.throws(()=>session.select('unknown','rename'));assert.throws(()=>session.select('field','unknown'));
  assert.throws(()=>session.grade('unknown'));
});

test('validated drafts are private copies and preserve valid save metadata',()=>{
  const savedAt='2026-11-13T08:00:00.000Z';const input=draft({savedAt});
  const shaped=validateDraftShape(input);const validated=validateDraft(input,config);
  assert.deepEqual(validated,input);assert.deepEqual(shaped,input);assert.notEqual(validated,input);
  input.answers.field='convert';assert.equal(validated.answers.field,'rename');
  const session=new PracticeSession(config,validated);validated.answers.field='convert';
  assert.equal(session.grade('field').status,'correct');assert.equal(session.savedAt,savedAt);assert.equal(session.dirty,false);
});

test('corrupted or foreign drafts are rejected instead of silently dropping answers',()=>{
  const invalid=[null,[],draft({schema:2}),draft({note:3}),draft({note:'x'.repeat(1001)}),draft({savedAt:'yesterday'}),
    draft({extra:true}),draft({answers:[]}),draft({answers:{unknown:'rename'}}),draft({answers:{field:'foreign'}}),
    draft({answers:{field:{choice:'rename'}}}),JSON.parse('{"schema":1,"answers":{"__proto__":"rename"},"note":""}')];
  for(const value of invalid)assert.throws(()=>validateDraft(value,config));
  assert.throws(()=>validateDraftShape(draft({answers:{field:42}})));
  assert.throws(()=>validateDraftShape(draft({note:'x'.repeat(1001)})));
  assert.equal({}.rename,undefined);
});

test('note boundaries and configured unknown IDs are enforced before mutating session state',()=>{
  const session=new PracticeSession(config);session.setNote('x'.repeat(1000));
  assert.equal(session.snapshot().note.length,1000);assert.throws(()=>session.setNote('x'.repeat(1001)));
  assert.equal(session.snapshot().note.length,1000);assert.throws(()=>session.setNote(10));
  assert.throws(()=>new PracticeSession({...config,items:[...config.items,config.items[0]]}));
});

test('saving an earlier snapshot retains newer edits as dirty and discard returns to the saved snapshot',()=>{
  const session=new PracticeSession(config);assert.equal(session.dirty,false);
  session.select('field','rename');const inFlight=session.snapshot();session.setNote('保存待ち');
  session.markSaved(inFlight,'2026-11-13T08:01:00.000Z');assert.equal(session.dirty,true);
  inFlight.answers.field='convert';session.discardChanges();
  assert.deepEqual(session.snapshot(),{schema:1,answers:{field:'rename'},note:''});assert.equal(session.dirty,false);
  assert.equal(session.savedAt,'2026-11-13T08:01:00.000Z');
});

test('reset is editable until saved, and snapshots cannot mutate the live or saved state',()=>{
  const session=new PracticeSession(config,draft({savedAt:'2026-11-13T08:00:00.000Z'}));
  const copy=session.snapshot();copy.answers.field='convert';assert.equal(session.grade('field').status,'correct');
  session.reset();assert.deepEqual(session.snapshot(),{schema:1,answers:{},note:''});assert.equal(session.dirty,true);
  session.discardChanges();assert.equal(session.grade('field').status,'correct');assert.equal(session.dirty,false);
  session.reset();session.markSaved(session.snapshot(),'2026-11-13T08:02:00.000Z');assert.equal(session.dirty,false);
});
