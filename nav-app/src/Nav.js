/**
 * The Walgreens nav as a React component. Shared by the server render (actions/nav) and the
 * browser hydration (web-src/src/client.js), so both produce identical markup.
 *
 * Mirrors the DOM the EDS header block builds (blocks/header/header.js: promo bar, top row
 * menu / logo / search / store / account / cart, nav row with click-to-open panels, mobile menu)
 * so the same styles apply. Differences from the block:
 *   - no viewport-dependent DOM moves: store and account render in both rows, CSS shows one
 *   - no Commerce drop-ins: search submits GET /search?q=, the account panel shows the signed-out
 *     sign-in button, the cart is a plain link
 *
 * Written with htm tagged templates instead of JSX so the same file runs in Node, webpack (the
 * App Builder action bundle) and Parcel (the static bundle) with no transpile step.
 */
import React, { useEffect, useRef, useState } from 'react';
import htm from 'htm';
import ICONS from './icons.js';

const html = htm.bind(React.createElement);

const ACCOUNT = 'account';
const SIGN_IN_PATH = '/customer/login';
// the source breakpoint (lsg .hide-on-mobile / .show-on-mobile twins)
const DESKTOP_QUERY = '(min-width: 768px)';

function Icon({ name, className }) {
  return html`<svg class=${`hdr-icon ${className}`} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    ${ICONS[name].map((d, i) => html`<path key=${i} d=${d} />`)}
  </svg>`;
}

/** Entries of a panel list: a link, a group with its own list, or a plain title. */
function DropdownList({ nodes, level }) {
  return html`<ul class=${`hdr-dd-list hdr-dd-list-l${level}`}>
    ${nodes.map((node, i) => {
    if (node.children) {
      return html`<li key=${i} class="hdr-dd-item hdr-dd-item-has-children">
          ${node.href ? html`<a href=${node.href}>${node.label}</a>` : html`<span class="hdr-dd-group">${node.label}</span>`}
          <${DropdownList} nodes=${node.children} level=${level + 1} />
        </li>`;
    }
    if (node.href) return html`<li key=${i} class="hdr-dd-item"><a href=${node.href}>${node.label}</a></li>`;
    // panel titles: shown in the mobile menu only
    return html`<li key=${i} class="hdr-dd-section">${node.label}</li>`;
  })}
  </ul>`;
}

function NavItem({
  node, index, isLast, open, onToggle,
}) {
  const end = isLast ? ' hdr-nav-item-end' : '';
  if (!node.children) {
    return html`<li class=${`hdr-nav-item${end}`}>
      <a class="hdr-nav-link" href=${node.href}><span>${node.label}</span></a>
    </li>`;
  }
  const id = `hdr-panel-${index}`;
  // twenty or more entries get the wide panel, matching the EDS header block
  const mega = node.children.length >= 20;
  return html`<li class=${`hdr-nav-item${end} ${mega ? 'hdr-nav-item-mega' : 'hdr-nav-item-dropdown'}`}>
    <button type="button" class=${`hdr-nav-link hdr-nav-link-dd${open ? ' is-open' : ''}`}
      aria-expanded=${open} aria-controls=${id} onClick=${() => onToggle(index)}>
      <span>${node.label}</span><${Icon} name="chevron" className="hdr-nav-chev" />
    </button>
    <div id=${id} class=${`hdr-dd ${mega ? 'hdr-dd-mega' : 'hdr-dd-dropdown'}`} hidden=${!open}>
      <${DropdownList} nodes=${node.children} level=${2} />
    </div>
  </li>`;
}

function Store({ text, className }) {
  return html`<div class=${`hdr-store ${className}`}>
    <${Icon} name="pin" className="hdr-store-icon" />
    <div class="hdr-store-text"><p>${text}</p></div>
  </div>`;
}

function Account({
  account, id, className, open, onToggle,
}) {
  // signed-out state: the authored sign-in link becomes the primary button at the top
  const signIn = account.links.find((l) => l.href?.replace(/\/$/, '').endsWith(SIGN_IN_PATH));
  return html`<div class=${`hdr-account ${className}`}>
    <button type="button" class=${`hdr-account-trigger${open ? ' is-open' : ''}`}
      aria-expanded=${open} aria-controls=${id} onClick=${() => onToggle(ACCOUNT)}>
      <${Icon} name="avatar" className="hdr-account-icon" />
      <span class="hdr-account-text">${account.label}</span>
    </button>
    <div id=${id} class="hdr-dd hdr-dd-account" hidden=${!open}>
      ${signIn && html`<div class="hdr-account-auth">
        <a class="hdr-auth-signin-btn" href=${signIn.href}>${signIn.label}</a>
      </div>`}
      <ul class="hdr-dd-list">
        ${account.links.filter((l) => l !== signIn).map((l, i) => html`<li key=${i} class="hdr-dd-item"><a href=${l.href}>${l.label}</a></li>`)}
      </ul>
    </div>
  </div>`;
}

