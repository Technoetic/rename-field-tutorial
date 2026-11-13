import {el} from '../shared/dom.js';
import {Screen} from './screen.js';
import {routeLink,smallLabel} from './widgets.js';
export class NotFoundScreen extends Screen {
  setTitle(){this.ctx.setTitle('화면을 찾을 수 없어요 · '+this.data.tutorial.meta.appTitle);}
  render(){this.root.replaceChildren(el('section',{className:'screen not-found'},[
    smallLabel('404 / PAGE NOT FOUND'),el('div',{className:'missing-number','aria-hidden':'true',textContent:'{ ? }'}),el('h1',{textContent:'이 이름의 화면은 없어요.'}),el('p',{className:'lead',textContent:'주소를 확인하거나 처음 화면에서 다시 시작해 주세요.'}),routeLink('/','처음으로 돌아가기 →','btn btn-primary')
  ]));}
}
