import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const code=JSON.parse(await readFile(new URL('../data/code.json',import.meta.url),'utf8'));
test('the actual before and after examples produce the same numeric order amount',()=>{
  for(const lines of [code.before,code.after]){
    const output=[];vm.runInNewContext(lines.join('\n'),{console:{log:value=>output.push(value)}},{timeout:100});
    assert.deepEqual(output,[10000]);
  }
});
