/**
 * header — Walgreens site chrome (ported from the source EDS header block) with the Commerce
 * storefront wired in: promo bar + top row (menu / logo / search / store / account / cart) + nav
 * row (click-to-open dropdown panels) + mobile menu.
 *
 * The nav document (/content/nav.plain.html locally, /nav.plain.html in production) has one
 * default-content section per slot, in this order:
 *   1. promo    <ul> of links
 *   2. brand    <p><a><img></a></p>
 *   3. search   <p><a href>label</a></p> — label = the input placeholder / accessible name
 *   4. store    <p>text</p> — optional, recognised by shape (no link, list or image)
 *   5. account  <p>trigger label</p> + <ul> of links
 *   6. nav      <ul>: <li>label<ul>…</ul></li> (dropdown) | <li><a/></li> (direct link); inside a
 *               panel a plain <li> is the panel title, <li>group<ul>…</ul></li> is a link group;
 *               the last top-level item is pushed to the row end
 *   7. cart     <p><a href>label</a></p> — label visually hidden, icon rendered by the block
 * Live delivery may wrap a list item's inline run in <p>; it is unwrapped.
 *
 * Commerce: the search input drives the product-discovery popover (submit → /search?q=), the
 * account panel shows the storefront signed-out / signed-in state, the cart link opens the
 * mini-cart panel and carries the cart item-count badge.
 */

// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';
import { getCookie } from '@dropins/tools/lib.js';

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  decorateLinks,
  fetchPlaceholders,
  getProductLink,
  rootLink,
} from '../../scripts/commerce.js';

// the source breakpoint (lsg .hide-on-mobile / .show-on-mobile twins)
const isDesktop = window.matchMedia('(min-width: 768px)');

