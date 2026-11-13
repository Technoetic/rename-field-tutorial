import {el} from '../shared/dom.js';
import {Screen} from './screen.js';
import {screenHead,button,pager,smallLabel} from './widgets.js';

export class StoryScreen extends Screen {
  render({tutorial}){
    this.step=0;this.buttons=[];this.scene=el('section',{className:'story-scene','aria-live':'polite'});
    const controls=el('div',{className:'step-controls','aria-label':'이야기 단계'},tutorial.story.steps.map((step,index)=>{
      const node=button('',()=>this.selectStep(index),{className:'step-button','aria-pressed':String(index===0),'data-story-step':String(index)});
      node.append(el('span',{className:'step-number',textContent:'0'+(index+1)}),el('span',{textContent:step.title}));this.buttons.push(node);return node;
    }));
    this.root.replaceChildren(el('section',{className:'screen'},[
      screenHead(tutorial.screens.story),controls,this.scene,
      el('section',{className:'definition-grid','aria-label':'세 가지 이름의 차이'},[
        this.definition('01','화면의 라벨','총 주문 금액','사람에게 보여 주는 글자예요. 라벨만 바꿔도 데이터 키는 그대로일 수 있어요.'),
        this.definition('02','객체를 담은 변수','order','주문 객체 자체를 가리켜요. 이번에 바꾸려는 이름은 이 변수가 아니에요.'),
        this.definition('03','객체 안의 필드','order.totalAmount','객체 안에서 값을 찾는 키예요. 이 이름과 사용하는 곳을 함께 바꿔요.')
      ]),pager(this)
    ]));this.selectStep(0);
  }
  definition(number,title,example,body){return el('article',{className:'definition-card'},[smallLabel(number+' / '+title),el('code',{textContent:example}),el('p',{textContent:body})]);}
  selectStep(index){
    this.step=index;this.buttons.forEach((node,i)=>node.setAttribute('aria-pressed',String(index===i)));
    const story=this.data.tutorial.story,step=story.steps[index];
    const key=index===0?'amt':'totalAmount',reader=index===2?'totalAmount':'amt';
    this.scene.replaceChildren(
      el('div',{className:'story-narrative'},[smallLabel('SCENE 0'+(index+1)),el('h2',{textContent:step.title}),el('p',{textContent:step.body}),
        el('p',{className:'callout',textContent:['주문 금액이라는 라벨을 붙여도, 실제 객체의 키는 아직 amt예요.','필드 키를 바꿨다면 예전 키 amt를 읽던 코드도 찾아야 해요.','데이터를 만드는 곳과 읽는 곳의 이름이 같아졌어요. 금액은 그대로예요.'][index]})]),
      el('div',{className:'story-visual'},[
        el('div',{className:'mini-receipt'},[smallLabel('CAFE / 주문표'),el('p',{className:'receipt-label',textContent:index===0?'주문 금액':'총 주문 금액'}),el('strong',{className:'receipt-amount',textContent:'10,000원'})]),
        el('div',{className:'story-object'},[smallLabel('실제 주문 객체'),el('code',{textContent:'const order = { '+key+': '+story.value+' };'}),
          el('p',{className:index===1?'reader-line is-missing':'reader-line'},[el('code',{textContent:'order.'+reader}),' → ',el('strong',{textContent:index===1?'필드 없음':String(story.value)})])])
      ])
    );
  }
}
