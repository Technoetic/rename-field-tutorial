import {StorageService} from './storage-service.js';

export const LAB_DRAFT_KEY='rename-field-tutorial:lab-draft:v1';
const fields=new Set(['schema','newName','producer','receipt','report','savedAt']);

export function validateLabDraft(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).some(k=>!fields.has(k)))throw new TypeError('실습 저장 형식을 읽을 수 없어요.');
 if(value.schema!==1||typeof value.newName!=='string'||value.newName.length>100||!['producer','receipt','report'].every(k=>typeof value[k]==='boolean'))throw new TypeError('실습 저장 값이 올바르지 않아요.');
 if(Object.hasOwn(value,'savedAt')&&(typeof value.savedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value.savedAt)||!Number.isFinite(Date.parse(value.savedAt))))throw new TypeError('실습 저장 시각이 올바르지 않아요.');
 return {schema:1,newName:value.newName,producer:value.producer,receipt:value.receipt,report:value.report,...(Object.hasOwn(value,'savedAt')?{savedAt:value.savedAt}:{})};
}

export class LabStorageService extends StorageService {
 constructor(options={}){super({...options,key:LAB_DRAFT_KEY,validate:validateLabDraft});}
}