// ── inline icons (32x32 glyphs lifted from the source header) ──
const ICONS = {
  menu: ['M10.624 14.400c-0.208 0-0.384-0.176-0.384-0.384s0.176-0.384 0.384-0.384l10.768-0.048c0 0 0 0 0 0 0.208 0 0.384 0.176 0.384 0.384s-0.176 0.384-0.384 0.384l-10.768 0.048c0 0 0 0 0 0z', 'M10.624 17.424c-0.208 0-0.384-0.176-0.384-0.384s0.176-0.384 0.384-0.384l10.768-0.048c0 0 0 0 0 0 0.208 0 0.384 0.176 0.384 0.384s-0.176 0.384-0.384 0.384l-10.768 0.048c0 0 0 0 0 0z', 'M10.624 20.448c-0.208 0-0.384-0.176-0.384-0.384s0.176-0.384 0.384-0.384l10.768-0.048c0 0 0 0 0 0 0.208 0 0.384 0.176 0.384 0.384s-0.176 0.384-0.384 0.384l-10.768 0.048c0 0 0 0 0 0z'],
  search: ['M30.080 27.782l-6.807-6.865c1.513-2.036 2.415-4.567 2.415-7.302 0-6.691-5.44-12.16-12.131-12.16-6.662 0-12.102 5.469-12.102 12.189s5.44 12.189 12.102 12.189c2.793 0 5.382-0.96 7.447-2.589l6.807 6.836c0.32 0.32 0.727 0.465 1.135 0.465s0.815-0.145 1.135-0.465c0.611-0.64 0.611-1.658 0-2.298zM4.684 13.644c0-4.945 3.985-8.96 8.902-8.96s8.902 4.015 8.902 8.96-4.015 8.931-8.931 8.931c-4.887 0-8.873-4.015-8.873-8.931z'],
  pin: ['M16 30.545c-0.669 0-1.309-0.233-1.833-0.669-3.113-2.705-10.385-9.658-10.385-16.204 0-6.749 5.469-12.218 12.218-12.218s12.218 5.469 12.218 12.218c0 6.575-7.273 13.527-10.385 16.204-0.524 0.436-1.164 0.669-1.833 0.669zM16 3.636c-5.527 0-10.007 4.509-10.007 10.036 0 5.818 7.36 12.596 9.629 14.545 0.233 0.204 0.553 0.204 0.785 0 2.269-1.949 9.629-8.727 9.629-14.545-0.029-5.527-4.509-10.036-10.036-10.036z', 'M16 19.025c-3.113 0-5.673-2.531-5.673-5.644s2.56-5.644 5.673-5.644 5.673 2.531 5.673 5.644-2.56 5.644-5.673 5.644zM16 9.338c-2.24 0-4.073 1.804-4.073 4.044s1.833 4.044 4.073 4.044 4.073-1.804 4.073-4.044-1.833-4.044-4.073-4.044z'],
  avatar: ['M28.16 22.807c-0.175-2.385-1.542-4.8-3.724-6.691-0.989-0.844-2.095-1.513-3.258-2.036 1.222-1.251 1.978-2.967 1.978-4.887-0.029-4.102-3.345-7.738-7.156-7.738s-7.127 3.636-7.127 7.767c0 1.92 0.756 3.636 1.978 4.887-4.015 1.745-6.749 5.353-7.011 8.698-0.175 2.415-0.058 4.276 1.193 5.615 1.658 1.804 4.975 2.124 10.851 2.124h0.204c5.905 0 9.193-0.32 10.851-2.124 1.251-1.338 1.396-3.229 1.222-5.615zM16 3.811c2.502 0 4.771 2.589 4.771 5.411 0 2.647-2.036 4.655-4.771 4.655-2.705 0-4.771-2.007-4.771-4.655 0-2.822 2.269-5.411 4.771-5.411zM25.222 26.822c-1.076 1.135-4.276 1.367-9.135 1.367h-0.204c-4.858 0-8.058-0.233-9.135-1.367-0.553-0.611-0.727-1.716-0.582-3.84 0.233-2.967 3.171-6.225 7.127-7.244 0.815 0.32 1.716 0.495 2.647 0.495s1.833-0.175 2.647-0.495c4.044 1.018 6.982 4.276 7.215 7.244 0.145 2.124 0 3.229-0.582 3.84z'],
  cart: ['M30.022 9.92c-0.524-0.756-1.396-1.193-2.327-1.193h-18.88l-1.135-2.938c-0.407-1.105-1.484-1.833-2.676-1.833h-2.385c-0.64 0-1.164 0.524-1.164 1.164s0.524 1.164 1.164 1.164h2.415c0.204 0 0.407 0.145 0.495 0.349l6.313 16.524c0.233 0.582 0.64 1.076 1.164 1.396-0.087 0.262-0.116 0.524-0.116 0.815 0 1.513 1.222 2.705 2.705 2.705s2.705-1.222 2.705-2.705c0-0.116 0-0.262-0.029-0.378h3.782c-0.029 0.116-0.029 0.262-0.029 0.378 0 1.513 1.222 2.705 2.705 2.705s2.705-1.222 2.705-2.705-1.222-2.705-2.705-2.705c-0.058 0-0.087 0-0.145 0-0.029 0-0.087 0-0.116 0h-9.949c-0.204 0-0.407-0.145-0.495-0.349l-0.378-0.989h11.724c1.222 0 2.298-0.785 2.705-1.949l2.327-6.865c0.291-0.873 0.145-1.862-0.378-2.589zM15.564 26.269c-0.495 0-0.902-0.407-0.902-0.902s0.407-0.902 0.902-0.902c0.495 0 0.902 0.407 0.902 0.902 0.029 0.495-0.378 0.902-0.902 0.902zM24.698 26.269c-0.495 0-0.902-0.407-0.902-0.902s0.407-0.902 0.902-0.902c0.495 0 0.902 0.407 0.902 0.902 0.029 0.495-0.378 0.902-0.902 0.902zM28.189 11.753l-2.327 6.865c-0.087 0.204-0.262 0.349-0.495 0.349h-12.625l-3.025-7.913h17.978c0.233 0 0.378 0.145 0.436 0.233 0.058 0.058 0.145 0.233 0.058 0.465z'],
  chevron: ['M9.792 30.046c-0.421 0-0.843-0.169-1.18-0.478-0.646-0.646-0.646-1.685 0-2.332l11.237-11.236-11.236-11.236c-0.646-0.646-0.646-1.685 0-2.332s1.685-0.646 2.332 0l12.416 12.388c0.646 0.646 0.646 1.685 0 2.332l-12.416 12.388c-0.309 0.337-0.73 0.506-1.152 0.506z'],
};

