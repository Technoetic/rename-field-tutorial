import test from 'node:test';
import assert from 'node:assert/strict';
import {LabStorageService,LAB_DRAFT_KEY} from '../src/services/lab-storage-service.js';
import {StorageService,DRAFT_KEY} from '../src/services/storage-service.js';
const draft=(extra={})=>({schema:1,newName:'totalAmount',producer:true,receipt:false,report:false,...extra});
class Memory {data=new Map();getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}}
test('a saved lab checkpoint survives a new service instance without using the practice key',async()=>{
 const storage=new Memory();const first=new LabStorageService({storage});
 assert.equal(await first.loadDraft(),null);await first.saveDraft(draft());
 assert.equal(storage.data.has(DRAFT_KEY),false);assert.equal(storage.data.has(LAB_DRAFT_KEY),true);
 const loaded=await new LabStorageService({storage}).loadDraft();assert.deepEqual(loaded,draft());
 loaded.receipt=true;assert.deepEqual(await first.loadDraft(),draft());
 await first.clearDraft();assert.equal(await first.loadDraft(),null);
});
test('invalid rename text can be a draft but malformed states and oversized names are rejected',async()=>{
 const storage=new Memory();const service=new LabStorageService({storage});
 await service.saveDraft(draft({newName:'not yet a name'}));assert.equal((await service.loadDraft()).newName,'not yet a name');
 for(const bad of [draft({schema:2}),draft({newName:'x'.repeat(101)}),draft({producer:'true'}),draft({extra:1}),draft({savedAt:'not-a-date'}),[],null])await assert.rejects(service.saveDraft(bad));
 storage.setItem(LAB_DRAFT_KEY,'{broken');await assert.rejects(service.loadDraft());assert.equal(storage.getItem(LAB_DRAFT_KEY),'{broken');
});
test('failed and delayed checkpoint writes expose pending/error and never report a failed save as complete',async()=>{
 const storage=new Memory();let reject;storage.setItem=()=>new Promise((_,r)=>reject=r);
 const service=new LabStorageService({storage});const save=service.saveDraft(draft());assert.equal(service.saving,true);
 await Promise.resolve();reject(Error('blocked'));await assert.rejects(save,/blocked/);assert.equal(service.saving,false);assert.ok(service.lastError);
});
test('lab and practice storage can coexist without clearing each other',async()=>{
 const storage=new Memory();storage.setItem(DRAFT_KEY,'existing practice');const service=new LabStorageService({storage});
 await service.saveDraft(draft());await service.clearDraft();assert.equal(storage.getItem(DRAFT_KEY),'existing practice');
 assert.equal(new StorageService({storage}).available,true);
});
