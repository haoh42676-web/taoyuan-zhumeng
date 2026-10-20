import { Router } from 'express';
import { z } from 'zod';
import { AI_DEFAULTS,answerQuestion,generateDescription,recommendProducts } from '../ai-core.js';
import { published } from './content.js';
import { requireRole,audit } from './auth.js';
import { fail } from './modules.js';
import { range,analyticsSummary } from './analytics.js';
export async function intelligenceConfig(db){return {...AI_DEFAULTS,...(await published(db,'ai_settings'))[0]};}
const chatSchema=z.object({message:z.string().trim().min(1).max(500),productId:z.string().max(80).default(''),recordId:z.string().trim().max(100).default('')}).strict();
const descriptionSchema=z.object({weight:z.string().trim().min(1).max(60),grade:z.string().trim().min(1).max(80),origin:z.string().trim().min(1).max(120),scene:z.enum(['family','gift','group']),before:z.string().max(3000).default(''),sourceRef:z.string().trim().min(1).max(300)}).strict();
const recommendationSchema=z.object({scene:z.enum(['','family','gift','group']).default(''),history:z.array(z.object({id:z.string().max(80),at:z.number().int().nonnegative()})).max(50).default([])}).strict();
async function ownLogistics(db,req,recordId){
  if(!recordId)return null;
  const rows=(await db.query("SELECT o.data FROM workflow_items o JOIN business_records r ON r.id=o.data->>'sourceRecordId' WHERE o.kind='orders' AND r.id=$1 AND r.visitor_hash=$2 AND o.data->>'status' IN ('confirmed','shipped','completed') ORDER BY o.updated_at DESC LIMIT 1",[recordId,req.visitorHash])).rows;
  if(!rows[0])return {requested:true,found:false};
  const d=rows[0].data;return {found:true,status:d.status,carrier:d.carrier||'',trackingTail:String(d.trackingNo||'').slice(-4),shippedAt:d.shippedAt||''};
}
const cents=v=>Math.round(Number(v||0)*100);
const province=region=>{const known=['北京','天津','上海','重庆','河北','山西','辽宁','吉林','黑龙江','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','海南','四川','贵州','云南','陕西','甘肃','青海','台湾','内蒙古','广西','西藏','宁夏','新疆','香港','澳门'];return known.find(p=>String(region||'').includes(p))||'其他 / 未归类';};
export async function intelligenceDashboard(db,query){
  const r=range(query);
  if(Date.parse(r.end)-Date.parse(r.start)>92*86400000)fail(422,'智能看板日期范围不能超过93天');
  return db.transaction(async tx=>{
    if(db.kind==='postgres')await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    const orders=(await tx.query("SELECT data FROM workflow_items WHERE kind='orders'")).rows.map(r=>r.data);
    const completed=orders.filter(d=>d.status==='completed'&&d.receivedAt>=r.start&&d.receivedAt<=r.end);
    const daily=[];
    for(let t=Date.parse(r.start+'T00:00:00Z');t<=Date.parse(r.end+'T00:00:00Z');t+=86400000){const date=new Date(t).toISOString().slice(0,10),rows=completed.filter(d=>d.receivedAt===date);daily.push({date,orders:rows.length,netReceipts:rows.reduce((n,d)=>n+cents(d.receivedAmount)-cents(d.refundAmount),0)/100});}
    const batches=await published(tx,'batches'),config=await intelligenceConfig(tx);
    const inventory=batches.map(b=>({id:b.id,productId:b.productId||'',status:b.status,total:b.stock,remaining:b.status==='verified'?b.availableQuantity:null,threshold:config.lowStockThreshold,state:b.status!=='verified'||b.availableQuantity==null?'unknown':b.availableQuantity<=0?'empty':b.availableQuantity<=config.lowStockThreshold?'low':'normal'}));
    const regions=new Map();for(const d of completed){const k=province(d.shippingRegion);regions.set(k,(regions.get(k)||0)+1);}
    const analytics=await analyticsSummary(tx,query);
    return {example:false,range:{start:r.start,end:r.end,timeZone:'Asia/Shanghai'},sales:{orders:completed.length,netReceipts:completed.reduce((n,d)=>n+cents(d.receivedAmount)-cents(d.refundAmount),0)/100,customers:new Set(completed.map(d=>d.customerId).filter(Boolean)).size,daily,undated:orders.filter(d=>d.status==='completed'&&!d.receivedAt).length},audience:{pv:Number(analytics.total.pv),uv:Number(analytics.total.uv),sessions:Number(analytics.total.sessions),devices:analytics.devices.map(d=>({name:d.device,value:Number(d.pv)})),pages:analytics.pages.map(d=>({name:d.route,value:Number(d.pv)})),regions:[...regions].map(([name,value])=>({name,value}))},inventory,notes:['销售趋势只统计签收完成订单，按签收日归属，净收款=已核实收款−退款；退款变化会回溯更新，数值不等于净利润。','UV是匿名浏览器估算；访问、咨询与成交分别统计。订单地区仅按省级聚合，不输出姓名、电话或详细地址。','库存=已核验批次总量−成交已核实/已发货/已签收订单占用；待核验批次不按0库存处理。']};
  });
}
export function intelligenceRouter(db,send,limiter){
  const r=Router();
  r.post('/ai/chat',limiter(60,60000),async(req,res)=>{
    const p=chatSchema.parse(req.body),config=await intelligenceConfig(db);if(!config.chatEnabled)fail(403,'智能客服暂时暂停，请使用商品咨询或售后表单');
    const [products,faqs,batches]=await Promise.all([published(db,'products'),published(db,'faqs'),published(db,'batches')]);
    send(res,answerQuestion({...p,products,faqs,batches,config,logistics:await ownLogistics(db,req,p.recordId)}));
  });
  r.post('/ai/recommendations',limiter(90,60000),async(req,res)=>{
    const p=recommendationSchema.parse(req.body),config=await intelligenceConfig(db);
    send(res,{enabled:config.recommendationEnabled,provider:'rules',items:config.recommendationEnabled?recommendProducts({...p,products:await published(db,'products'),batches:await published(db,'batches'),limit:config.recommendationLimit}):[]});
  });
  r.post('/admin/ai/descriptions',requireRole('admin','operator','editor'),async(req,res)=>{
    const p=descriptionSchema.parse(req.body),config=await intelligenceConfig(db);if(!config.descriptionEnabled)fail(403,'商品文案生成暂时暂停');
    const data=generateDescription(p);await audit(db,req.user,'ai.description.generate','',{provider:'rules',sourceRef:p.sourceRef});send(res,data);
  });
  r.get('/admin/ai/dashboard',requireRole('admin','operator','viewer'),async(req,res)=>send(res,await intelligenceDashboard(db,req.query)));
  return r;
}

