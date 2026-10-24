/* Check original-project Pages under a project subpath, without sending business data. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.PEACH_STATIC_BASE || 'http://127.0.0.1:8768/taoyuan-zhumeng/';
const output = process.env.PEACH_QA_OUTPUT || path.join(__dirname, '..', '.data', 'deploy', 'static-sync-20261024', 'local-check');
(async () => {
  await fs.mkdir(output, {recursive: true});
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, acceptDownloads: true});
  const page = await context.newPage(), errors = [], badResponses = [], requests = [], passed = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  page.on('response', r => {if (r.status() >= 400) badResponses.push({url: r.url(), status: r.status()});});
  const check = text => {passed.push(text); console.log('PASS ' + text);};
  async function go(route = 'home') {
    await page.goto(base + '#' + route);
    await page.waitForFunction(() => document.documentElement.dataset.presentation === 'practice' && window.TaoyuanApp);
  }
  try {
    await go();
    assert.deepEqual(await page.locator('#top-nav a[data-route]').allTextContents(), ['首页', '商品与溯源', '咨询与售后', '项目说明']);
    assert.equal(await page.locator('.entry-card:visible').count(), 3);
    assert.equal(await page.locator('.home-footer a[href="admin/"]').count(), 1);
    assert.equal(await page.locator('.home-footer a[href="https://shushang-taoxiang.onrender.com/admin/"]').count(), 1);
    await page.evaluate(() => localStorage.setItem('peach-digital-media-scope-check', 'unchanged'));
    check('four primary routes, three homepage cards and original-project links');
    await go('consumer');
    assert.equal(await page.locator('.compact-products > .product-grid > .product-card').count(), 2);
    const gifts = page.locator('.compact-products > details');
    assert.equal(await gifts.getAttribute('open'), null);
    await gifts.locator('summary').click();
    assert.ok(await gifts.locator('.product-card:visible').count() >= 3);
    await page.getByRole('button', {name: '查询批次', exact: true}).click();
    await page.locator('#app-modal[open]').waitFor();
    assert.match(await page.locator('#modal-content').innerText(), /SP-2026-06/);
    await page.locator('.modal-close').click();
    const recommendations = page.locator('.compact-ai-choice');
    await recommendations.locator('summary').click();
    await page.locator('#ai-recommendations .recommendation-card').first().waitFor();
    assert.equal(await page.locator('#home-view #ai-recommendations').count(), 0);
    check('two core products, folded extra specifications, batch query and preserved recommendations');
    await go('evidence');
    await page.getByRole('button', {name: '查看完整调查与来源', exact: true}).click();
    await page.getByRole('button', {name: '← 返回项目说明', exact: true}).waitFor();
    assert.ok(await page.locator('#secondary-view table').count() > 0);
    await page.getByRole('button', {name: '← 返回项目说明', exact: true}).click();
    await page.getByRole('button', {name: '查看完整调查与来源', exact: true}).waitFor();
    check('complete research remains reachable and returns to compact project explanation');
    await go('service');
    assert.equal(await page.getByRole('link', {name: '进入在线咨询与售后 ↗'}).getAttribute('href'), 'https://shushang-taoxiang.onrender.com/#service');
    await page.getByRole('button', {name: '提交商品咨询', exact: true}).click();
    const form = page.locator('[data-form="consultation"]');
    await form.locator('[name="name"]').fill('静态检查访客');
    await form.locator('[name="region"]').fill('演练地区');
    await form.locator('[name="consent"]').check();
    await form.locator('[type="submit"]').click();
    await page.getByRole('heading', {name: '已保存到本地记录', exact: true}).waitFor();
    await page.locator('.modal-close').click();
    await page.reload();
    await page.waitForFunction(() => window.TaoyuanApp);
    assert.ok(await page.evaluate(() => PeachAPI.snapshot().records.some(r => r.name === '静态检查访客' && r.mode === 'local')));
    assert.equal(await page.evaluate(() => localStorage.getItem('peach-digital-media-scope-check')), 'unchanged');
    check('consultation stays local across reload and sibling storage remains unchanged');
    await page.locator('#ai-chat-open').click();
    assert.equal(await page.locator('#ai-chat .chat-disclosure a').getAttribute('href'), 'https://shushang-taoxiang.onrender.com/#service');
    await page.locator('#chat-account-open').click();
    await page.locator('#customer-login [name="account"]').fill('test1');
    await page.locator('#customer-login [name="password"]').fill('123456');
    await page.locator('#customer-login button[type="submit"]').click();
    await page.locator('#ai-chat[open]').waitFor();
    await page.locator('#chat-message').fill('5斤家庭装的规格和价格是什么？');
    await page.locator('#ai-chat-form [type="submit"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.chat-message.assistant').length > 0 && !document.querySelector('#ai-chat-form [type="submit"]').disabled);
    assert.match(await page.locator('.chat-conversation').innerText(), /5斤|家庭/);
    assert.match(await page.locator('.chat-conversation').innerText(), /本地规则|规则引擎/);
    assert.equal(await page.locator('.chat-error').isVisible(), false);
    assert.doesNotMatch(await page.locator('#toast').innerText(), /未识别/);
    await page.locator('#ai-chat-close').click();
    check('Xiaotaoman login and local chat work, with the real AI entry preserved');
    await go('operator');
    assert.equal(await page.getByRole('link', {name: '进入AI商品文案生成 ↗'}).getAttribute('href'), 'https://shushang-taoxiang.onrender.com/admin/#ai-copy');
    await page.getByRole('button', {name: '本地草稿与复核演练 ↗'}).click();
    await page.locator('[data-form="draft"] [name="title"]').fill('静态同步草稿检查');
    await page.locator('[data-form="draft"] [type="submit"]').click();
    await page.getByRole('button', {name: '提交复核', exact: true}).click();
    await page.getByRole('button', {name: '事实复核', exact: true}).click();
    for (const checkbox of await page.locator('[data-review]').all()) await checkbox.check();
    await page.getByRole('button', {name: '生成本地发布记录', exact: true}).click();
    await page.locator('#app-modal[open]').waitFor();
    assert.match(await page.locator('#modal-content').innerText(), /静态同步草稿检查/);
    await page.locator('.modal-close').click();
    check('local draft, submission, seven-step review and local publication remain functional');
    await go();
    await page.screenshot({path: path.join(output, 'desktop.png'), fullPage: true});
    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 900});
      for (const route of ['home', 'consumer', 'evidence', 'service', 'operator']) {
        await go(route);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, width + 'px overflow ' + route);
      }
      await go();
      await page.screenshot({path: path.join(output, 'mobile-' + width + '.png'), fullPage: true});
    }
    check('desktop and 390px/320px layouts fit the viewport');
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto(base + 'admin/');
    await page.waitForFunction(() => window.PeachDemoAdmin);
    if (await page.locator('#demo-logout').isVisible()) await page.locator('#demo-logout').click();
    await page.locator('#demo-login-form [name="password"]').fill('123456');
    await page.locator('#demo-login-form [type="submit"]').click();
    await page.locator('#demo-workspace').waitFor({state: 'visible'});
    const nav = await page.locator('#demo-nav').innerText();
    for (const title of ['商品与批次', '内容生成与审核', '咨询与售后', '试行记录与复盘', '资料与设置']) assert.ok(nav.includes(title), title);
    for (const route of ['products', 'batches', 'content', 'opc', 'customers', 'records', 'orders', 'materials', 'settings']) {
      await page.goto(base + 'admin/#' + route);
      await page.waitForFunction(r => PeachDemoAdmin.route === r, route);
      assert.ok(await page.locator('tbody tr[data-row-id]').count() > 0, route);
    }
    assert.equal(await page.getByRole('link', {name: '正式后台 ↗', exact: true}).getAttribute('href'), 'https://shushang-taoxiang.onrender.com/admin/');
    check('static sandbox has five groups and all nine modules with original formal admin link');
    assert.deepEqual(errors, []);
    assert.deepEqual(badResponses, []);
    assert.equal(requests.some(url => /\/api\/|api\.deepseek|bigmodel\.cn/.test(url)), false);
    check('no script errors, failed assets, backend writes or direct model requests');
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({base, passed, errors, badResponses, requestCount: requests.length}, null, 2));
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
