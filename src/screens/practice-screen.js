import {el,uniqueId} from '../shared/dom.js';
import {PracticeSession,validateDraft} from '../tutorial/practice-model.js';
import {Screen} from './screen.js';
import {button,pager,screenHead,smallLabel} from './widgets.js';

export class PracticeScreen extends Screen {
  constructor(...args){super(...args);this.session=null;this.saving=false;this.savePromise=null;this.resetPromise=null;this.saveError=null;this.views=new Map();this.renderSequence=0;}
  needs(){return ['tutorial','practice'];}
  readState(){return {dirty:!!this.session?.dirty,saving:this.saving||!!this.resetPromise};}
  async render({practice}){
    const sequence=++this.renderSequence,loadSequence=this.loadSequence;let draft=null;this.notice='';
    if(!this.ctx.storage.available)this.notice='브라우저 저장소를 사용할 수 없어요. 지금 풀 수 있지만 이 브라우저에 답을 저장할 수는 없어요.';
    else try{draft=await this.ctx.storage.loadDraft(value=>validateDraft(value,practice));if(draft)this.notice='이 브라우저에 저장한 답과 메모를 가져왔어요.';}
    catch{this.notice='저장한 답을 불러오지 못했어요. 새로 풀 수 있어요. 아래에서 다시 저장하면 이전 저장 내용을 바꿔요.';}
    if(this.closed||sequence!==this.renderSequence||loadSequence!==this.loadSequence)return;
    this.session=new PracticeSession(practice,draft);this.checked=false;this.paint();
  }
  paint(){
    const {tutorial,practice}=this.data;this.views.clear();const noteId=uniqueId('practice-note'),countId=uniqueId('note-count');
    this.noteInput=el('textarea',{id:noteId,className:'note-input',rows:4,maxLength:practice.draft.noteMaxLength,value:this.session.snapshot().note,'data-testid':'practice-note','aria-describedby':countId,placeholder:'예: 필드 이름을 바꿀 때 읽는 코드도 함께 확인하기',oninput:()=>{if(this.resetPromise)return;this.session.setNote(this.noteInput.value);this.refreshStatus();}});
    this.noteCounter=el('p',{id:countId,className:'note-counter'});
    this.status=el('p',{className:'save-status','data-testid':'save-status',role:'status'});
    this.saveButton=button('이 브라우저에 저장',()=>{this.save().catch(()=>{});},{className:'btn btn-secondary','data-action':'save'});
    this.checkButton=button('답 확인하기',()=>this.check(),{className:'btn btn-primary','data-action':'check'});
    this.resetButton=button('처음부터 다시 풀기',()=>this.confirmReset(),{className:'btn btn-ghost','data-action':'reset'});
    this.result=el('section',{className:'result-panel',hidden:true,tabIndex:-1,'aria-label':'연습 결과'});
    this.root.replaceChildren(el('section',{className:'screen practice-screen'},[
      screenHead(tutorial.screens.practice),
      el('div',{className:'practice-intro'},[el('p',{textContent:'정답보다 이유를 생각해 보세요. 답을 고른 뒤 확인하고, 언제든 다시 바꿀 수 있어요.'}),el('span',{className:'count-pill',textContent:'6 QUESTIONS'})]),
      this.notice?el('p',{className:'notice',role:'status',textContent:this.notice}):null,
      el('ol',{className:'practice-items'},practice.items.map((item,index)=>this.itemView(item,index))),
      el('section',{className:'note-field'},[smallLabel('MY REFACTORING NOTE'),el('label',{for:noteId,textContent:'기억하고 싶은 점 (선택)'}),this.noteInput,this.noteCounter]),
      el('div',{className:'practice-bar'},[el('div',{className:'actions'},[this.checkButton,this.saveButton,this.resetButton]),this.status]),
      el('p',{className:'field-hint',textContent:'답과 메모는 이 브라우저에만 저장해요. 브라우저 데이터를 지우거나 다른 기기를 사용하면 이어 볼 수 없어요.'}),this.result,pager(this)
    ]));this.refreshStatus();
  }
  itemView(item,index){
    const snapshot=this.session.snapshot(),headingId=uniqueId('question-title');
    const heading=el('h2',{id:headingId,tabIndex:-1,textContent:item.title});
    const feedback=el('div',{className:'feedback','data-feedback':item.id,'aria-live':'polite',hidden:true});
    const options=item.choices.map(choice=>{
      const id=uniqueId(item.id),input=el('input',{type:'radio',name:item.id,id,value:choice.id,checked:snapshot.answers[item.id]===choice.id,onchange:()=>{
        if(!input.checked||this.resetPromise)return;this.session.select(item.id,choice.id);feedback.hidden=true;this.result.hidden=true;this.checked=false;this.refreshStatus();
      }});
      input.setAttribute('value',choice.id);
      return el('label',{for:id,className:'choice'},[input,el('span',{textContent:choice.label})]);
    });
    const card=el('li',{className:'question-card','data-question':item.id,'aria-labelledby':headingId},[
      el('div',{className:'question-header'},[el('span',{className:'question-number',textContent:String(index+1).padStart(2,'0')}),heading]),el('p',{className:'question-story',textContent:item.story}),
      el('fieldset',{className:'choices'},[el('legend',{textContent:item.question}),el('div',{className:'choice-list'},options)]),feedback
    ]);this.views.set(item.id,{card,heading,feedback});return card;
  }
  check(){
    this.checked=true;
    for(const item of this.data.practice.items){
      const grade=this.session.grade(item.id),view=this.views.get(item.id);view.card.dataset.status=grade.status;view.feedback.hidden=false;
      const unanswered=grade.status==='unanswered';view.feedback.dataset.result=grade.status;
      view.feedback.replaceChildren(...[el('strong',{textContent:unanswered?'아직 답을 고르지 않았어요.':grade.correct?'✓ 정답이에요.':'다시 생각해 볼까요?'}),unanswered?null:el('p',{textContent:item.explanation})].filter(Boolean));
    }
    const result=this.session.summary();
    this.result.replaceChildren(smallLabel('YOUR CHECKPOINT'),el('h2',{textContent:result.total+'문제 중 '+result.correct+'문제 정답'}),el('p',{textContent:result.unanswered?'아직 고르지 않은 답이 '+result.unanswered+'개 있어요. 각 문제의 설명과 함께 살펴보세요.':result.wrong?'다른 선택을 한 문제의 설명을 읽고 다시 골라 보세요.':'이름을 바꾸는 이유부터 사용하는 곳까지 잘 살펴봤어요.'}));
    this.result.hidden=false;this.result.focus();
  }
  refreshStatus(){
    if(!this.status||!this.session)return;
    const snapshot=this.session.snapshot();this.noteCounter.textContent=snapshot.note.length+' / '+this.data.practice.draft.noteMaxLength+'자';
    let state='idle',message='아직 저장하지 않았어요. 답과 메모를 고른 뒤 저장할 수 있어요.';
    if(this.resetPromise){state='saving';message='저장된 답과 메모를 지우는 중…';}
    else if(this.saving){state='saving';message='이 브라우저에 저장하는 중…';}
    else if(this.saveError){state='error';message='저장하지 못했어요. 답과 메모는 그대로 있어요. 저장을 다시 시도해 주세요.';}
    else if(this.session.dirty){state='dirty';message='저장하지 않은 변경 내용이 있어요.';}
    else if(this.session.savedAt){state='saved';message='✓ 이 브라우저에 저장했어요.';}
    this.status.dataset.state=state;this.status.textContent=message;
    this.saveButton.disabled=this.saving||!!this.resetPromise||!this.ctx.storage.available;
    this.checkButton.disabled=!!this.resetPromise;this.resetButton.disabled=!!this.resetPromise;
    this.noteInput.disabled=!!this.resetPromise;for(const input of this.root.querySelectorAll('input[type="radio"]'))input.disabled=!!this.resetPromise;
  }
  async save(){
    if(!this.session)return;if(this.resetPromise)await this.resetPromise;
    const previous=this.savePromise,snapshot=this.session.snapshot(),savedAt=new Date().toISOString();
    const operation=Promise.resolve().then(async()=>{
      if(previous)await previous.catch(()=>{});if(this.closed)return;
      this.saveError=null;
      try{await this.ctx.storage.saveDraft({...snapshot,savedAt},value=>validateDraft(value,this.data.practice));this.session.markSaved(snapshot,savedAt);}
      catch(error){this.saveError=error;throw error;}
      finally{if(this.savePromise===operation){this.savePromise=null;this.saving=false;}if(!this.closed)this.refreshStatus();}
    });
    this.savePromise=operation;this.saving=true;this.refreshStatus();return operation;
  }
  async discard(){
    if(this.resetPromise)await this.resetPromise;if(this.savePromise)await this.savePromise.catch(()=>{});
    this.session?.discardChanges();this.saveError=null;if(!this.closed&&this.session)this.paint();
  }
  confirmReset(){
    if(this.resetPromise)return;
    const id=uniqueId('reset-title'),dialog=el('dialog',{className:'modal','aria-labelledby':id},[
      el('div',{className:'modal-card'},[smallLabel('START AGAIN'),el('h2',{id,textContent:'답과 메모를 모두 지울까요?'}),
        el('p',{textContent:'이 브라우저에 저장한 답과 지금 작성한 메모를 지워요. 이 작업은 되돌릴 수 없어요.'}),
        el('div',{className:'actions'},[button('지우고 다시 풀기',()=>{close();this.reset();},{className:'btn btn-primary','data-reset':'confirm'}),button('그대로 두기',()=>close(),{'data-reset':'cancel'})])])
    ]);
    const close=()=>{dialog.close();dialog.remove();this.resetButton.focus();};
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});this.root.append(dialog);dialog.showModal();dialog.querySelector('[data-reset="cancel"]').focus();
  }
  async reset(){
    if(this.resetPromise)return this.resetPromise;
    const operation=Promise.resolve().then(async()=>{
      if(this.savePromise)await this.savePromise.catch(()=>{});
      try{await this.ctx.storage.clearDraft();if(this.closed)return;this.session=new PracticeSession(this.data.practice);this.saveError=null;this.notice='';this.checked=false;this.paint();this.views.values().next().value?.heading.focus();}
      catch(error){this.saveError=error;}
      finally{this.resetPromise=null;if(!this.closed)this.refreshStatus();}
    });this.resetPromise=operation;this.refreshStatus();return operation;
  }
}
