import {el} from '../shared/dom.js';
import {Screen} from './screen.js';
import {button,routeLink,smallLabel} from './widgets.js';

export class HomeScreen extends Screen {
  render({tutorial}){
    this.renamed=false;
    this.key=el('code',{className:'hero-key','data-testid':'hero-key',textContent:'amt'});
    this.renameButton=button('이름을 바꿔 볼까요? ↗',()=>this.toggle(),{className:'rename-trigger','data-action':'hero-rename','aria-pressed':'false'});
    this.heroNote=el('p',{className:'hero-note',role:'status',textContent:'amt. 이 세 글자만 보고 무슨 값인지 알 수 있을까요?'});
    const cards=[
      ['01','/story','이름에 담긴 의미','라벨, 변수, 필드. 무엇이 다를까요?'],
      ['02','/lab','직접 바꿔 보기','이름을 쓰는 곳까지 함께 바꿔요.'],
      ['03','/contract','다른 곳과의 약속','오래된 이름을 읽는 곳이 있다면?'],
      ['04','/practice','내 것으로 만들기','여섯 가지 상황에서 판단해 봐요.'],
      ['05','/code','코드로 확인하기','바뀐 이름과 그대로인 값을 비교해요.'],
      ['06','/summary','한 장으로 가져가기','다음 리팩토링에 쓸 체크리스트.']
    ];
    this.root.replaceChildren(el('div',{className:'home-screen'},[
      el('section',{className:'hero'},[
        el('div',{className:'hero-copy'},[
          el('p',{className:'eyebrow',lang:'en',textContent:'A SMALL CHANGE. A CLEARER MEANING.'}),
          el('h1',{className:'hero-title',lang:'en'},[el('span',{textContent:'RENAME'}),el('span',{className:'hero-title-second'},[el('span',{className:'hero-slash',textContent:'/ '}),'FIELD'])]),
          el('p',{className:'hero-kicker',textContent:'같은 값, 더 분명한 이름.'}),
          el('p',{className:'hero-description',textContent:'카페 주문 데이터의 짧은 이름 하나를 바꿔 보세요. 코드를 읽는 사람이 값의 뜻을 바로 알아보도록.'}),
          el('div',{className:'hero-actions'},[routeLink('/story','이야기 시작하기 →','btn btn-primary'),routeLink('/lab','바로 실험하기','text-link')]),
          el('p',{className:'hero-meta',textContent:'처음 배우는 리팩토링 · 읽고, 바꾸고, 확인하기'})
        ]),
        el('figure',{className:'hero-demo'},[
          el('figcaption',{className:'demo-topline'},[el('span',{lang:'en',textContent:'ORDER / 001'}),el('span',{className:'live-pill',textContent:'직접 눌러 보세요'})]),
          el('div',{className:'demo-stage'},[
            el('span',{className:'demo-brace','aria-hidden':'true',textContent:'{'}),
            el('div',{className:'demo-property'},[smallLabel('주문 데이터의 필드 이름'),this.key,el('span',{className:'demo-divider','aria-hidden':'true',textContent:'↓'}),
              el('div',{className:'hero-amount'},[el('strong',{'data-testid':'hero-value',textContent:'10000'}),el('span',{textContent:'원'})]),
              el('span',{className:'same-value',textContent:'값은 그대로'})
            ]),el('span',{className:'demo-brace closing','aria-hidden':'true',textContent:'}'})
          ]),this.renameButton,this.heroNote,
          el('div',{className:'demo-footnote'},[el('span',{className:'teal-dot','aria-hidden':'true'}),el('span',{textContent:'이름은 달라져도, 주문 금액은 같아요.'})])
        ])
      ]),
      el('section',{className:'principle-strip','aria-label':'이번 학습의 핵심'},[
        el('span',{className:'strip-index',textContent:'THE IDEA'}),el('p',{},[el('code',{textContent:'amt'}),'라는 추측을 ',el('code',{textContent:'totalAmount'}),'라는 설명으로.']),el('span',{className:'strip-arrow','aria-hidden':'true',textContent:'↗'})
      ]),
      el('section',{className:'journey'},[
        el('div',{className:'section-title'},[el('div',{},[smallLabel('LEARNING JOURNEY'),el('h2',{textContent:'작은 이름에서 시작하는 여섯 걸음'})]),el('p',{textContent:'한 카페의 주문을 따라가며 배워요.'})]),
        el('div',{className:'journey-grid'},cards.map(([number,path,title,description])=>routeLink(path,'','journey-card',[
          el('span',{className:'journey-number',textContent:number}),el('span',{className:'journey-arrow','aria-hidden':'true',textContent:'↗'}),el('h3',{textContent:title}),el('p',{textContent:description})
        ])))
      ]),
      el('aside',{className:'home-note'},[smallLabel('REFACTORING NOTE'),el('p',{textContent:'좋은 이름은 코드를 읽는 다음 사람을 위한 설명이에요.'}),el('span',{textContent:'예제는 가상의 카페 주문 데이터로 새로 만들었어요.'})])
    ]));
  }
  toggle(){
    this.renamed=!this.renamed;this.key.textContent=this.renamed?'totalAmount':'amt';
    this.key.dataset.renamed=String(this.renamed);this.renameButton.setAttribute('aria-pressed',String(this.renamed));
    this.renameButton.textContent=this.renamed?'원래 이름과 비교하기 ↺':'이름을 바꿔 볼까요? ↗';
    this.heroNote.textContent=this.renamed?'totalAmount. 이제 총 주문 금액이라는 뜻이 보여요. 값 10000은 그대로예요.':'amt. 이 세 글자만 보고 무슨 값인지 알 수 있을까요?';
  }
}
