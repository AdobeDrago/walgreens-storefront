/**
 * The Walgreens nav as a React component. Shared by the server render (actions/nav) and the
 * browser hydration (web-src/src/client.js), so both produce identical markup.
 *
 * Written with htm tagged templates instead of JSX so the same file runs in Node, webpack (the
 * App Builder action bundle) and Parcel (the static bundle) with no transpile step.
 */
import React, { useEffect, useRef, useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ACCOUNT = 'account';

function MenuIcon() {
  return html`<svg class="wnav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>`;
}

function CartIcon() {
  return html`<svg class="wnav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.3h8.8a1.5 1.5 0 0 0 1.5-1.2L21 7H6.2" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="10" cy="20.5" r="1.4" fill="currentColor" />
    <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" />
  </svg>`;
}

function Chevron() {
  return html`<svg class="wnav-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>`;
}

/** One entry inside a panel: a link, a group with its own list, or a plain title. */
function PanelItem({ node }) {
  if (node.children) {
    // authors repeat the group label as its first plain entry; the group label already shows it
    const [first, ...rest] = node.children;
    const items = first && !first.href && !first.children && first.label === node.label
      ? rest : node.children;
    return html`<li class="wnav-group">
      <span class="wnav-group-label">${node.label}</span>
      <ul>${items.map((child, i) => html`<${PanelItem} key=${i} node=${child} />`)}</ul>
    </li>`;
  }
  if (node.href) return html`<li><a href=${node.href}>${node.label}</a></li>`;
  return html`<li class="wnav-title">${node.label}</li>`;
}

function NavItem({
  node, index, isLast, open, onToggle,
}) {
  const cls = `wnav-item${isLast ? ' wnav-item-end' : ''}`;
  if (!node.children) {
    return html`<li class=${cls}><a class="wnav-link" href=${node.href}>${node.label}</a></li>`;
  }
  const id = `wnav-panel-${index}`;
  // twenty or more entries get the wide multi-column panel, matching the EDS header block
  const mega = node.children.length >= 20;
  return html`<li class=${`${cls} wnav-item-dd`}>
    <button type="button" class="wnav-link" aria-expanded=${open} aria-controls=${id}
      onClick=${() => onToggle(index)}>
      <span>${node.label}</span><${Chevron} />
    </button>
    <div id=${id} class=${`wnav-panel${mega ? ' wnav-panel-mega' : ''}`} hidden=${!open}>
      <ul>${node.children.map((child, i) => html`<${PanelItem} key=${i} node=${child} />`)}</ul>
    </div>
  </li>`;
}

export default function Nav({ model }) {
  const {
    promo, brand, search, store, account, nav, cart,
  } = model;
  const [openPanel, setOpenPanel] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);

  const toggle = (key) => setOpenPanel((current) => (current === key ? null : key));

  // close on Escape and on clicks outside the nav
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpenPanel(null); };
    const onClick = (e) => { if (!rootRef.current?.contains(e.target)) setOpenPanel(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return html`<div class="wnav" ref=${rootRef} data-menu-open=${menuOpen}>
    ${promo.length > 0 && html`<div class="wnav-promo">
      <ul>${promo.map((p, i) => html`<li key=${i}><a href=${p.href}>${p.label}</a></li>`)}</ul>
    </div>`}

    <div class="wnav-top">
      <button type="button" class="wnav-menu" aria-controls="wnav-nav" aria-expanded=${menuOpen}
        aria-label=${menuOpen ? 'Close navigation' : 'Open navigation'}
        onClick=${() => setMenuOpen(!menuOpen)}>
        <${MenuIcon} />
      </button>

      ${brand && html`<a class="wnav-brand" href=${brand.href}>
        <picture>
          ${brand.sources.map((s, i) => html`<source key=${i} type=${s.type} media=${s.media} srcSet=${s.srcSet} />`)}
          <img src=${brand.src} alt=${brand.alt} width=${brand.width} height=${brand.height} />
        </picture>
      </a>`}

      <form class="wnav-search" role="search" method="get" action=${search.action}>
        <input type="search" name="q" autoComplete="off" placeholder=${search.label} aria-label=${search.label} />
      </form>

      ${store && html`<span class="wnav-store">${store}</span>`}

      <div class="wnav-account">
        <button type="button" class="wnav-account-trigger" aria-controls="wnav-account-panel"
          aria-expanded=${openPanel === ACCOUNT} onClick=${() => toggle(ACCOUNT)}>
          <span>${account.label}</span><${Chevron} />
        </button>
        <div id="wnav-account-panel" class="wnav-panel wnav-panel-account" hidden=${openPanel !== ACCOUNT}>
          <ul>${account.links.map((l, i) => html`<li key=${i}><a href=${l.href}>${l.label}</a></li>`)}</ul>
        </div>
      </div>

      <a class="wnav-cart" href=${cart.href}>
        <${CartIcon} /><span class="wnav-sr">${cart.label}</span>
      </a>
    </div>

    <nav id="wnav-nav" class="wnav-nav" aria-label="Main">
      <ul>
        ${nav.map((node, i) => html`<${NavItem} key=${i} node=${node} index=${i}
          isLast=${i === nav.length - 1 && nav.length > 1}
          open=${openPanel === i} onToggle=${toggle} />`)}
      </ul>
    </nav>
  </div>`;
}
