const buyDialog = document.querySelector('#buy-dialog');
const socialDialog = document.querySelector('#social-dialog');
const dialogProduct = document.querySelector('#dialog-product');
const dialogTitle = document.querySelector('#dialog-title');

function openBuy(product) {
  dialogProduct.textContent = product ? `${product} · 先确认当季批次、运费与售后` : '选择规格后，扫码联系小桃满。';
  dialogTitle.textContent = product === '售后咨询' ? '扫码联系小桃满' : '扫码确认你的桃';
  buyDialog.showModal();
}

document.querySelectorAll('[data-buy]').forEach((button) => {
  button.addEventListener('click', () => openBuy(button.dataset.buy));
});

document.querySelectorAll('.dialog-close').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog = button.closest('dialog');
    if (dialog?.open) dialog.close();
  });
});

document.querySelectorAll('.dialog-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.dialogTab;
    document.querySelectorAll('.dialog-tab').forEach((item) => item.classList.toggle('is-active', item === tab));
    document.querySelectorAll('.dialog-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.dialogPanel === name));
  });
});

const socialContent = {
  wechat: { title: '微信咨询', kicker: '购买从确认开始', copy: '添加后发送想买的规格和收货地，小桃满会回复当季批次、运费与售后说明。', image: 'assets/wechat-contact.png', alt: '微信咨询二维码' },
  douyin: { title: '抖音看果园', kicker: '跟着小桃满看采摘', copy: '保存二维码，在抖音打开，查看果园、分拣和直播内容。', image: 'assets/douyin.png', alt: '抖音账号二维码' },
  xhs: { title: '小红书看礼盒', kicker: '把送礼灵感带回家', copy: '扫码查看礼盒、开箱和桃乡周边的更新。', image: 'assets/xiaohongshu.jpg', alt: '小红书账号二维码' },
};

document.querySelectorAll('[data-social]').forEach((button) => {
  button.addEventListener('click', () => {
    const item = socialContent[button.dataset.social];
    document.querySelector('#social-image').src = item.image;
    document.querySelector('#social-image').alt = item.alt;
    document.querySelector('#social-kicker').textContent = item.kicker;
    document.querySelector('#social-title').textContent = item.title;
    document.querySelector('#social-copy').textContent = item.copy;
    socialDialog.showModal();
  });
});

document.querySelectorAll('.filter-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.product-card').forEach((card) => {
      card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.category !== filter);
    });
  });
});

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileMenu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const traceCard = document.querySelector('[data-trace-card]');
if (traceCard && 'IntersectionObserver' in window) {
  const traceObserver = new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      traceCard.classList.add('is-visible');
      observer.disconnect();
    }
  }, { threshold: 0.28 });
  traceObserver.observe(traceCard);
} else {
  traceCard?.classList.add('is-visible');
}

document.querySelector('[data-back-top]')?.addEventListener('click', (event) => {
  event.preventDefault();
  event.currentTarget.blur();
  window.scrollTo({ top: 0, behavior: 'auto' });
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
});

// Clicking the dimmed backdrop closes native dialogs without extra UI.
[buyDialog, socialDialog].forEach((dialog) => dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));
