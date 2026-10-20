'use strict';
window.PeachAIAdmin=(()=>{
 let copyRequest=0,result=null,selectedProducts=[],dashboardData=null,example=false,charts=[],resizeObserver;
 const currency=n=>'¥'+Number(n||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
 const labels={home:'首页',consumer:'消费者端',ip:'小桃满IP',trace:'批次事实',service:'收货售后',evidence:'事实中心',operator:'协作运营',content:'内容工作室',rural:'农文旅',competition:'赛事讲解',records:'我的记录',api:'接口'};
 function dispose(){charts.forEach(c=>c.dispose());charts=[];resizeObserver?.disconnect();}
 function fillProduct(id){
   const p=selectedProducts.find(x=>x.id===id),f=document.querySelector('[data-form="ai-description"]');if(!p||!f)return;
   f.elements.weight.value=p.name.match(/\d+(?:[–—-]\d+)?斤/)?.[0]||'';
   f.elements.grade.value=/特大果/.test(p.name)?'特大果':/大果/.test(p.name)?'大果':'';
   f.elements.origin.value='';f.elements.scene.value=p.scene;f.elements.before.value=p.desc||'';f.elements.sourceRef.value=p.sourceRef||'已发布规格 '+p.id+'；产地与分级仍需按批次核验';invalidate();
 }
 function invalidate(){copyRequest++;result=null;const target=document.querySelector('#ai-copy-result');if(target){target.innerHTML='<div class="ai-result-placeholder"><img src="/assets/web/xiaotaoman.webp" alt=""><h3>先填事实，再整理表达。</h3><p>生成后在这里比较原文与新文案；不会自动上架。</p></div>';}}
 async function copyPage(){
   copyRequest++;selectedProducts=(await api('/catalog')).filter(p=>p.id!=='ip-card');result=null;
   return heading('AI商品描述生成器','输入已核对的规格，让规则模板整理成更清楚的商品表达。当前不调用外部模型。')+
   '<div class="ai-mode-note"><b>模板规则 · 无外部API费用</b><span>发布前仍需事实审核。输入不上传到第三方AI平台。</span></div><div class="ai-copy-layout"><section class="panel"><h2>商品事实</h2><form data-form="ai-description"><label>从已发布规格开始<select name="productId"><option value="">手动填写</option>'+selectedProducts.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><div class="form-grid"><label>重量 / 包装规格 *<input name="weight" maxlength="60" required placeholder="例如：5斤 / 12个装"></label><label>等级 / 分级 *<input name="grade" maxlength="80" required placeholder="请填写实际分级"></label><label class="full">标注产地 *<input name="origin" maxlength="120" required placeholder="填写经核对的产地"></label><label class="full">使用场景<select name="scene"><option value="family">家庭分享</option><option value="gift">礼赠</option><option value="group">社群拼单</option></select></label><label class="full">原始描述<textarea name="before" rows="3" maxlength="3000" placeholder="可保留原商品说明，用于对比"></textarea></label><label class="full">事实依据 *<input name="sourceRef" maxlength="300" required placeholder="批次记录 / 商品规格 / 核验记录"></label></div><p class="form-error" role="alert" hidden></p><button type="submit" class="primary">生成商品文案 ↗</button></form></section><section class="panel" id="ai-copy-result"><div class="ai-result-placeholder"><img src="/assets/web/xiaotaoman.webp" alt=""><h3>把这一箱桃，说得更清楚。</h3><p>填写左侧信息，查看前后对比。</p></div></section></div>';
 }
 function resultHTML(){
  return '<div class="panel-top"><h2>前后对比</h2><span class="ai-tag">规则生成 · 待审核</span></div><div class="ai-before"><small>原始描述</small><p>'+esc(result.before||'尚未填写原文，可按事实字段对照。')+'</p></div><div class="ai-after"><small>整理后文案</small><h3>'+esc(result.title)+'</h3><p>'+esc(result.body)+'</p></div><ul class="ai-warnings">'+result.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><div class="heading-actions">'+button('复制文案','ai-copy-output')+button('保存为待审核草稿','ai-save-draft','','primary')+'</div><p class="ai-save-note">保存后前往“草稿与审核”，提交复核并完成发布流程。</p>';
 }
 function sample(){
  const end=Date.parse(dashboardData.range.end+'T00:00:00Z'),daily=Array.from({length:7},(_,i)=>({date:new Date(end-(6-i)*86400000).toISOString().slice(0,10),orders:[2,3,1,5,4,6,3][i],netReceipts:[130,195,65,325,260,390,195][i]}));
  return {example:true,range:{...dashboardData.range,start:daily[0].date},sales:{daily,orders:24,netReceipts:1560,customers:18,undated:0},audience:{pv:286,uv:126,sessions:142,devices:[{name:'手机',value:231},{name:'电脑',value:55}],pages:[{name:'consumer',value:116},{name:'ip',value:72},{name:'trace',value:58},{name:'service',value:40}],regions:[{name:'广东',value:18},{name:'福建',value:4},{name:'其他',value:2}]},inventory:[{id:'示例家庭装批次',total:60,remaining:8,state:'low',status:'verified',threshold:10},{id:'示例礼盒批次',total:40,remaining:21,state:'normal',status:'verified',threshold:10},{id:'示例待核验批次',total:null,remaining:null,state:'unknown',status:'pending',threshold:10}],notes:['本页所有示例图表均为预设演示数据，不来源于订单、访客或库存，也不写入数据库。']};
 }
 function dashboardHTML(){
   const d=example?sample():dashboardData,alerts=d.inventory.filter(b=>b.state==='low'||b.state==='empty'),prefix=example?'示例 · ':'';
   return heading('AI辅助运营 · 数据看板','销售、访客和批次余量使用不同口径，建议由规则整理，经营判断由运营人员确认。',button(example?'返回真实数据':'查看示例图表','ai-dashboard-mode','','primary'))+
   '<div class="ai-mode-note '+(example?'ai-demo-banner':'')+'"><b>'+(example?'示例数据 · 非真实经营实绩':'真实记录 · 未产生数据时保持空白')+'</b><span>'+(example?'仅用于说明图表效果，不进入业务数据库。':'销售按签收日统计；浏览量不当作订单。')+'</span></div>'+
   '<form class="toolbar" data-form="ai-dates">'+dates()+'<button type="submit">查询日期</button><a href="#cms/ai_settings">管理规则与预警阈值 ↗</a></form><div class="stats">'+stat(prefix+'签收订单',number(d.sales.orders),'所选日期内完成签收')+stat(prefix+'签收订单净收款',currency(d.sales.netReceipts),'收款减退款 · 非净利润')+stat(prefix+'独立访客UV',number(d.audience.uv),'匿名浏览器估算')+stat(prefix+'库存预警批次',number(alerts.length),'仅检查已核验批次')+'</div>'+
   '<div class="ai-dashboard-grid"><section class="panel"><div class="panel-top"><h2>'+prefix+'销售趋势</h2><small>按签收日 / 元</small></div><div class="ai-chart" id="ai-sales-chart" role="img" aria-label="签收订单净收款趋势"></div><details class="ai-data-details"><summary>查看明细数据</summary>'+table(['日期','签收订单','净收款'],d.sales.daily.map(x=>[esc(x.date),number(x.orders),currency(x.netReceipts)]))+'</details></section>'+
   '<section class="panel"><div class="panel-top"><h2>'+prefix+'用户设备</h2><small>页面浏览次数PV</small></div><div class="ai-chart" id="ai-devices-chart" role="img" aria-label="访客设备分布"></div><p class="muted">PV '+number(d.audience.pv)+' · UV '+number(d.audience.uv)+' · 会话 '+number(d.audience.sessions)+'。同一访客可产生多次浏览。</p></section>'+
   '<section class="panel"><div class="panel-top"><h2>'+prefix+'页面偏好</h2><small>按PV排序</small></div><div class="ai-chart" id="ai-pages-chart" role="img" aria-label="页面浏览偏好"></div></section>'+
   '<section class="panel"><div class="panel-top"><h2>'+prefix+'签收订单地区</h2><small>省级聚合 / 订单数</small></div><div class="ai-chart" id="ai-regions-chart" role="img" aria-label="签收订单地区分布"></div></section></div>'+
   '<section class="panel ai-stock-panel"><div class="panel-top"><h2>'+prefix+'库存预警</h2><a href="#cms/batches">维护批次事实 ↗</a></div>'+table(['批次','总量（箱/盒）','可承接余量','预警阈值','状态'],d.inventory.map(b=>[esc(b.id),b.total==null?'未知':number(b.total),b.remaining==null?'待核验':number(b.remaining),number(b.threshold)+'箱/盒','<span class="ai-stock-state '+b.state+'">'+({unknown:'待核验，不按0计算',empty:'无可承接余量',low:'余量偏低',normal:'余量正常'}[b.state])+'</span>']))+'</section>'+
   '<section class="panel ai-notes"><h2>规则建议与数据口径</h2><p>'+(alerts.length?'存在 '+alerts.length+' 个批次触发库存阈值，请核对真实库存，再决定是否调整商品说明。':'当前未发现已核验批次触发库存阈值；待核验批次仍需补齐资料。')+'</p>'+d.notes.map(n=>'<p>'+esc(n)+'</p>').join('')+(d.sales.undated?'<p>有 '+number(d.sales.undated)+' 笔签收订单缺少签收日，未计入销售趋势。</p>':'')+'</section>';
 }
 function draw(){
  dispose();if(state.route!=='ai-dashboard'||!dashboardData)return;
  const d=example?sample():dashboardData;
  const base={animation:!matchMedia('(prefers-reduced-motion: reduce)').matches,animationDuration:450,color:['#397257','#c9a77b','#7eaaa1','#d8cbb5'],textStyle:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:13},aria:{enabled:true},tooltip:{trigger:'item',renderMode:'richText'},grid:{left:62,right:24,top:24,bottom:38}};
  const emptyGraphic={type:'text',left:'center',top:'middle',style:{text:'暂无真实数据\n登记后自动显示',fontSize:16,lineHeight:28,fill:'#7e9284',textAlign:'center'}};
  const plot=(id,option,empty)=>{const el=document.getElementById(id);if(!el||!window.echarts)return;const c=echarts.init(el,null,{renderer:'svg'});c.setOption({...base,...option,...(empty?{graphic:emptyGraphic}:{} )});charts.push(c);};
  plot('ai-sales-chart',{tooltip:{trigger:'axis',renderMode:'richText'},xAxis:{type:'category',data:d.sales.daily.map(x=>x.date.slice(5)),boundaryGap:false},yAxis:{type:'value',name:'元',splitLine:{lineStyle:{color:'#e4ebe1'}}},series:d.sales.orders?[{name:'签收订单净收款',type:'line',smooth:.25,data:d.sales.daily.map(x=>x.netReceipts),symbolSize:7,areaStyle:{color:'#c5ddc570'},lineStyle:{width:3}}]:[]},!d.sales.orders);
  const pie=(id,list)=>plot(id,{legend:{bottom:0,type:'scroll'},series:list.length?[{type:'pie',radius:['43%','68%'],center:['50%','44%'],label:{formatter:'{b}\n{d}%'},data:list}]:[]},!list.length);
  pie('ai-devices-chart',d.audience.devices);pie('ai-regions-chart',d.audience.regions);
  const pages=[...d.audience.pages].filter(x=>x.value>0).sort((a,b)=>a.value-b.value).slice(-6);
  plot('ai-pages-chart',{grid:{left:95,right:26,top:15,bottom:28},xAxis:{type:'value',minInterval:1},yAxis:{type:'category',data:pages.map(x=>labels[x.name]||x.name)},series:pages.length?[{name:'页面浏览PV',type:'bar',barWidth:19,itemStyle:{borderRadius:[0,7,7,0]},data:pages.map(x=>x.value)}]:[]},!pages.length);
  resizeObserver=new ResizeObserver(()=>charts.forEach(c=>c.resize()));document.querySelectorAll('.ai-chart').forEach(el=>resizeObserver.observe(el));
 }
 async function page(route){
   dispose();if(route==='ai-copy'){if(!canEdit())return heading('此账号没有文案编辑权限','请联系管理员分配内容编辑权限。');return copyPage();}
   const ticket=generation,d=await api('/admin/ai/dashboard?'+rangeQuery());if(ticket!==generation)return '';dashboardData=d;example=false;return dashboardHTML();
 }
 async function submit(form){
   if(form.dataset.form==='ai-dates'){state.start=form.elements.start.value;state.end=form.elements.end.value;await load();return true;}
   if(form.dataset.form!=='ai-description')return false;
   const values=Object.fromEntries(new FormData(form));delete values.productId;const request=++copyRequest,next=await api('/admin/ai/descriptions',{method:'POST',body:values});if(request!==copyRequest||!form.isConnected||state.route!=='ai-copy')return true;result=next;
   document.querySelector('#ai-copy-result').innerHTML=resultHTML();return true;
 }
 async function action(name){
   if(name==='ai-dashboard-mode'){example=!example;document.querySelector('#main-content').innerHTML=dashboardHTML();draw();return true;}
   if(name==='ai-copy-output'){if(!result)throw Error('请先生成文案');await navigator.clipboard.writeText(result.title+'\n'+result.body);notice('文案已复制，发布前请核验。');return true;}
   if(name==='ai-save-draft'){
     if(!result)throw Error('字段已变化，请重新生成文案');
     const d=await api('/admin/drafts',{method:'POST',body:{title:result.title,body:result.body,sourceRefs:[result.sourceRef,'模板规则生成；事实待人工复核']}});result=null;
     document.querySelector('#ai-copy-result .heading-actions').innerHTML='<a class="primary" href="#drafts">前往草稿与审核 ↗</a>';notice('已存入待审核草稿 '+d.id+'，尚未发布。');return true;
   }return false;
 }
 document.addEventListener('input',e=>{if(e.target.closest('[data-form="ai-description"]'))invalidate();});
 document.addEventListener('change',e=>{if(e.target.matches('[data-form="ai-description"] [name="productId"]'))fillProduct(e.target.value);else if(e.target.closest('[data-form="ai-description"]'))invalidate();});
 window.addEventListener('hashchange',dispose);
 return {page,mount:draw,submit,action,dispose};
})();

