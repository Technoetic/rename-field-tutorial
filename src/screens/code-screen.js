import {el} from '../shared/dom.js';
import {Screen} from './screen.js';
import {button,pager,screenHead,codeView,smallLabel} from './widgets.js';

export class CodeScreen extends Screen {
  needs(){return ['tutorial','code'];}
  render({tutorial,code}){
    this.beforeButton=button('바꾸기 전',()=>this.select(false),{className:'segment','aria-pressed':'true','data-code':'before'});
    this.afterButton=button('바꾼 뒤',()=>this.select(true),{className:'segment','aria-pressed':'false','data-code':'after'});
    this.source=el('div',{'aria-live':'polite'});
    this.output=el('div',{className:'code-output'},[smallLabel('실행 결과'),el('strong',{textContent:String(code.output)}),el('span',{textContent:'값은 그대로예요.'})]);
    this.root.replaceChildren(el('section',{className:'screen'},[
      screenHead(tutorial.screens.code),
      el('div',{className:'segmented','aria-label':'코드 비교'},[this.beforeButton,this.afterButton]),this.source,this.output,
      el('section',{className:'callout'},[el('h2',{textContent:'객체를 만드는 곳과 읽는 곳, 두 군데를 보세요.'}),el('p',{textContent:code.explanation})]),
      el('div',{className:'definition-grid code-differences'},[
        el('article',{className:'definition-card'},[smallLabel('바뀌는 것'),el('code',{textContent:'amt → totalAmount'}),el('p',{textContent:'객체에 담는 키와 그 키로 읽는 코드예요.'})]),
        el('article',{className:'definition-card'},[smallLabel('그대로인 것'),el('code',{textContent:'order · 10000'}),el('p',{textContent:'객체를 가리키는 변수 이름과 주문 금액이에요.'})]),
        el('article',{className:'definition-card'},[smallLabel('추가로 확인할 것'),el('code',{textContent:'읽는 곳 · 만드는 곳 · 테스트'}),el('p',{textContent:'영수증, 보고서, 테스트의 기대값에서 옛 이름을 쓰고 있지는 않은지 찾아요.'})])
      ]),pager(this)
    ]));this.select(false);
  }
  select(after){this.beforeButton.setAttribute('aria-pressed',String(!after));this.afterButton.setAttribute('aria-pressed',String(after));this.source.replaceChildren(codeView(this.data.code[after?'after':'before'],after?'새 이름으로 만드는 곳과 읽는 곳':'기존 이름으로 만드는 곳과 읽는 곳'));}
}