function icon(name, className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `hdr-icon ${className}`);
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  ICONS[name].forEach((d) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    svg.append(p);
  });
  return svg;
}

function el(tag, className, attrs = {}) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

// read-only classification helper — decisions only, never displayed text
const text = (node) => (node ? node.textContent.trim() : '');

/** nodes of `parent` other than `except`, without whitespace-only text runs */
const contentNodes = (parent, except = null) => [...parent.childNodes]
  .filter((n) => n !== except && !(n.nodeType === Node.TEXT_NODE && !n.textContent.trim()));

/** live delivery wraps a list item's inline run in <p> — unwrap so `li > a` shapes hold */
function unwrapParagraphs(li) {
  li.querySelectorAll(':scope > p').forEach((p) => p.replaceWith(...p.childNodes));
}

const pathOf = (a) => {
  try {
    return new URL(a.getAttribute('href'), window.location.href).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
};

let idSeq = 0;
const nextId = (prefix) => {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
};

// ── nav document ──

/**
 * Fetches the nav document (metadata-independent: local /content/ tree first, then the root) and
 * resolves its relative media against the fetched document's directory.
 * @returns {Promise<HTMLElement|null>} the parsed <body>
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const base = new URL('.', resp.url || new URL('/nav.plain.html', window.location.href));
  const resolve = (value) => new URL(value, base).href;
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', resolve(img.getAttribute('src')));
  });
  doc.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset').split(',').map((candidate) => {
      const [url, ...descriptors] = candidate.trim().split(/\s+/);
      return [resolve(url), ...descriptors].join(' ');
    });
    source.setAttribute('srcset', srcset.join(', '));
  });
  return doc.body;
}

/**
 * Classifies the nav document's sections into slots. Positional except the optional store section,
 * which is recognised by shape (a bare paragraph — no link, list or image).
 */
function slotSections(body) {
  const q = [...body.children].filter((sec) => sec.tagName === 'DIV');
  const slots = {};
  slots.promo = q.shift();
  slots.brand = q.shift();
  slots.search = q.shift();
  const next = q[0];
  if (next && !next.querySelector('a, ul, ol, picture, img') && next.querySelector('p')) {
    slots.store = q.shift();
  }
  slots.account = q.shift();
  slots.nav = q.shift();
  slots.cart = q.shift();
  return slots;
}

// ── dropdown state: trigger → { panel, onOpen } ──
const controls = new WeakMap();

function setOpen(trigger, open) {
  const control = controls.get(trigger);
  if (!control) return;
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  trigger.classList.toggle('is-open', open);
  control.panel.hidden = !open;
  if (open && control.onOpen) control.onOpen();
}

// the panel's visibility is the source of truth; aria-expanded mirrors it
function isOpen(trigger) {
  const control = controls.get(trigger);
  return !!control && !control.panel.hidden;
}

function openTriggers(root) {
  return [...root.querySelectorAll('[aria-controls]')].filter(isOpen);
}

function closeAll(root, except = null) {
  openTriggers(root).forEach((t) => { if (t !== except) setOpen(t, false); });
}

function toggle(root, trigger) {
  const open = !isOpen(trigger);
  closeAll(root, trigger);
  setOpen(trigger, open);
}

function register(trigger, panel, onOpen = null) {
  controls.set(trigger, { panel, onOpen });
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', panel.id);
  panel.hidden = true;
}

function toggleMenu(root, forceExpanded = null) {
  const btn = root.querySelector('.hdr-menu');
  const expanded = forceExpanded !== null ? !forceExpanded : root.getAttribute('aria-expanded') === 'true';
  const next = expanded ? 'false' : 'true';
  root.setAttribute('aria-expanded', next);
  btn.setAttribute('aria-expanded', next);
  btn.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  if (expanded) closeAll(root);
}

// ── nav row ──

function decorateDropdownList(ul, level) {
  ul.classList.add('hdr-dd-list', `hdr-dd-list-l${level}`);
  ul.querySelectorAll(':scope > li').forEach((li) => {
    unwrapParagraphs(li);
    const sub = li.querySelector(':scope > ul');
    const link = li.querySelector(':scope > a');
    if (sub) {
      li.classList.add('hdr-dd-item', 'hdr-dd-item-has-children');
      if (!link) {
        const group = el('span', 'hdr-dd-group');
        group.append(...contentNodes(li, sub));
        li.prepend(group);
      }
      decorateDropdownList(sub, level + 1);
    } else if (link) {
      li.classList.add('hdr-dd-item');
    } else {
      li.classList.add('hdr-dd-section');
    }
  });
}

function decorateNav(ul, root) {
  ul.classList.add('hdr-nav-list');
  const items = [...ul.querySelectorAll(':scope > li')];
  items.forEach((li, i) => {
    unwrapParagraphs(li);
    li.classList.add('hdr-nav-item');
    if (i === items.length - 1 && items.length > 1) li.classList.add('hdr-nav-item-end');
    const sub = li.querySelector(':scope > ul');
    const link = li.querySelector(':scope > a');
    if (!sub) {
      if (link) {
        link.classList.add('hdr-nav-link');
        const span = el('span');
        span.append(...link.childNodes);
        link.append(span);
      }
      return;
    }
    // item with a panel: the label nodes become a disclosure button
    const trigger = el('button', 'hdr-nav-link hdr-nav-link-dd', { type: 'button' });
    const label = el('span');
    label.append(...contentNodes(li, sub));
    trigger.append(label, icon('chevron', 'hdr-nav-chev'));
    const mega = sub.querySelectorAll(':scope > li').length >= 20;
    li.classList.add(mega ? 'hdr-nav-item-mega' : 'hdr-nav-item-dropdown');
    const panel = el('div', `hdr-dd ${mega ? 'hdr-dd-mega' : 'hdr-dd-dropdown'}`, { id: nextId('hdr-panel') });
    decorateDropdownList(sub, 2);
    panel.append(sub);
    li.replaceChildren(trigger, panel);
    register(trigger, panel);
    trigger.addEventListener('click', () => toggle(root, trigger));
  });
}

// ── search (product discovery) ──

async function initSearch(results) {
  await import('../../scripts/initializers/search.js');
  const [
    { search },
    { render },
    { SearchResults },
    { provider: UI, Button },
    { tryRenderAemAssetsImage },
  ] = await Promise.all([
    import('@dropins/storefront-product-discovery/api.js'),
    import('@dropins/storefront-product-discovery/render.js'),
    import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
    import('@dropins/tools/components.js'),
    import('@dropins/tools/lib/aem/assets.js'),
  ]);
  const labels = await fetchPlaceholders();
  const pageSize = 4;

  await render.render(SearchResults, {
    skeletonCount: pageSize,
    scope: 'popover',
    routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
    onSearchResult: (items) => {
      results.dataset.count = items.length;
      results.hidden = !(items.length > 0);
    },
    slots: {
      ProductImage: (ctx) => {
        const { product, defaultImageProps } = ctx;
        const anchorWrapper = document.createElement('a');
        anchorWrapper.href = getProductLink(product.urlKey, product.sku);
        tryRenderAemAssetsImage(ctx, {
          alias: product.sku,
          imageProps: defaultImageProps,
          wrapper: anchorWrapper,
          params: {
            width: defaultImageProps.width,
            height: defaultImageProps.height,
          },
        });
      },
      Footer: async (ctx) => {
        const viewAllResultsWrapper = document.createElement('div');
        const viewAllResultsButton = await UI.render(Button, {
          children: labels.Global?.SearchViewAll,
          variant: 'secondary',
          href: rootLink('/search'),
        })(viewAllResultsWrapper);
        ctx.appendChild(viewAllResultsWrapper);
        ctx.onChange((next) => {
          viewAllResultsButton?.setProps((prev) => ({
            ...prev,
            href: `${rootLink('/search')}?q=${encodeURIComponent(next.variables?.phrase || '')}`,
          }));
        });
      },
    },
  })(results);

  return (phrase) => {
    if (!phrase) {
      results.hidden = true;
      return Promise.resolve(search(null, { scope: 'popover' }));
    }
    if (phrase.length < 3) return Promise.resolve();
    return Promise.resolve(search({
      phrase,
      pageSize,
      filter: [
        { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
      ],
    }, { scope: 'popover' }));
  };
}

function decorateSearch(section) {
  const link = section.querySelector('a');
  const label = text(link) || text(section);
  const wrap = el('div', 'hdr-search-wrap');
  const form = el('form', 'hdr-search', { role: 'search', method: 'get', action: rootLink('/search') });
  const input = el('input', 'hdr-search-input', {
    type: 'text',
    name: 'q',
    autocomplete: 'off',
    placeholder: label,
    'aria-label': label,
  });
  const submit = el('button', 'hdr-search-btn', { type: 'submit', 'aria-label': label });
  submit.append(icon('search', 'hdr-search-icon'));
  form.append(input, submit);
  const results = el('div', 'hdr-search-results hdr-embed');
  results.hidden = true;
  wrap.append(form, results);

  let ready = null;
  const init = () => {
    if (!ready) {
      ready = initSearch(results).catch((error) => {
        console.error('header: search failed to initialize', error);
        ready = null;
        return null;
      });
    }
    return ready;
  };

  let timer;
  input.addEventListener('focus', () => {
    init();
    if (input.value.trim() && Number(results.dataset.count) > 0) results.hidden = false;
  });
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const run = await init();
      if (!run) return;
      run(input.value.trim()).catch((error) => {
        console.warn('header: search request failed', error);
      });
    }, 250);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) window.location.href = `${rootLink('/search')}?q=${encodeURIComponent(query)}`;
  });
  wrap.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !wrap.contains(e.relatedTarget)) results.hidden = true;
  });

  return { wrap, input, results };
}

