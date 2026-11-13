import {el,uniqueId} from '../shared/dom.js';
import {evaluateRename} from '../tutorial/rename-model.js';
import {Screen} from './screen.js';
import {button,screenHead,pager,smallLabel,readerValue} from './widgets.js';

const initial=()=>({newName:'totalAmount',producer:false,receipt:false,report:false});
export class LabScreen extends Screen {
  constructor(...args){super(...args);this.state=initial();this.checkpoint=initial();this.controls={};this.saving=false;this.savePromise=null;this.saveError=null;this.savedAt=null;}
  readState(){return {dirty:JSON.stringify(this.state)!==JSON.stringify(this.checkpoint),saving:this.saving};}
  async save(){
    const previous=this.savePromise,snapshot={...this.state},savedAt=new Date().toISOString();
    const operation=Promise.resolve().then(async()=>{
      if(previous)await previous.catch(()=>{});if(this.closed)return;
      this.saveError=null;
      try{
        if(!this.ctx.labStorage?.available)throw Error('브라우저 저장소를 사용할 수 없어요.');
        await this.ctx.labStorage.saveDraft({schema:1,...snapshot,savedAt});this.checkpoint=snapshot;this.savedAt=savedAt;
      }catch(error){this.saveError=error;throw error;}
      finally{if(this.savePromise===operation){this.savePromise=null;this.saving=false;}if(!this.closed)this.refresh();}
    });this.savePromise=operation;this.saving=true;this.refresh();return operation;
  }
  async discard(){if(this.savePromise)await this.savePromise.catch(()=>{});this.state={...this.checkpoint};this.saveError=null;this.syncControls();this.refresh();}
  async render({tutorial}){
    const loadSequence=this.loadSequence;let restored=null;this.notice='';
    if(this.ctx.labStorage?.available){try{restored=await this.ctx.labStorage.loadDraft();}catch{this.notice='저장한 실험 상태를 불러오지 못했어요. 기본 상태에서 다시 실험할 수 있어요.';}}
    else this.notice='브라우저 저장소를 사용할 수 없어요. 지금 실험할 수 있지만 상태를 저장할 수는 없어요.';
    if(this.closed||loadSequence!==this.loadSequence)return;
    if(restored){this.state={newName:restored.newName,producer:restored.producer,receipt:restored.receipt,report:restored.report};this.checkpoint={...this.state};this.savedAt=restored.savedAt||null;this.notice='이 브라우저에 저장한 실험 상태를 가져왔어요.';}
    const inputId=uniqueId('field-name');
    this.nameInput=el('input',{id:inputId,type:'text',className:'field-input',value:this.state.newName,maxLength:100,'data-testid':'rename-name',autocomplete:'off',spellcheck:'false','aria-describedby':'name-hint name-error',oninput:()=>{this.state.newName=this.nameInput.value;this.refresh();}});
    this.error=el('p',{id:'name-error',className:'form-error',role:'status',hidden:true});
    this.status=el('p',{className:'lab-status','data-testid':'lab-status',role:'status'});
    this.key=el('code',{'data-testid':'record-key',className:'lab-record-key'});
    this.outputs={};
    const switches=[['producer','주문 데이터 만들기','객체에 새 이름으로 값을 담아요.'],['receipt','영수증에서 읽기','영수증이 새 이름을 찾도록 해요.'],['report','매출 보고서에서 읽기','보고서가 새 이름을 찾도록 해요.']].map(([part,title,description],index)=>{
      const id=uniqueId(part),input=el('input',{type:'checkbox',id,'data-part':part,checked:this.state[part],onchange:()=>{this.state[part]=input.checked;this.refresh();}});this.controls[part]=input;
      return el('label',{className:'part-toggle',for:id},[el('span',{className:'toggle-index',textContent:'0'+(index+1)}),el('span',{className:'toggle-copy'},[el('strong',{textContent:title}),el('span',{textContent:description})]),input,el('span',{className:'toggle-track','aria-hidden':'true'})]);
    });
    const readers=['receipt','report'].map(part=>{
      this.outputs[part]={key:el('code'),value:el('strong',{'data-testid':part+'-value'})};
      return el('article',{className:'reader-card'},[smallLabel(part==='receipt'?'영수증 / 읽는 곳 01':'매출 보고서 / 읽는 곳 02'),this.outputs[part].key,el('span',{className:'reader-arrow','aria-hidden':'true',textContent:'↓'}),this.outputs[part].value]);
    });
    this.checkpointStatus=el('p',{className:'checkpoint-status',role:'status'});
    this.saveButton=button('현재 실험 상태 저장',()=>{this.save().catch(()=>{});},{className:'btn btn-secondary','data-action':'save-lab'});
    this.root.replaceChildren(el('section',{className:'screen'},[
      screenHead(tutorial.screens.lab),
      this.notice?el('p',{className:'notice',role:'status',textContent:this.notice}):null,
      el('div',{className:'lab-grid'},[
        el('section',{className:'lab-controls','aria-label':'이름 변경 설정'},[
          smallLabel('01 / 새 이름을 정하세요'),el('label',{className:'input-label',for:inputId,textContent:'amt 대신 사용할 필드 이름'}),this.nameInput,
          el('p',{className:'field-hint',id:'name-hint',textContent:'추천: totalAmount · 총 주문 금액. 뜻을 이해하고 이름을 골라요.'}),this.error,
          el('div',{className:'toggle-list'},switches),
          el('div',{className:'actions'},[button('세 곳을 함께 바꾸기',()=>{this.state.producer=true;this.state.receipt=true;this.state.report=true;this.syncControls();this.refresh();},{className:'btn btn-primary','data-action':'rename-all'}),button('처음 상태로',()=>{this.state=initial();this.syncControls();this.refresh();},{className:'btn btn-ghost','data-action':'reset-lab'})])
        ]),
        el('section',{className:'lab-preview','aria-label':'현재 주문 데이터와 읽기 결과'},[
          el('div',{className:'preview-topline'},[smallLabel('LIVE PREVIEW'),el('span',{className:'live-dot','aria-hidden':'true'})]),
          el('div',{className:'lab-record'},[smallLabel('주문 객체 / 만드는 곳'),el('p',{className:'lab-object-name',textContent:'const order ='}),el('div',{className:'lab-object'},[el('span',{textContent:'{'}),this.key,el('span',{textContent:':'}),el('strong',{textContent:'10000'}),el('span',{textContent:'}'})])]),
          el('div',{className:'flow-arrows','aria-hidden':'true',textContent:'↙                         ↘'}),el('div',{className:'reader-grid'},readers),this.status
        ])
      ]),
      el('aside',{className:'callout'},[el('strong',{textContent:'체크 하나씩 켜고, 무엇이 달라지는지 살펴보세요.'}),el('p',{textContent:'이름만 바꿔도 읽는 곳이 예전 키를 찾으면 값을 가져오지 못해요. 세 곳을 맞췄을 때 값 10000이 모두 유지되는지 확인해요.'})]),
      el('div',{className:'checkpoint-bar'},[this.checkpointStatus,this.saveButton]),
      el('p',{className:'field-hint',textContent:'실험 상태는 이 브라우저에만 저장해요. 저장한 이름과 스위치 상태를 다음 방문에도 이어서 볼 수 있어요. 연습 답과 메모는 연습 화면에서 따로 저장해요.'}),pager(this)
    ]));this.refresh();
  }
  syncControls(){if(this.nameInput)this.nameInput.value=this.state.newName;for(const [part,node] of Object.entries(this.controls))node.checked=this.state[part];}
  refresh(){
    if(!this.key)return;const result=evaluateRename(this.state);
    this.key.textContent=result.fieldName;this.error.hidden=result.nameValid;this.error.textContent=result.error||'';
    this.nameInput.setAttribute('aria-invalid',String(!result.nameValid));
    for(const part of ['receipt','report']){
      const reader=result[part],view=this.outputs[part];view.key.textContent='order.'+reader.key;view.value.textContent=readerValue(reader);view.value.parentNode.dataset.ok=String(reader.ok);
    }
    const done=result.nameValid&&result.done&&result.receipt.ok&&result.report.ok;
    this.status.dataset.done=String(done);
    this.status.textContent=!result.nameValid?'필드 이름을 확인해 주세요. 원래 주문 데이터는 그대로예요.':done?'✓ 세 곳의 이름이 같아요. 결과도 모두 10000으로 같아요.':!this.state.producer&&!this.state.receipt&&!this.state.report?'아직 amt를 사용해요. 새 이름을 쓰는 곳을 하나씩 켜 보세요.':'이름을 맞추는 중이에요. 필드를 찾을 수 없는 곳을 확인해 보세요.';
    this.checkpointStatus.textContent=this.saving?'실험 상태를 이 브라우저에 저장하는 중…':this.saveError?'저장하지 못했어요. 실험 상태는 그대로 있어요. 다시 시도해 주세요.':this.readState().dirty?'저장하지 않은 실험 상태가 있어요.':this.savedAt?'✓ 현재 실험 상태를 이 브라우저에 저장했어요.':'기본 실험 상태예요. 이름과 스위치를 바꿔 보세요.';
    this.checkpointStatus.dataset.state=this.saveError?'error':this.saving?'saving':'idle';
    if(this.saveButton)this.saveButton.disabled=this.saving||!this.ctx.labStorage?.available;
  }
}
