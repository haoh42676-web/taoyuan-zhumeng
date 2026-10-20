import {AI_DEFAULTS,answerQuestion,recommendProducts} from './ai-core.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='peach-recommendations:v1',DAY=86400000;
let products=[],faqs=[],batches=[],config={...AI_DEFAULTS},scene='',history=[],consent=false,dialog,conversation,busy=false,requestVersion=0;
function restore(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d?.enabled===true){consent=true;history=Array.isArray(d.history)?d.history.filter(x=>x&&typeof x.id==='string'&&Number.isFinite(x.at)&&Date.now()-x.at<30*DAY).slice(-50):[];}}catch{}}
function persist(){try{if(consent)localStorage.setItem(KEY,JSON.stringify({enabled:true,history}));else localStorage.removeItem(KEY);}catch{}}
async function getRecommendations(){
  if(window.PeachAPI.mode==='server')return (await window.PeachAPI.request('POST','/api/ai/recommendations',{scene,history:consent?history:[]})).data.items;
  return recommendProducts({products,history:consent?history:[],scene,batches,limit:config.recommendationLimit});
}
async function renderRecommendations(){
  const section=document.querySelector('#ai-recommendations');if(!section)return;const current=++requestVersion;
  try{
    const items=await getRecommendations();if(current!==requestVersion)return;
    section.querySelector('.recommendation-grid').innerHTML=items.length?items.map(({product:p,reasons,availability})=>'<article class="recommendation-card"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" loading="lazy"><div><h3>'+esc(p.name)+'</h3><p>'+esc(reasons.join(' · '))+'</p><small>'+esc(availability)+'</small><div class="recommendation-price"><b>'+esc(p.price)+'</b><span>'+esc(p.priceNote)+'</span><button type="button" data-action="product" data-value="'+esc(p.id)+'">查看规格 ↗</button></div></div></article>').join(''):'<p>暂无符合当前条件的已发布规格，请换个场景或咨询运营。</p>';
  }catch(e){if(current===requestVersion)section.querySelector('.recommendation-grid').textContent='推荐暂时无法加载，请稍后刷新。';}
}
function recommendations(){
  if(!config.recommendationEnabled)return;
  const s=document.createElement('section');s.id='ai-recommendations';s.className='content-width ai-recommendations';
  s.innerHTML='<div class="ai-section-heading"><div><span class="ai-eyebrow">按用途挑选 · 可解释规则推荐</span><h2>为您推荐</h2></div><label>我想选<select id="recommend-scene" aria-label="推荐用途"><option value="">先看看</option><option value="family">家庭鲜食</option><option value="gift">礼赠</option><option value="group">社群团购</option></select></label></div><div class="recommendation-grid" aria-live="polite"></div><div class="recommendation-privacy"><label><input type="checkbox" id="recommend-consent" '+(consent?'checked':'')+'> 使用近30天浏览偏好</label><span>偏好仅保存在当前浏览器；关闭会删除记录。推荐不保证可售或配送。</span><button type="button" id="recommend-clear">清除偏好</button></div>';
  document.querySelector('#home-view .dashboard')?.before(s);
  s.querySelector('#recommend-clear').dataset.action='ai-recommend-clear';
  s.querySelector('#recommend-scene').addEventListener('change',e=>{scene=e.target.value;renderRecommendations();});
  s.querySelector('#recommend-consent').addEventListener('change',e=>{consent=e.target.checked;if(!consent)history=[];persist();renderRecommendations();});
  s.querySelector('#recommend-clear').addEventListener('click',()=>{history=[];consent=false;s.querySelector('#recommend-consent').checked=false;persist();renderRecommendations();});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action="product"]');if(!b||!consent||!products.some(p=>p.id===b.dataset.value))return;history.push({id:b.dataset.value,at:Date.now()});history=history.slice(-50);persist();renderRecommendations();},true);
  window.addEventListener('storage',e=>{if(e.key===KEY){history=[];consent=false;restore();s.querySelector('#recommend-consent').checked=consent;renderRecommendations();}});
  renderRecommendations();
}
function addMessage(role,text,sources=[],route=''){
  const item=document.createElement('article');item.className='chat-message '+role;
  const who=document.createElement('b');who.textContent=role==='assistant'?'小桃满':'你';item.append(who);
  const body=document.createElement('p');body.textContent=text;item.append(body);
  if(sources.length){const refs=document.createElement('small');refs.textContent='依据：'+sources.map(s=>s.title+' · '+s.ref).join('；');item.append(refs);}
  if(route){const a=document.createElement('a');a.href='#'+route;a.textContent=({consumer:'前往商品咨询',service:'打开收货与售后',trace:'查看批次事实',records:'查看我的记录'})[route]||'继续查看';a.addEventListener('click',()=>dialog.close());item.append(a);}
  conversation.append(item);while(conversation.children.length>20)conversation.firstElementChild.remove();conversation.scrollTop=conversation.scrollHeight;
}
function chat(){
  if(!config.chatEnabled)return;
  const launcher=document.createElement('button');launcher.type='button';launcher.className='chat-launcher';launcher.id='ai-chat-open';launcher.setAttribute('aria-haspopup','dialog');launcher.innerHTML='<img src="assets/web/xiaotaoman.webp" alt=""><span>问问小桃满<small>产品 · 物流 · 售后</small></span>';
  dialog=document.createElement('dialog');dialog.id='ai-chat';dialog.className='ai-chat';dialog.setAttribute('aria-labelledby','ai-chat-title');
  dialog.innerHTML='<div class="chat-heading"><img src="assets/web/xiaotaoman.webp" alt=""><div><h2 id="ai-chat-title">小桃满智能客服</h2><p>规则匹配 · 未接入大模型</p></div><button type="button" id="ai-chat-close" aria-label="关闭客服">×</button></div><p class="chat-disclosure">回答依据已发布资料。'+(window.PeachAPI.mode==='server'?'查询登记物流需本浏览器的咨询编号。':'静态模式仅演练，不查询真实订单。')+' 对话仅在内存保留，请勿发送电话或详细地址。</p><details class="chat-context-options" open><summary>规格与物流编号</summary><div class="chat-context"><label>具体规格<select id="chat-product"><option value="">尚未选择</option>'+products.filter(p=>p.id!=='ip-card').map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><label>咨询编号（查物流时选填）<input id="chat-record" maxlength="100" placeholder="来自“我的记录”"></label></div></details><div class="chat-conversation" role="log" aria-live="polite" aria-label="客服对话"></div><div class="chat-shortcuts"><button type="button" data-chat-prompt="5斤家庭装的规格和价格是什么？">规格与价格</button><button type="button" data-chat-prompt="什么时候发货？包邮吗？">发货与运费</button><button type="button" data-chat-prompt="帮我查询物流到哪里了">查询物流</button><button type="button" data-chat-prompt="收到桃子有破损怎么办？">破损售后</button></div><form id="ai-chat-form"><label class="sr-only" for="chat-message">输入问题</label><textarea id="chat-message" maxlength="500" rows="2" required placeholder="请输入问题，最多500字"></textarea><div><button type="button" id="ai-chat-clear">清空对话</button><button type="submit">发送 ↗</button></div><p class="chat-error" role="alert" hidden></p></form>';
  launcher.dataset.action='ai-chat-open';dialog.querySelectorAll('button:not([type="submit"])').forEach(b=>b.dataset.action='ai-chat-control');
  document.body.append(launcher,dialog);conversation=dialog.querySelector('.chat-conversation');addMessage('assistant',config.welcomeMessage);
  launcher.addEventListener('click',()=>{dialog.showModal();dialog.querySelector('#chat-message').focus();});dialog.querySelector('#ai-chat-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('#ai-chat-clear').addEventListener('click',()=>{if(busy)return;conversation.replaceChildren();addMessage('assistant',config.welcomeMessage);});
  dialog.querySelectorAll('[data-chat-prompt]').forEach(b=>b.addEventListener('click',()=>{dialog.querySelector('#chat-message').value=b.dataset.chatPrompt;dialog.querySelector('#ai-chat-form').requestSubmit();}));
  dialog.querySelector('#ai-chat-form').addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;const input=dialog.querySelector('#chat-message'),message=input.value.trim();if(!message)return;
    busy=true;const buttons=dialog.querySelectorAll('button:not(#ai-chat-close)');buttons.forEach(b=>b.disabled=true);const error=dialog.querySelector('.chat-error');error.hidden=true;
    const productId=dialog.querySelector('#chat-product').value,recordId=dialog.querySelector('#chat-record').value.trim();input.value='';dialog.querySelector('.chat-context-options').open=false;if(conversation.children.length===1)conversation.replaceChildren();addMessage('user',message);
    try{const result=window.PeachAPI.mode==='server'?(await window.PeachAPI.request('POST','/api/ai/chat',{message,productId,recordId})).data:answerQuestion({message,productId,products,faqs,batches,config});addMessage('assistant',result.answer,result.sources,result.route);}
    catch(e){error.textContent=e.message||'暂时连接失败，请稍后重试。';error.hidden=false;input.value=message;}
    finally{busy=false;buttons.forEach(b=>b.disabled=false);input.focus();}
  });
}
try{
  await window.PeachAPI.ready;
  const result=await window.PeachAPI.request('GET','/api/catalog');
  products=Array.isArray(result.data)?result.data:result.data.items||result.data.products||[];
  const cms=window.PeachAPI.cms;if(cms){faqs=cms.faqs||[];batches=cms.batches||[];config={...config,...cms.ai_settings?.[0]};}
  restore();recommendations();chat();
}catch(e){console.warn('智能辅助功能未加载：'+e.message);}

