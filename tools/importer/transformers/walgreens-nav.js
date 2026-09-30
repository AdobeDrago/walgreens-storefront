/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: walgreens nav fragment.
 *
 * Runs after walgreens-cleanup.js has swapped <main> for the authored /nav.plain.html.
 * Authored sections (source order): promo links | logo | search | store | account | main nav | cart.
 *
 * - Logo image → local `images/walgreens-logo.svg` (nav fragment contract: relative image paths).
 * - Commerce routes: the storefront owns search, cart and account, so those links point at
 *   storefront pages instead of walgreens.com (all other links stay as authored).
 */

const LOGO_SRC = 'images/walgreens-logo.svg';

// authored link text → storefront route
const STOREFRONT_ROUTES = {
  'Sign in': '/customer/login',
  'Create an account': '/customer/create',
  'Your Account': '/customer/account',
  'Order Status & History': '/customer/orders',
  Search: '/search',
  'View shopping cart': '/cart',
};

function getMain(element) {
  if (element.matches && element.matches('main')) return element;
  return element.querySelector('main') || element;
}

// eslint-disable-next-line no-unused-vars
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const main = getMain(element);

  const logo = main.querySelector(':scope > div img');
  if (logo) {
    logo.setAttribute('src', LOGO_SRC);
    logo.removeAttribute('width');
    logo.removeAttribute('height');
  }

  main.querySelectorAll('a[href]').forEach((a) => {
    const route = STOREFRONT_ROUTES[a.textContent.trim()];
    // "Your Account" appears in both Account and Pharmacy > Settings; only remap the Account menu copy
    if (route && !a.closest('li li')) a.setAttribute('href', route);
  });
}
