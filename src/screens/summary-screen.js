import {el} from '../shared/dom.js';
import {Screen} from './screen.js';
import {pager,routeLink,screenHead,smallLabel} from './widgets.js';

export class SummaryScreen extends Screen {
  render({tutorial}){
    this.root.replaceChildren(el('section',{className:'screen summary-screen'},[
      screenHead(tutorial.screens.summary),
      el('div',{className:'summary-statement'},[smallLabel('TAKE THIS WITH YOU'),el('p',{},['필드의 이름은 ',el('strong',{textContent:'값의 뜻'}),'을 말해요.']),el('div',{className:'summary-equation'},[el('code',{textContent:'amt'}),el('span',{'aria-hidden':'true',textContent:'→'}),el('code',{textContent:'totalAmount'})]),el('span',{textContent:'10000 → 10000 · 같은 결과'})]),
      el('section',{className:'summary-checklist'},[el('h2',{textContent:'이름을 바꾸기 전, 그리고 바꾼 뒤'}),el('ol',{},tutorial.summary.points.map((point,index)=>el('li',{},[el('span',{className:'checklist-number',textContent:String(index+1).padStart(2,'0')}),el('p',{textContent:point})])))]),
      el('div',{className:'actions'},[routeLink('/lab','다른 이름으로 실험하기 ↗','btn btn-primary'),routeLink('/practice','연습 다시 보기','btn btn-secondary')]),
      el('section',{className:'source-note'},[smallLabel('READ THE ORIGINAL'),el('h2',{textContent:'더 읽어 보기'}),el('p',{textContent:'Martin Fowler의 Rename Field 카탈로그를 함께 읽어 보세요. 이 튜토리얼의 카페 이야기와 예제는 새로 만들었어요.'}),
        tutorial.summary.sources.filter(source=>/^https:\/\//.test(source.url)).map(source=>el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer',className:'source-link',textContent:source.title+' ↗'}))]),pager(this)
    ]));
  }
}
