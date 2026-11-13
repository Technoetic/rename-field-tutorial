import {el} from '../shared/dom.js';
import {contractPreview} from '../tutorial/rename-model.js';
import {Screen} from './screen.js';
import {button,pager,screenHead,smallLabel,recordRows,readerValue} from './widgets.js';

export class ContractScreen extends Screen {
  render({tutorial}){
    this.modes=[];this.payload=el('div',{className:'contract-payload'});this.readers={legacyReader:el('strong',{'data-testid':'legacy-reader'}),modernReader:el('strong',{'data-testid':'modern-reader'})};
    this.explanation=el('p',{className:'contract-explanation',role:'status'});
    const modes=[['legacy','기존 이름만','amt'],['breaking','새 이름만','totalAmount'],['transition','넘겨 주는 동안','두 이름 함께']];
    this.root.replaceChildren(el('section',{className:'screen'},[
      screenHead(tutorial.screens.contract),
      el('div',{className:'contract-modes','aria-label':'전달하는 데이터 모양'},modes.map(([mode,title,key])=>{
        const control=button('',()=>this.select(mode),{className:'contract-mode','data-mode':mode,'aria-pressed':'false'});control.append(el('strong',{textContent:title}),el('span',{textContent:key}));this.modes.push(control);return control;
      })),
      el('section',{className:'contract-board','aria-label':'데이터와 두 소비자의 호환성'},[
        el('div',{className:'contract-source'},[smallLabel('카페가 보내는 주문 데이터'),this.payload]),
        el('div',{className:'contract-consumers'},[
          this.reader('예전 영수증','amt','legacyReader'),this.reader('새 매출 보고서','totalAmount','modernReader')
        ])
      ]),this.explanation,
      el('section',{className:'callout'},[el('h2',{textContent:'이름은 다른 곳과 맺은 약속이기도 해요.'}),el('p',{textContent:'다른 팀이나 외부 프로그램이 예전 키를 사용한다면, 내 코드만 고쳐서는 충분하지 않아요. 사용하는 곳을 확인하고 전환 순서와 기간을 함께 정해요.'})]),
      el('ol',{className:'handover-list'},[
        ['사용하는 곳 확인','누가 기존 필드를 읽는지 먼저 찾아요.'],['전환 기간 합의','필요하면 두 키에 같은 값을 담아 전달해요. 서로 다른 값으로 관리하지 않아요.'],['옛 이름 종료','모두 새 이름으로 옮긴 것을 확인한 뒤, 약속한 시점에 옛 키를 없애요.']
      ].map(([title,body],i)=>el('li',{},[el('span',{className:'handover-number',textContent:'0'+(i+1)}),el('div',{},[el('h3',{textContent:title}),el('p',{textContent:body})])]))),
      el('p',{className:'field-hint',textContent:'이 화면은 가상 데이터의 읽기 결과를 보여 줘요. 실제 API나 데이터베이스를 바꾸지 않아요.'}),pager(this)
    ]));this.select('legacy');
  }
  reader(title,key,name){return el('article',{className:'contract-reader'},[smallLabel(title),el('code',{textContent:'order.'+key}),this.readers[name]]);}
  select(mode){
    const state=contractPreview(mode);this.modes.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
    this.payload.replaceChildren(...recordRows(state.payload));
    for(const name of ['legacyReader','modernReader']){this.readers[name].textContent=readerValue(state[name]);this.readers[name].parentNode.dataset.ok=String(state[name].ok);}
    this.explanation.textContent={legacy:'기존 이름만 보내면 예전 영수증은 읽을 수 있어요. 새 이름을 기대하는 보고서는 읽지 못해요.',breaking:'새 이름만 보내면 새 보고서는 읽을 수 있어요. 아직 옮기지 않은 예전 영수증은 읽지 못해요.',transition:'전환 기간에는 두 키가 같은 값 10000을 가리켜요. 두 곳이 옮겨 갈 시간을 주고, 옛 키는 나중에 정리해요.'}[mode];
  }
}
