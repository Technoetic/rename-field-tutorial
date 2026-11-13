import {el} from '../shared/dom.js';

export const routeLink=(path,label,className='btn btn-secondary',children=null)=>el('a',{href:'#'+path,'data-route':path,className},children??[label]);
export function screenHead(copy){return el('header',{className:'screen-head'},[
  el('p',{className:'eyebrow',lang:/[가-힣]/.test(copy.eyebrow)?'ko':'en',textContent:copy.eyebrow}),
  el('h1',{textContent:copy.title}),el('p',{className:'lead',textContent:copy.lead})
]);}
export const smallLabel=text=>el('p',{className:'label',textContent:text});
export const button=(label,onClick,attrs={})=>el('button',{type:'button',className:'btn btn-secondary',textContent:label,onclick:onClick,...attrs});
export function pager(screen){
  const routes=screen.data.tutorial.routes,index=routes.findIndex(route=>route.path===screen.entry.path);
  if(index<0)return null;
  const before=routes[index-1],after=routes[index+1];
  return el('nav',{className:'pager','aria-label':'이전·다음 학습'},[
    before?routeLink(before.path,'','pager-link',[
      el('span',{className:'pager-direction',textContent:'← 이전'}),el('strong',{textContent:before.shortTitle||before.title})
    ]):el('span'),
    after?routeLink(after.path,'','pager-link pager-next',[
      el('span',{className:'pager-direction',textContent:'다음 →'}),el('strong',{textContent:after.shortTitle||after.title})
    ]):routeLink('/','처음으로 돌아가기 ↗','pager-link pager-next')
  ]);
}
export function codeView(lines,label){return el('figure',{className:'code-figure'},[
  el('figcaption',{className:'code-caption',textContent:label}),
  el('pre',{className:'code-block',tabIndex:0,'aria-label':label},[el('code',{},lines.map((line,index)=>el('span',{className:'code-line'},[
    el('span',{className:'line-number','aria-hidden':'true',textContent:String(index+1).padStart(2,'0')}),el('span',{textContent:line})
  ])))])
]);}
export function recordRows(record){return Object.entries(record).map(([key,value])=>el('div',{className:'record-row'},[
  el('code',{className:'record-key',textContent:key}),el('span',{className:'record-colon','aria-hidden':'true',textContent:':'}),el('strong',{className:'record-number',textContent:String(value)})
]));}
export const readerValue=reader=>reader.ok?String(reader.value):'필드를 찾을 수 없어요';
