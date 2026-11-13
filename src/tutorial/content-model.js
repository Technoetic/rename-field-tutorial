const ROUTES=['/','/story','/lab','/contract','/practice','/code','/summary'];
const SCREENS=['home','story','lab','contract','practice','code','summary'];
const SAFE_ID=/^[a-z][a-z0-9-]*$/;
const UNSAFE_IDS=new Set(['__proto__','constructor','prototype']);
const FOWLER_URL='https://refactoring.com/catalog/renameField.html';

function insist(condition,message){if(!condition)throw new TypeError(message);}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);}
function text(value){return typeof value==='string'&&value.trim().length>0;}
function strings(value,fields){return object(value)&&fields.every(field=>text(value[field]));}
function safeId(value){return typeof value==='string'&&SAFE_ID.test(value)&&!UNSAFE_IDS.has(value);}
function schema(data){insist(object(data)&&data.schema===1,'지원하지 않는 학습 데이터 형식입니다.');}
function https(value){try{return new URL(value).protocol==='https:';}catch{return false;}}

export function validateTutorial(data){
  schema(data);
  insist(strings(data.meta,['appTitle','htmlTitle','tagline','description']),'학습 제목 정보가 부족합니다.');
  insist(Array.isArray(data.routes)&&data.routes.length===ROUTES.length,'학습 경로가 부족합니다.');
  const paths=new Set();
  for(const route of data.routes){
    insist(strings(route,['path','title','shortTitle'])&&ROUTES.includes(route.path)&&!paths.has(route.path),'학습 경로가 올바르지 않습니다.');
    paths.add(route.path);
  }
  insist(object(data.screens)&&SCREENS.every(key=>strings(data.screens[key],['eyebrow','title','lead'])),'화면 설명이 부족합니다.');
  insist(object(data.story)&&data.story.oldLabel==='amt'&&data.story.newLabel==='totalAmount'&&data.story.value===10000,'카페 주문 예제가 올바르지 않습니다.');
  insist(Array.isArray(data.story.steps)&&data.story.steps.length===3&&data.story.steps.every(step=>strings(step,['title','body'])),'이야기의 단계가 부족합니다.');
  insist(object(data.summary)&&Array.isArray(data.summary.points)&&data.summary.points.length>=4&&data.summary.points.every(text),'정리 내용이 부족합니다.');
  const sources=data.summary.sources;
  insist(Array.isArray(sources)&&sources.length>0&&sources.every(source=>strings(source,['title','url'])&&https(source.url))&&
    sources.some(source=>source.url===FOWLER_URL),'원문 출처가 올바르지 않습니다.');
  return data;
}

export function validatePractice(data){
  schema(data);
  insist(object(data.draft)&&data.draft.noteMaxLength===1000,'연습 메모 설정이 올바르지 않습니다.');
  insist(Array.isArray(data.items)&&data.items.length===6,'연습은 여섯 문항이어야 합니다.');
  const itemIds=new Set();
  for(const item of data.items){
    insist(strings(item,['id','title','story','question','answer','explanation'])&&safeId(item.id)&&!itemIds.has(item.id),'문항 정보가 올바르지 않습니다.');
    itemIds.add(item.id);
    insist(Array.isArray(item.choices)&&item.choices.length>=2,'문항의 선택지가 부족합니다.');
    const choices=new Set();
    for(const choice of item.choices){
      insist(strings(choice,['id','label'])&&safeId(choice.id)&&!choices.has(choice.id),'선택지 정보가 올바르지 않습니다.');
      choices.add(choice.id);
    }
    insist(choices.has(item.answer),'정답이 선택지에 없습니다.');
  }
  return data;
}

export function validateCode(data){
  schema(data);
  insist(text(data.explanation)&&data.output===10000,'코드 설명 또는 출력값이 올바르지 않습니다.');
  for(const [key,field] of [['before','amt'],['after','totalAmount']]){
    const lines=data[key];
    insist(Array.isArray(lines)&&lines.length===2&&lines.every(text),'코드 예제가 부족합니다.');
    const declaration=new RegExp('^\\s*const\\s+order\\s*=\\s*\\{\\s*'+field+'\\s*:\\s*10000\\s*\\}\\s*;?\\s*$');
    const reading=new RegExp('^\\s*console\\.log\\(\\s*order\\.'+field+'\\s*\\)\\s*;?\\s*$');
    insist(declaration.test(lines[0])&&reading.test(lines[1]),'필드 이름과 사용처만 바꾸는 예제가 필요합니다.');
  }
  return data;
}

export function validateBundle(bundle){
  insist(object(bundle),'학습 묶음을 읽을 수 없습니다.');
  validateTutorial(bundle.tutorial);validatePractice(bundle.practice);validateCode(bundle.code);return bundle;
}
