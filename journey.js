/* Public guidance for the original project. Examples never enter business data. */
'use strict';
window.PeachJourney=function({api,state,renderers,openModal,esc,link,btn,download,copy,toast}){
 if(document.documentElement.dataset.presentation!=='practice')return;
 const online=api.mode==='server',live='https://shushang-taoxiang.onrender.com/';
 const action=(label,key,value='')=>`<button type="button" class="button button-small" data-journey-action="${key}" data-value="${esc(value)}">${label}</button>`;
 const context=()=>`<aside class="journey-context" aria-label="当前网站与记录保存方式"><div><strong>${online?'正式服务':'静态演练'}</strong><span>${online?'咨询提交给项目运营；在提交时使用的浏览器查看回复。':'表单、草稿与跟进只保存在当前浏览器，不会发送给项目运营。'}</span></div>${online?link('查看我的记录','records'):`<a href="${live}#service" target="_blank" rel="noopener">前往正式服务 ↗</a>`}</aside>`;
 const path=()=>`<nav class="journey-path" aria-label="选购与咨询流程"><ol><li>${link('01 选规格','consumer')}</li><li>${action('02 查批次','batch')}</li><li>${link('03 提交咨询','service')}</li><li>${link('04 查看回复','records')}</li></ol></nav>`;
 const followup=()=>`<section class="journey-followup"><h3>提交之后，怎样找回回复？</h3><ol><li><b>保存提交编号</b><span>提交成功后复制编号，或导出自己的记录。</span></li><li><b>回到“我的记录”</b><span>${online?'使用提交时的浏览器和访问记录，点击刷新处理进度。仅知道编号不能访问其他访客的记录。':'保持当前浏览器；本地演练不会产生运营回复，也不会与正式站同步。'}</span></li><li><b>查看处理结果</b><span>${online?'待跟进 → 处理中 → 处理完成；运费、发货和售后以运营核实的回复为准。':'可在演练记录中模拟跟进；需要实际处理，请进入正式服务重新提交。'}</span></li></ol><div class="action-row">${link('查看我的记录','records')}${online?'':`<a class="button button-small" href="${live}#service" target="_blank" rel="noopener">提交给项目运营 ↗</a>`}</div></section>`;
 const cards=[['product-information','售前商品信息卡','购买前核对规格、批次、到手总价与发货条件。'],['in-box-guide','随箱说明卡','收货时核对批次，了解保存方法与反馈入口。']];
 const cardSection=()=>`<section class="panel panel-pad journey-cards" aria-labelledby="journey-cards-title"><div class="compact-section-head"><span class="view-kicker">小桃满 · 信息服务工具</span><h3 id="journey-cards-title">两张卡，把购买和收货说明白。</h3><p>公开展示为可阅读、可下载的双卡模板；当批字段由运营核实后填写，不代表当前报价或售后承诺。</p></div><div class="journey-card-grid">${cards.map(([id,title,description])=>`<article><button type="button" class="journey-card-preview" data-journey-action="card" data-value="${id}" aria-label="放大查看${title}"><img src="assets/cards/${id}.svg" alt="${title}可打印模板" loading="lazy"></button><h4>${title}</h4><p>${description}</p><div class="action-row">${action('放大阅读','card',id)}<a class="button button-small" href="assets/cards/${id}.svg" download="小桃满_${title}_公开模板.svg">下载模板</a></div></article>`).join('')}</div><small>模板整理依据：实践创新报告3-1、3-2及4-1。原始交付版本与具体批次承诺以企业确认资料为准。</small></section>`;
 const exampleFacts=[['演练编号','DEMO-SP-001'],['对应规格','5斤家庭装（演练）'],['产地与发货地','广东连平上坪镇（虚拟演练字段）'],['采摘日期','2026-07-20（假设日期）'],['分级记录','按重量分档、记录称重与外观检查（流程示意）'],['配送与费用','假设寄往广东；运费与商品价分列展示（不提供实时报价）'],['发货安排','核对批次与收货地区后确认（流程示意）'],['售后处理','保留外箱、面单与果品照片，提交反馈，等待人工核验'],['资料来源','本页人工构造的功能演练，不是采摘台账或企业核验记录']];
 const fields=rows=>`<div class="fact-fields">${rows.map(([k,v])=>`<div class="fact-field"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
 const exampleIntro=()=>`<div class="journey-example-intro"><div><b>先看一条完整的溯源演练</b><p>演练字段与当前公开批次分开显示。下面仍可查询运营发布的批次；缺失信息不会被演练数据补写。</p></div>${action('查看完整演练示例','example')}</div>`;
 const evidence=()=>`<details class="compact-details journey-evidence"><summary>查看实践进度与成果依据</summary><div class="journey-milestones"><article><b>已完成 · 调研</b><p>三端有效问卷886份，访谈32人次；2026年7月实际驻村调研9天。</p><small>依据：实践创新报告2-1、3-2；完整统计见“查看完整调查与来源”。</small></article><article><b>已完成 · 内测与交付</b><p>报告记录了MVP与双卡内测、AI人工双审和企业交付应用；经营成效等待真实桃季试行验证。</p><small>依据：实践创新报告2-2、3-2、4-1。公开页面不代替应用证明和原始内测记录。</small></article><article><b>已形成 · 传播材料</b><p>报告记录8篇驻村纪实和5家媒体报道，传播与真实经营成效分别表述。</p><small>依据：实践创新报告4-1、附件03团队宣传与媒体宣传。</small><div class="action-row"><a href="https://mp.weixin.qq.com/s/MPYJegdLiRiXD9jNnLLPiw" target="_blank" rel="noopener">查看驻村纪实原文 ↗</a></div></article><article><b>计划 · 2027年7月</b><p>开展为期4周的桃季实单试行，逐单记录成本、咨询、履约与售后并按周复盘。</p><small>依据：实践创新报告5-2；属于后续计划。</small></article></div></details>`;
 const iteration=()=>`<details class="compact-details journey-iteration"><summary>为什么调整规格？查看V1→V2的设计依据</summary><div class="journey-card-grid"><article><span class="view-kicker">V1 · 调研中的约束</span><h4>大箱发货与首购顾虑</h4><p>报告记录9斤装省外运费约40—55元/箱，消费者对首购总价存在顾虑。</p></article><article><span class="view-kicker">V2 · 拟试行方案</span><h4>家庭装与尝鲜装</h4><p>聚焦5斤家庭装、2—3斤尝鲜装，前置展示规格与履约条件，配合包装防护和人工核实的售后规则。</p></article></div><p class="form-note">依据：实践创新报告3-2。历史调研运费不是当前报价；方案调整不表示已经证实增收或降低损耗。</p></details>`;
 const reviewExample=()=>`<details class="compact-details journey-review"><summary>看一个AI内容纠错与双审示例</summary><p class="form-note">以下是人工构造的流程示例，用来说明审核要求，不是历史AI输出、企业签批或真实发布记录。</p><ol class="journey-review-steps"><li><b>01 AI起草示意</b><p><s>全国包邮，采摘当天发货。</s><span class="journey-error-label">示例中的未核实承诺</span></p></li><li><b>02 青年纠错</b><p>删除“全国包邮”和“当天发货”，回查配送地区、费用与发货窗口。</p></li><li><b>03 企业终审</b><p>由有权限的人员核实商品、批次、价格和售后；未知字段保留待确认。</p></li><li><b>04 发布留痕</b><p>合适表述：“请先确认收货地区和当批发货安排，再核对商品价与运费。”真实发布保存来源、版本与审核记录。</p></li></ol><div class="action-row"><a class="button button-small" href="${live}admin/#ai-copy" target="_blank" rel="noopener">进入正式AI文案与审核 ↗</a></div></details>`;
 const clean=html=>html.replaceAll('以icanAIOPC角色设计为准：','').replaceAll('以icanAIOPC策划书4.2和项目现有素材为基准。','以项目品牌设计规范和现有素材为基准。').replaceAll('icanAIOPC','项目策划资料');
 const originals={...renderers};
 renderers.consumer=()=>originals.consumer().replace('<section class="compact-products">',path()+'<section class="compact-products">').replace('<div class="batch-search">',exampleIntro()+'<div class="batch-search">');
 renderers.service=()=>originals.service().replace('<div class="compact-service-grid">',path()+followup()+'<div class="compact-service-grid">');
 renderers.records=()=>originals.records().replace('<div class="section-toolbar">',`<div class="journey-record-help"><b>${online?'在原浏览器找回已提交记录':'这里只显示本地演练记录'}</b><p>${online?'页面只显示当前浏览器提交的记录。没有记录时，请确认使用同一网站、同一浏览器并保留访问数据；跨设备跟进请通过原咨询渠道联系运营。':'静态站与正式站的数据互不相通。关闭后能否找回取决于浏览器是否允许保存；建议先导出记录。'}</p>${link('返回咨询与售后','service')}</div><div class="section-toolbar">`);
 renderers.evidence=()=>{
  const html=originals.evidence();if(state.projectResearch)return html;
  return html.replace('已完成调研、原型与配套设计；经营成效待真实桃季试行验证。','已完成调研、工具内测及企业交付；计划于2027年7月开展4周实单试行。')
   .replace('<section class="compact-project-flow">',evidence()+iteration()+'<section class="compact-project-flow">')
   .replace('<section class="panel panel-pad compact-brand">',cardSection()+'<section class="panel panel-pad compact-brand">');
 };
 renderers.ip=()=>clean(originals.ip()).replace('<div class="ip-layout">',cardSection()+'<div class="ip-layout">');
 renderers.operator=()=>originals.operator().replace('<div class="compact-service-grid">',reviewExample()+'<div class="compact-service-grid">').replace('主模型接入、备用与规则回退机制保持现有配置；公开测试账号使用规则模式。','AI辅助表达，商品事实和服务承诺由人工审核；测试账号进入独立演练。');
 for(const [route,original] of Object.entries(renderers)){
  renderers[route]=()=>{const html=clean(original());return html.replace('<div class="view-shell">','<div class="view-shell">'+context());};
 }
 const homeNote=document.createElement('div');homeNote.className='journey-home-context';homeNote.innerHTML=context();document.querySelector('.hero-copy .hero-actions')?.before(homeNote);
 document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-journey-action]');if(!button)return;e.preventDefault();
  const type=button.dataset.journeyAction,value=button.dataset.value;
  if(type==='batch'){
   if(state.route!=='consumer'){location.hash='consumer';requestAnimationFrame(()=>document.querySelector('.compact-batch')?.scrollIntoView({block:'start',behavior:'smooth'}));}
   else document.querySelector('.compact-batch')?.scrollIntoView({block:'start',behavior:'smooth'});return;
  }
  if(type==='example'){
   openModal(`<span class="view-kicker">只读演练 · 不进入业务台账</span><h3 id="modal-title">完整溯源示例</h3><p class="notice">编号DEMO-SP-001的全部字段为演练示意，不代表真实采摘、核验或当前可售商品。</p><form class="journey-example-query"><label>输入演练编号<input name="exampleId" value="DEMO-SP-001" maxlength="50" required></label><button class="button button-small" type="submit">查询演练编号</button><p role="status" class="form-note" data-example-status>已显示完整演练字段。</p></form><div data-example-result>${fields(exampleFacts)}</div><div class="action-row">${action('下载演练小票','example-download')}${btn('关闭','close')}</div>`);return;
  }
  if(type==='example-download'){download('只读演练_DEMO-SP-001.json',JSON.stringify({notice:'全部为人工构造的功能演练，不是真实业务数据',fields:Object.fromEntries(exampleFacts)},null,2),'application/json');return;}
  if(type==='card'){
   const card=cards.find(x=>x[0]===value);if(!card)return;
   openModal(`<span class="view-kicker">公开模板 · 当批信息须核实后填写</span><h3 id="modal-title">${card[1]}</h3><p>${card[2]}</p><img class="journey-card-full" src="assets/cards/${card[0]}.svg" alt="${card[1]}完整可阅读模板"><div class="action-row"><a class="button" href="assets/cards/${card[0]}.svg" download="小桃满_${card[1]}_公开模板.svg">下载可打印模板</a>${btn('关闭','close')}</div>`);return;
  }
  if(type==='copy-receipt'){try{await copy(value,button);}catch{toast('请选中编号并复制。');}}
 });
 document.addEventListener('submit',e=>{
  const form=e.target.closest('.journey-example-query');if(!form)return;e.preventDefault();e.stopPropagation();
  const match=form.elements.exampleId.value.trim().toUpperCase()==='DEMO-SP-001';
  form.querySelector('[data-example-status]').textContent=match?'已找到演练编号DEMO-SP-001，以下均为演练字段。':'未找到该演练编号。请输入DEMO-SP-001；真实批次请回商品页查询。';
  document.querySelector('[data-example-result]').hidden=!match;
 });
};