// ── account (authored links + storefront auth state) ──

const SIGN_IN_PATH = '/customer/login';
const CREATE_ACCOUNT_PATH = '/customer/create';

/**
 * Storefront auth state at the top of the account panel. Signed out: a primary "sign in" button
 * built from the authored sign-in link (which it replaces in the list). Signed in: greeting + sign
 * out, and the sign-in / create-account items are hidden.
 */
function decorateAuth(panel, list) {
  const links = list ? [...list.querySelectorAll('a[href]')] : [];
  const itemFor = (path) => links.find((a) => pathOf(a).endsWith(path))?.closest('li') || null;
  const signInItem = itemFor(SIGN_IN_PATH);
  const createItem = itemFor(CREATE_ACCOUNT_PATH);

  const auth = el('div', 'hdr-account-auth');
  let signInBtn = null;
  if (signInItem) {
    const authored = signInItem.querySelector('a');
    signInBtn = el('a', 'hdr-auth-signin-btn', { href: authored.getAttribute('href') });
    signInBtn.append(...[...authored.childNodes].map((n) => n.cloneNode(true)));
    signInItem.hidden = true; // the button replaces the duplicate text link
    auth.append(signInBtn);
  }
  const user = el('div', 'hdr-auth-user');
  const greeting = el('p', 'hdr-auth-greeting');
  const signOut = el('button', 'hdr-auth-signout', { type: 'button' });
  user.append(greeting, signOut);
  auth.append(user);
  panel.prepend(auth);

  const applyState = async (isAuthenticated) => {
    const signedIn = typeof isAuthenticated === 'boolean'
      ? isAuthenticated
      : Boolean(getCookie('auth_dropin_user_token'));
    if (signInBtn) signInBtn.hidden = signedIn;
    if (createItem) createItem.hidden = signedIn;
    user.hidden = !signedIn;
    const labels = await fetchPlaceholders();
    const firstName = getCookie('auth_dropin_firstname');
    greeting.textContent = firstName ? `${labels.Global?.HeaderGreeting || 'Hi,'} ${firstName}` : '';
    greeting.hidden = !firstName;
    signOut.textContent = labels.Global?.HeaderSignOut || 'Sign out';
  };

  signOut.addEventListener('click', async () => {
    const { signOutCustomer } = await import('./renderAuthDropdown.js');
    signOutCustomer();
  });

  applyState();
  events.on('authenticated', applyState, { eager: true });
}

