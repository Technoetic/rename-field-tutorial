import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateTutorial,validatePractice,validateCode,validateBundle} from '../src/tutorial/content-model.js';

const read=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const [tutorial,practice,code]=await Promise.all(['tutorial','practice','code'].map(read));
const clone=value=>JSON.parse(JSON.stringify(value));

test('the published bundle supplies all seven routes and six answerable exercises',()=>{
  const bundle={tutorial,practice,code};assert.equal(validateBundle(bundle),bundle);
  assert.equal(validateTutorial(tutorial),tutorial);assert.equal(validatePractice(practice),practice);assert.equal(validateCode(code),code);
  assert.equal(tutorial.story.value,10000);assert.equal(tutorial.story.steps.length,3);assert.equal(practice.items.length,6);
});

test('tutorial validation catches missing routes, empty learning text and unsafe source URLs',()=>{
  const missing=clone(tutorial);missing.routes.pop();assert.throws(()=>validateTutorial(missing));
  const duplicate=clone(tutorial);duplicate.routes[1].path='/';assert.throws(()=>validateTutorial(duplicate));
  const blank=clone(tutorial);blank.screens.lab.lead=' ';assert.throws(()=>validateTutorial(blank));
  const unsafe=clone(tutorial);unsafe.summary.sources[0].url='javascript:alert(1)';assert.throws(()=>validateTutorial(unsafe));
  const altered=clone(tutorial);altered.story.value=1000;assert.throws(()=>validateTutorial(altered));
});

test('practice validation rejects ungradeable answers, duplicate or unsafe form IDs and wrong limits',()=>{
  const foreign=clone(practice);foreign.items[0].answer='foreign';assert.throws(()=>validatePractice(foreign));
  const duplicate=clone(practice);duplicate.items[1].id=duplicate.items[0].id;assert.throws(()=>validatePractice(duplicate));
  const unsafe=clone(practice);unsafe.items[0].choices[0].id='bad"id';assert.throws(()=>validatePractice(unsafe));
  const short=clone(practice);short.items.pop();assert.throws(()=>validatePractice(short));
  const limit=clone(practice);limit.draft.noteMaxLength=0;assert.throws(()=>validatePractice(limit));
});

test('code validation rejects a value conversion or unrelated variable-renaming example',()=>{
  const wrongValue=clone(code);wrongValue.output=1000;assert.throws(()=>validateCode(wrongValue));
  const changed=clone(code);changed.after=['const order = { totalAmount: 1 };','console.log(order.totalAmount);'];assert.throws(()=>validateCode(changed));
  const variable=clone(code);variable.after=['const renamedOrder = { amt: 10000 };','console.log(renamedOrder.amt);'];assert.throws(()=>validateCode(variable));
});
