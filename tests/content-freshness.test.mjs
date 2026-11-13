import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentService} from '../src/services/content-service.js';
const response=(value,ok=true)=>({ok,json:async()=>value});
const gate=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const validate=x=>x;

test('lesson-only refresh requests a new same-origin URL and returns changed data without changing the app build',async()=>{
 const seen=[];
 const service=new ContentService({baseUrl:'https://example.test/rename-field-tutorial/',validators:{tutorial:validate},fetcher:async(url,options)=>{seen.push(new URL(url));assert.equal(options.cache,'no-store');return response({revision:seen.length});}});
 assert.equal((await service.load('tutorial')).revision,1);assert.equal((await service.load('tutorial')).revision,2);
 assert.equal(seen.length,2);
 for(const url of seen){assert.equal(url.origin,'https://example.test');assert.equal(url.pathname,'/rename-field-tutorial/data/tutorial.json');assert.ok(url.searchParams.get('_rf_data'));}
 assert.notEqual(seen[0].search,seen[1].search);
});
test('a slow superseded response cannot replace the current lesson',async()=>{
 const old=gate();let n=0;
 const service=new ContentService({baseUrl:'https://example.test/app/',validators:{tutorial:validate},fetcher:async()=>++n===1?old.promise:response({revision:2})});
 const stale=service.load('tutorial');const rejected=assert.rejects(stale,e=>e.name==='AbortError');
 assert.equal((await service.load('tutorial')).revision,2);old.resolve(response({revision:1}));await rejected;
});
test('HTTP, JSON and timeout errors reject and a subsequent retry succeeds',async()=>{
 for(const bad of [async()=>response({},false),async()=>({ok:true,json:async()=>{throw Error('bad JSON');}}),async()=>new Promise(()=>{})]){
  let n=0;const service=new ContentService({baseUrl:'https://example.test/app/',timeoutMs:8,validators:{tutorial:validate},fetcher:async(...args)=>++n===1?bad(...args):response({revision:2})});
  await assert.rejects(service.load('tutorial'));assert.equal((await service.load('tutorial')).revision,2);
 }
});
