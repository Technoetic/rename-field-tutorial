import test from 'node:test';
import assert from 'node:assert/strict';
import {VersionService} from '../src/services/version-service.js';

test('each completed version lookup uses a fresh same-origin URL so Pages CDN copies do not hide a deploy',async()=>{
 const seen=[];
 const service=new VersionService({baseUrl:'https://example.test/rename-field-tutorial/',loadedBuild:'rf-aaa',fetcher:async(url,options)=>{seen.push(new URL(url));assert.equal(options.cache,'no-store');return {ok:true,json:async()=>({schema:1,buildId:'rf-aaa'})};}});
 await service.refresh();await service.refresh();
 assert.equal(seen.length,2);
 for(const url of seen){assert.equal(url.origin,'https://example.test');assert.equal(url.pathname,'/rename-field-tutorial/version.json');assert.ok(url.searchParams.get('_rf_check'));}
 assert.notEqual(seen[0].search,seen[1].search);
 assert.equal(service.loadedBuild,'rf-aaa');
});