export default function Nav({ model }) {
  const {
    promo, brand, search, store, account, nav, cart,
  } = model;
  const [openPanel, setOpenPanel] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = (key) => setOpenPanel((current) => (current === key ? null : key));

  // the mobile menu locks page scroll; closing it closes any open panel
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    document.body.style.overflowY = menuOpen && !desktop ? 'hidden' : '';
    if (!menuOpen) setOpenPanel(null);
  }, [menuOpen]);

  // Escape / outside click / focus leaving closes; crossing the breakpoint resets
  useEffect(() => {
    const root = rootRef.current;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // store/account render twice (one per breakpoint); focus the visible trigger
      const trigger = [...root.querySelectorAll('[aria-controls][aria-expanded="true"]:not(.hdr-menu)')]
        .find((t) => t.offsetParent !== null);
      if (trigger) {
        setOpenPanel(null);
        trigger.focus();
      } else if (!mq.matches && menuRef.current.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuRef.current.focus();
      }
    };
    const onClick = (e) => { if (!root.contains(e.target)) setOpenPanel(null); };
    const onFocusOut = (e) => {
      if (e.relatedTarget && !root.contains(e.relatedTarget)) setOpenPanel(null);
    };
    const onBreakpoint = () => {
      setOpenPanel(null);
      setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    root.addEventListener('focusout', onFocusOut);
    mq.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      root.removeEventListener('focusout', onFocusOut);
      mq.removeEventListener('change', onBreakpoint);
    };
  }, []);

  const accountProps = { account, open: openPanel === ACCOUNT, onToggle: toggle };

  return html`<div class="wnav" ref=${rootRef}>
    <div class="site-chrome">
      ${promo.length > 0 && html`<div class="promo-bar">
        <ul class="promo-bar-list">
          ${promo.map((p, i) => html`<li key=${i} class="promo-bar-item"><a href=${p.href}>${p.label}</a></li>`)}
        </ul>
      </div>`}

      <div class="site-header" data-expanded=${menuOpen}>
        <div class="hdr-top">
          <div class="hdr-top-row">
            <button type="button" class="hdr-menu" ref=${menuRef} aria-controls="hdr-nav"
              aria-expanded=${menuOpen} aria-label=${menuOpen ? 'Close navigation' : 'Open navigation'}
              onClick=${() => setMenuOpen(!menuOpen)}>
              <span class="hdr-menu-box"><${Icon} name="menu" className="hdr-menu-icon" /></span>
            </button>

            ${brand && html`<div class="hdr-logo">
              <a href=${brand.href}>
                <picture>
                  ${brand.sources.map((s, i) => html`<source key=${i} type=${s.type} media=${s.media} srcSet=${s.srcSet} />`)}
                  <img src=${brand.src} alt=${brand.alt} width=${brand.width} height=${brand.height} />
                </picture>
              </a>
            </div>`}

            <div class="hdr-search-wrap">
              <form class="hdr-search" role="search" method="get" action=${search.action}>
                <input class="hdr-search-input" type="text" name="q" autoComplete="off"
                  placeholder=${search.label} aria-label=${search.label} />
                <button type="submit" class="hdr-search-btn" aria-label=${search.label}>
                  <${Icon} name="search" className="hdr-search-icon" />
                </button>
              </form>
            </div>

            ${store && html`<${Store} text=${store} className="wnav-desktop" />`}
            <${Account} ...${accountProps} id="hdr-account-menu" className="wnav-desktop" />

            <div class="hdr-cart">
              <p><a class="hdr-cart-link" href=${cart.href}><${Icon} name="cart" className="hdr-cart-icon" />${cart.label}</a></p>
            </div>
          </div>
        </div>

        <div class="hdr-bottom">
          <div class="hdr-bottom-row">
            ${store && html`<${Store} text=${store} className="wnav-mobile" />`}
            <${Account} ...${accountProps} id="hdr-account-menu-m" className="wnav-mobile" />
            <nav id="hdr-nav" class="hdr-nav" aria-label="Main">
              <ul class="hdr-nav-list">
                ${nav.map((node, i) => html`<${NavItem} key=${i} node=${node} index=${i}
                  isLast=${i === nav.length - 1 && nav.length > 1}
                  open=${openPanel === i} onToggle=${toggle} />`)}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
