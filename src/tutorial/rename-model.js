const OLD_KEY='amt';
const NEW_KEY='totalAmount';
const BLOCKED_NAMES=new Set([
  '__proto__','constructor','prototype',
  'await','break','case','catch','class','const','continue','debugger','default','delete','do','else',
  'enum','export','extends','false','finally','for','function','if','implements','import','in',
  'instanceof','interface','let','new','null','package','private','protected','public','return',
  'static','super','switch','this','throw','true','try','typeof','var','void','while','with','yield'
]);
const IDENTIFIER=/^[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*$/u;

function nameError(name){
  if(typeof name!=='string'||!IDENTIFIER.test(name))return '공백 없이 문자, 숫자, _ 또는 $로 된 이름을 입력하세요. 숫자로 시작할 수는 없어요.';
  if(name===OLD_KEY)return '기존 키 amt와 다른 이름을 입력하세요.';
  if(BLOCKED_NAMES.has(name))return '예약어 또는 객체의 특별한 속성 이름은 이 실험에서 사용할 수 없어요.';
  return null;
}

function read(record,key){
  const ok=Object.hasOwn(record,key);
  return {ok,value:ok?record[key]:undefined};
}

// This checks structural alignment. A useful domain name still requires a human judgment.
export function evaluateRename({newName=NEW_KEY,producer=false,receipt=false,report=false,value=10000}={}){
  const error=nameError(newName),nameValid=error===null;
  const fieldName=nameValid&&producer?newName:OLD_KEY;
  const record={[fieldName]:value};
  const receiptKey=nameValid&&receipt?newName:OLD_KEY;
  const reportKey=nameValid&&report?newName:OLD_KEY;
  const receiptResult={key:receiptKey,...read(record,receiptKey)};
  const reportResult={key:reportKey,...read(record,reportKey)};
  return {
    nameValid,error,fieldName,record,receipt:receiptResult,report:reportResult,
    done:nameValid&&Boolean(producer&&receipt&&report),
    valuesUnchanged:Object.is(record[fieldName],value)&&
      [receiptResult,reportResult].every(result=>!result.ok||Object.is(result.value,value))
  };
}

export function contractPreview(mode){
  let payload;
  if(mode==='legacy')payload={amt:10000};
  else if(mode==='breaking')payload={totalAmount:10000};
  else if(mode==='transition')payload={amt:10000,totalAmount:10000};
  else throw new TypeError('알 수 없는 계약 전환 단계입니다.');
  return {payload,legacyReader:read(payload,OLD_KEY),modernReader:read(payload,NEW_KEY)};
}
