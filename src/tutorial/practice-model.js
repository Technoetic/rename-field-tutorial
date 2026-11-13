const UNSAFE_IDS=new Set(['__proto__','constructor','prototype']);
const SAFE_ID=/^[a-z][a-z0-9-]*$/;
const MAX_NOTE_LENGTH=1000;

function insist(condition,message){if(!condition)throw new TypeError(message);}
function plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);}
function safeId(value){return typeof value==='string'&&SAFE_ID.test(value)&&!UNSAFE_IDS.has(value);}
function validSavedAt(value){
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&
    Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
}
function copyState(state){return {schema:1,answers:{...state.answers},note:state.note};}
function sameState(left,right){
  const keys=Object.keys(left.answers);
  return left.note===right.note&&keys.length===Object.keys(right.answers).length&&
    keys.every(key=>Object.hasOwn(right.answers,key)&&left.answers[key]===right.answers[key]);
}

function configuration(config){
  insist(plain(config)&&plain(config.draft)&&Array.isArray(config.items)&&config.items.length>0,'연습 설정을 읽을 수 없어요.');
  const noteMaxLength=config.draft.noteMaxLength;
  insist(Number.isInteger(noteMaxLength)&&noteMaxLength>0&&noteMaxLength<=MAX_NOTE_LENGTH,'메모 길이 설정이 올바르지 않아요.');
  const items=new Map();
  for(const item of config.items){
    insist(plain(item)&&safeId(item.id)&&!items.has(item.id),'문항 ID가 올바르지 않아요.');
    insist(Array.isArray(item.choices)&&item.choices.length>=2,'문항의 선택지가 부족해요.');
    const choices=new Set();
    for(const choice of item.choices){
      insist(plain(choice)&&safeId(choice.id)&&!choices.has(choice.id),'선택지 ID가 올바르지 않아요.');
      choices.add(choice.id);
    }
    insist(choices.has(item.answer),'정답이 선택지에 없어요.');
    items.set(item.id,{choices,answer:item.answer});
  }
  return {items,noteMaxLength};
}

// Shape validation is used by browser storage before content has finished loading.
export function validateDraftShape(draft){
  insist(plain(draft)&&draft.schema===1,'저장된 연습 형식이 올바르지 않아요.');
  insist(Object.keys(draft).every(key=>['schema','answers','note','savedAt'].includes(key)),'알 수 없는 저장 항목이 있어요.');
  insist(plain(draft.answers),'저장된 답안을 읽을 수 없어요.');
  insist(typeof draft.note==='string'&&draft.note.length<=MAX_NOTE_LENGTH,'저장된 메모가 너무 길거나 올바르지 않아요.');
  const answers={};
  for(const [id,choiceId] of Object.entries(draft.answers)){
    insist(safeId(id)&&safeId(choiceId),'저장된 문항 또는 선택지 ID가 올바르지 않아요.');
    answers[id]=choiceId;
  }
  const result={schema:1,answers,note:draft.note};
  if(Object.hasOwn(draft,'savedAt')){
    insist(validSavedAt(draft.savedAt),'저장 시각이 올바르지 않아요.');result.savedAt=draft.savedAt;
  }
  return result;
}

function validateFor(draft,{items,noteMaxLength}){
  const result=validateDraftShape(draft);
  insist(result.note.length<=noteMaxLength,'저장된 메모가 허용 길이를 넘었어요.');
  for(const [id,choiceId] of Object.entries(result.answers)){
    insist(items.has(id)&&items.get(id).choices.has(choiceId),'현재 연습에 없는 답안이 저장되어 있어요.');
  }
  return result;
}

export function validateDraft(draft,config){return validateFor(draft,configuration(config));}

export class PracticeSession {
  constructor(config,draft=null){
    this._config=configuration(config);
    const restored=draft===null?{schema:1,answers:{},note:''}:validateFor(draft,this._config);
    this._state=copyState(restored);this._saved=copyState(restored);this.savedAt=restored.savedAt??null;
  }
  _item(id){
    insist(this._config.items.has(id),'알 수 없는 문항입니다.');return this._config.items.get(id);
  }
  select(id,choiceId){
    insist(this._item(id).choices.has(choiceId),'알 수 없는 선택지입니다.');this._state.answers[id]=choiceId;
  }
  setNote(text){
    insist(typeof text==='string'&&text.length<=this._config.noteMaxLength,'메모가 허용 길이를 넘었거나 올바르지 않아요.');
    this._state.note=text;
  }
  grade(id){
    const item=this._item(id),answer=this._state.answers[id];
    if(answer===undefined)return {status:'unanswered',correct:false};
    const correct=answer===item.answer;return {status:correct?'correct':'wrong',correct};
  }
  summary(){
    const result={correct:0,wrong:0,unanswered:0,total:this._config.items.size};
    for(const id of this._config.items.keys())result[this.grade(id).status]++;
    return result;
  }
  snapshot(){return copyState(this._state);}
  markSaved(snapshot,savedAt){
    const saved=validateFor({...snapshot,savedAt},this._config);
    this._saved=copyState(saved);this.savedAt=savedAt;
  }
  discardChanges(){this._state=copyState(this._saved);}
  reset(){this._state={schema:1,answers:{},note:''};}
  get dirty(){return !sameState(this._state,this._saved);}
}
