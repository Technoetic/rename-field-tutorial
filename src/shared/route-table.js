export const ROUTE_TABLE=Object.freeze([
  {path:'/',screen:'home'},
  {path:'/story',screen:'story'},
  {path:'/lab',screen:'lab'},
  {path:'/contract',screen:'contract'},
  {path:'/practice',screen:'practice'},
  {path:'/code',screen:'code'},
  {path:'/summary',screen:'summary'},
  {path:'/missing',screen:'notFound'}
].map(Object.freeze));
const byPath=new Map(ROUTE_TABLE.map(entry=>[entry.path,entry]));
export const routeFor=path=>byPath.get(path)||byPath.get('/missing');
export const isScreenPath=path=>byPath.has(path);