function decorateAccount(section, root) {
  const account = el('div', 'hdr-account');
  const trigger = el('button', 'hdr-account-trigger', { type: 'button' });
  trigger.append(icon('avatar', 'hdr-account-icon'));
  const label = el('span', 'hdr-account-text');
  const labelP = section.querySelector(':scope > p');
  if (labelP) label.append(...labelP.childNodes);
  trigger.append(label);

  const panel = el('div', 'hdr-dd hdr-dd-account', { id: 'hdr-account-menu' });
  const list = section.querySelector('ul');
  if (list) {
    list.classList.add('hdr-dd-list');
    list.querySelectorAll(':scope > li').forEach((li) => {
      unwrapParagraphs(li);
      li.classList.add('hdr-dd-item');
    });
    panel.append(list);
  }
  decorateAuth(panel, list);
  account.append(trigger, panel);
  register(trigger, panel);
  trigger.addEventListener('click', () => toggle(root, trigger));
  return account;
}

// ── cart (mini-cart panel + item count) ──

const excludeMiniCartFromPaths = ['/checkout'];

function decorateCart(section, root) {
  const link = section.querySelector('a');
  if (!link) return null;
  const cart = el('div', 'hdr-cart');
  link.classList.add('hdr-cart-link');
  link.prepend(icon('cart', 'hdr-cart-icon'));
  cart.append(link.closest('p') || link);

  const { pathname } = window.location;
  if (excludeMiniCartFromPaths.some((p) => pathname === p || pathname.endsWith(p))) {
    cart.hidden = true;
    return cart;
  }

  const panel = el('div', 'hdr-minicart hdr-embed', { id: 'hdr-minicart' });
  cart.append(panel);

  let loading = null;
  const loadMiniCart = () => {
    if (!loading) {
      loading = (async () => {
        const miniCartMeta = getMetadata('mini-cart');
        const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
        const fragment = await loadFragment(miniCartPath);
        if (!fragment?.firstElementChild) throw new Error(`mini-cart fragment ${miniCartPath} not found`);
        panel.append(fragment.firstElementChild);
      })().catch((error) => {
        loading = null;
        console.error('header: mini-cart failed to load', error);
      });
    }
    return loading;
  };

  const onOpen = async () => {
    await loadMiniCart();
    try {
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    } catch (error) {
      console.warn('header: cart view event not published', error);
    }
  };

  register(link, panel, onOpen);
  // the authored href (/cart) stays the no-JS fallback
  link.addEventListener('click', (e) => {
    e.preventDefault();
    toggle(root, link);
  });

  events.on('cart/data', (data) => {
    // preload the mini-cart fragment if the shopper has a cart
    if (data) loadMiniCart();
    if (data?.totalQuantity) {
      link.dataset.count = data.totalQuantity;
    } else {
      delete link.dataset.count;
    }
  }, { eager: true });

  return cart;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const body = await fetchNav();
  if (!body) return;
  const s = slotSections(body);

  const chrome = el('div', 'site-chrome');
  const root = el('div', 'site-header', { 'aria-expanded': 'false' });

  // promo bar
  const promoList = s.promo && s.promo.querySelector('ul');
  if (promoList) {
    const promo = el('div', 'promo-bar');
    promoList.classList.add('promo-bar-list');
    promoList.querySelectorAll(':scope > li').forEach((li) => {
      unwrapParagraphs(li);
      li.classList.add('promo-bar-item');
    });
    promo.append(promoList);
    chrome.append(promo);
  }

  // top row
  const top = el('div', 'hdr-top');
  const topRow = el('div', 'hdr-top-row');
  top.append(topRow);

  const menuBtn = el('button', 'hdr-menu', {
    type: 'button', 'aria-label': 'Open navigation', 'aria-expanded': 'false', 'aria-controls': 'hdr-nav',
  });
  const menuBox = el('span', 'hdr-menu-box');
  menuBox.append(icon('menu', 'hdr-menu-icon'));
  menuBtn.append(menuBox);
  topRow.append(menuBtn);

  if (s.brand) {
    const logo = el('div', 'hdr-logo');
    const p = s.brand.querySelector('p') || s.brand.firstElementChild;
    if (p) logo.append(p);
    topRow.append(logo);
  }

  let search = null;
  if (s.search) {
    search = decorateSearch(s.search);
    topRow.append(search.wrap);
  }

  let store = null;
  if (s.store) {
    store = el('div', 'hdr-store');
    store.append(icon('pin', 'hdr-store-icon'));
    const txt = el('div', 'hdr-store-text');
    txt.append(...s.store.querySelectorAll('p'));
    store.append(txt);
  }

  const account = s.account ? decorateAccount(s.account, root) : null;
  const cart = s.cart ? decorateCart(s.cart, root) : null;

  // nav row
  const bottom = el('div', 'hdr-bottom');
  const bottomRow = el('div', 'hdr-bottom-row');
  bottom.append(bottomRow);
  const nav = el('nav', 'hdr-nav', { id: 'hdr-nav' });
  const navList = s.nav ? s.nav.querySelector('ul') : null;
  if (navList) {
    decorateNav(navList, root);
    nav.append(navList);
  }
  bottomRow.append(nav);

  // desktop: … search, store, account, cart; mobile: row 1 … search, cart; row 2 store, account
  const placeTools = () => {
    if (isDesktop.matches) {
      [store, account, cart].filter(Boolean).forEach((n) => topRow.append(n));
    } else {
      if (cart) topRow.append(cart);
      if (store) bottomRow.prepend(store);
      if (account) bottomRow.insertBefore(account, nav);
    }
  };
  placeTools();

  root.append(top, bottom);
  chrome.append(root);

  // ── interaction: click toggles, Escape / outside click / focus leaving closes ──
  menuBtn.addEventListener('click', () => toggleMenu(root));
  isDesktop.addEventListener('change', () => {
    closeAll(root);
    toggleMenu(root, false);
    placeTools();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const [expanded] = openTriggers(root);
    if (expanded) {
      closeAll(root);
      expanded.focus();
    } else if (search && !search.results.hidden) {
      search.results.hidden = true;
      search.input.focus();
    } else if (!isDesktop.matches && root.getAttribute('aria-expanded') === 'true') {
      toggleMenu(root, false);
      menuBtn.focus();
    }
  });

  root.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !chrome.contains(e.relatedTarget)) closeAll(root);
  });

  document.addEventListener('click', (e) => {
    // composedPath() still lists nodes a drop-in re-render removed from the DOM during the click
    const path = e.composedPath();
    openTriggers(root).forEach((t) => {
      if (!path.includes(t) && !path.includes(controls.get(t).panel)) setOpen(t, false);
    });
    if (search && !path.includes(search.wrap)) search.results.hidden = true;
  });

  decorateLinks(chrome);
  block.replaceChildren(chrome);
}
