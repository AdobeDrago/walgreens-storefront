/**
 * Storefront sign-out for the header's account panel — lazily imported by header.js so the auth
 * drop-in API only loads when the shopper signs out.
 */
import * as authApi from '@dropins/storefront-auth/api.js';
import { rootLink } from '../../scripts/commerce.js';

function handleLogout(redirections) {
  const shouldRedirect = Object.entries(redirections).some(([currentPath, redirectPath]) => {
    if (window.location.pathname.includes(currentPath)) {
      window.location.href = redirectPath;
      return true;
    }
    return false;
  });

  if (!shouldRedirect) {
    // reload the page if no redirect occurred
    window.location.reload();
  }
}

/**
 * Revokes the customer token and leaves customer-only pages.
 */
export async function signOutCustomer() {
  await authApi.revokeCustomerToken();
  handleLogout({
    '/checkout': rootLink('/cart'),
    '/customer': rootLink('/customer/login'),
    '/order-details': rootLink('/'),
  });
}
