/* End-to-end guidance tests use an isolated database and the rules-only test account. */
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const {openDatabase,migrate}=await import('../server/db.js'),{seed}=await import('../server/content.js'),{createApp}=await import('../server/app.js');
 const db=await openDatabase({url:'',dataDir:'memory://'});await migrate(db);await seed(db);
 const server=createApp(db,{secret:'journey-test-only-secret-'.repeat(3),disableLimits:true}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base='http://127.0.0.1:'+server.address().port,out=path.join(__dirname,'..','test-results','journey');await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1440,height:1050},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));const ok=x=>{checks.push(x);console.log('PASS '+x);};
 const go=async r=>{await page.goto(base+'/#'+r);await page.waitForFunction(()=>window.TaoyuanApp&&document.querySelector('.journey-context'));};
 try{
  await go('consumer');const original=await page.evaluate(()=>({batch:TaoyuanApp.state.batchId,records:PeachAPI.snapshot().records.length}));
  assert.equal(await page.locator('.journey-path li').count(),4);
  await page.getByRole('button',{name:'查看完整演练示例',exact:true}).click();await page.locator('#app-modal[open]').waitFor();assert.match(await page.locator('#modal-content').innerText(),/不代表真实采摘/);
  await page.locator('[name=exampleId]').fill('UNKNOWN');await page.getByRole('button',{name:'查询演练编号',exact:true}).click();assert.equal(await page.locator('[data-example-result]').isVisible(),false);
  await page.locator('[name=exampleId]').fill('demo-sp-001');await page.getByRole('button',{name:'查询演练编号',exact:true}).click();assert.equal(await page.locator('[data-example-result]').isVisible(),true);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'下载演练小票',exact:true}).click();assert.match((await downloaded).suggestedFilename(),/DEMO-SP-001/);
  assert.deepEqual(await page.evaluate(()=>({batch:TaoyuanApp.state.batchId,records:PeachAPI.snapshot().records.length})),original);await page.locator('.modal-close').click();ok('Complete read-only batch example supports query and download without changing published batches or records');
  await go('service');assert.match(await page.locator('.journey-followup').innerText(),/待跟进 → 处理中 → 处理完成/);
  await page.getByRole('button',{name:'提交商品咨询',exact:true}).click();assert.match(await page.locator('#modal-content').innerText(),/原浏览器/);
  const f=page.locator('[data-form=consultation]');await f.locator('[name=name]').fill('本地流程验收');await f.locator('[name=region]').fill('广东深圳');await f.locator('[name=note]').fill('隔离数据库中确认咨询跟进流程');await f.locator('[name=consent]').check();await f.locator('[type=submit]').click();await page.locator('.receipt-number').waitFor();const id=await page.locator('.receipt-number').innerText();
  await page.getByRole('button',{name:'复制提交编号',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),id);
  await page.locator('#modal-content [data-route=records]').click();await page.locator('.record-card').first().waitFor();assert.match(await page.locator('.record-list').innerText(),new RegExp(id));assert.match(await page.locator('.journey-record-help').innerText(),/同一浏览器/);ok('Formal consultation gives a copyable receipt and reaches the same browser record list');
  await go('evidence');assert.match(await page.locator('.view-bar').innerText(),/工具内测及企业交付/);assert.match(await page.locator('.view-bar').innerText(),/2027年7月/);
  assert.equal(await page.locator('.journey-cards .journey-card-preview').count(),2);await page.locator('.journey-card-preview').first().click();await page.locator('.journey-card-full').waitFor();const svg=await context.request.get(base+'/assets/cards/product-information.svg');assert.equal(svg.status(),200);assert.match(await svg.text(),/当批字段须由运营核实后填写/);await page.locator('.modal-close').click();
  await go('ip');assert.doesNotMatch(await page.locator('#secondary-view').innerText(),/icanAIOPC/);ok('Report milestones, readable downloadable card templates and cleaned IP labels remain accessible');
  await go('operator');await page.locator('.journey-review summary').click();assert.match(await page.locator('.journey-review').innerText(),/不是历史AI输出/);assert.match(await page.locator('.journey-review').innerText(),/企业终审/);assert.equal(await page.locator('a[href="https://shushang-taoxiang.onrender.com/admin/#ai-copy"]').count(),1);ok('AI review illustration is clearly identified and retains the original real AI entry');
  await page.locator('#ai-chat-open').click();await page.locator('#chat-account-open').click();await page.locator('#customer-login [name=account]').fill('test1');await page.locator('#customer-login [name=password]').fill('123456');await page.locator('#customer-login [type=submit]').click();await page.locator('#ai-chat[open]').waitFor();
  let attempts=0;await page.route('**/api/ai/chat',async route=>{attempts++;if(attempts===1){await new Promise(r=>setTimeout(r,350));await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{message:'验收用临时连接失败'}})});}else await route.continue();});
  await page.locator('#chat-message').fill('5斤家庭装的规格和价格是什么？');await page.locator('#ai-chat-form [type=submit]').click();await page.locator('.chat-pending').waitFor();await page.locator('#ai-chat-retry').waitFor();assert.equal(await page.locator('#chat-message').inputValue(),'5斤家庭装的规格和价格是什么？');await page.locator('#ai-chat-retry').click();await page.locator('.chat-message.assistant').first().waitFor();await page.locator('.stream-controls button').click().catch(()=>{});await page.locator('.chat-pending').waitFor({state:'detached'});assert.equal(await page.locator('.chat-message.user').count(),1);assert.equal(attempts,2);assert.equal(await page.locator('.chat-recovery').isVisible(),false);await page.locator('#ai-chat-close').click();ok('AI waiting, preserved failed question and retry work without duplicating the question or calling a paid model');
  for(const width of [390,320]){await page.setViewportSize({width,height:900});for(const r of ['home','consumer','service','evidence','ip','operator','records']){await go(r);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),r+' overflow '+width);}}
  assert.deepEqual(errors,[]);ok('New guidance and cards fit 390px and 320px without page script errors');
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,errors,productionWrites:0,paidModelCalls:0},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
