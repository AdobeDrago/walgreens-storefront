/**
 * deal-of-the-week — dynamic product carousel sourced from Adobe Commerce Optimizer (ACO).
 *
 * Authoring: a single, optional block-config table (Title | text, View all | link,
 * Page size | number). The product set itself is not authored — it always comes from
 * ACO's `deal_of_the_week` attribute filter.
 *
 * Visual/carousel scaffold (stage/viewport/track/arrows) mirrors blocks/deals-rail, but the
 * card contents are rendered with the shared dropin Preact components (ProductItemCard/
 * Price/Image) instead of static authored markup.
 */

import { h } from '@dropins/tools/preact.js';
import {
  ProductItemCard,
  Price,
  Image,
  provider as UI,
} from '@dropins/tools/components.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { CS_FETCH_GRAPHQL, getProductLink } from '../../scripts/commerce.js';

const DEFAULT_PAGE_SIZE = 8;

const DEAL_OF_THE_WEEK_QUERY = `query DealOfTheWeek($search: String!, $pageSize: Int!, $currentPage: Int!) {
  productSearch(
    phrase: $search
    filter: [{ attribute: "deal_of_the_week", eq: "true" }]
    sort: [{ attribute: "relevance", direction: DESC }]
    page_size: $pageSize
    current_page: $currentPage
  ) {
    items {
      productView {
        __typename
        sku
        name
        urlKey
        images(roles: ["image"]) {
          url
        }
        ... on SimpleProductView {
          price {
            ...priceFields
          }
        }
        ... on ComplexProductView {
          priceRange {
            minimum {
              ...priceFields
            }
          }
        }
      }
    }
    total_count
  }
}
fragment priceFields on ProductViewPrice {
  regular {
    amount {
      currency
      value
    }
  }
  final {
    amount {
      currency
      value
    }
  }
}`;

async function fetchDeals({ pageSize, currentPage }) {
  try {
    const { data, errors } = await CS_FETCH_GRAPHQL.fetchGraphQl(DEAL_OF_THE_WEEK_QUERY, {
      variables: { search: '', pageSize, currentPage },
    });
    if (errors?.length) {
      console.error('deal-of-the-week: GraphQL errors', errors);
      return [];
    }
    return data?.productSearch?.items?.map((item) => item.productView) ?? [];
  } catch (e) {
    console.error('deal-of-the-week: fetch failed', e);
    return [];
  }
}

const el = (className, tag = 'div') => {
  const e = document.createElement(tag);
  e.className = className;
  return e;
};

function svgIcon(d, className, viewBox) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

const ARROW_D = 'M10.5 1.5L2 10l8.5 8.5';

function arrow(direction, label) {
  const btn = el(`deal-of-the-week-arrow deal-of-the-week-arrow-${direction}`, 'button');
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  btn.append(svgIcon(ARROW_D, 'deal-of-the-week-arrow-icon', '0 0 12 20'));
  return btn;
}

function buildHeader(title, viewAllHref) {
  if (!title && !viewAllHref) return null;
  const header = el('deal-of-the-week-header');
  const row = el('deal-of-the-week-title-row');
  if (title) {
    const h2 = document.createElement('h2');
    h2.className = 'deal-of-the-week-title';
    h2.textContent = title;
    row.append(h2);
  }
  if (viewAllHref) {
    const link = el('deal-of-the-week-link', 'a');
    link.href = viewAllHref;
    link.textContent = 'View all';
    row.append(link);
  }
  header.append(row);
  return header;
}

function priceProps(product) {
  const amount = product.price?.final?.amount
    ?? product.price?.regular?.amount
    ?? product.priceRange?.minimum?.final?.amount
    ?? product.priceRange?.minimum?.regular?.amount;
  if (!amount?.value) return undefined;
  return h(Price, { amount: amount.value, currency: amount.currency });
}

function buildCard(product) {
  const card = el('deal-of-the-week-card');
  const imageUrl = product.images?.[0]?.url;

  UI.render(ProductItemCard, {
    image: imageUrl
      ? h(Image, { src: imageUrl, alt: product.name || '', params: { width: 300, height: 300 } })
      : undefined,
    titleNode: h('a', { href: getProductLink(product.urlKey, product.sku) }, product.name || ''),
    price: priceProps(product),
    initialized: true,
  })(card);

  return card;
}

function buildStage(items) {
  const stage = el('deal-of-the-week-stage');
  const viewport = el('deal-of-the-week-viewport');
  const track = el('deal-of-the-week-track', 'ul');
  items.forEach((product) => {
    const slide = el('deal-of-the-week-slide', 'li');
    slide.append(buildCard(product));
    track.append(slide);
  });
  viewport.append(track);
  const prev = arrow('prev', 'Previous slide');
  const next = arrow('next', 'Next slide');
  stage.append(prev, viewport, next);
  return {
    stage, viewport, prev, next, track,
  };
}

function wireCarousel({
  viewport, track, prev, next,
}) {
  const pitch = () => {
    const slide = track.firstElementChild;
    return slide ? slide.getBoundingClientRect().width : viewport.clientWidth;
  };
  const sync = () => {
    const locked = viewport.scrollWidth <= viewport.clientWidth + 1;
    prev.hidden = locked;
    next.hidden = locked;
    prev.disabled = viewport.scrollLeft <= 0;
    next.disabled = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1;
  };
  prev.addEventListener('click', () => viewport.scrollBy({ left: -pitch() }));
  next.addEventListener('click', () => viewport.scrollBy({ left: pitch() }));
  viewport.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  requestAnimationFrame(sync);
}

export default async function decorate(block) {
  const { title, viewAll, pageSize: pageSizeRaw } = readBlockConfig(block);

  [...block.children].forEach((row) => { row.style.display = 'none'; });

  const pageSize = Number.parseInt(pageSizeRaw, 10) || DEFAULT_PAGE_SIZE;
  const items = await fetchDeals({ pageSize, currentPage: 1 });

  if (!items.length) {
    block.remove();
    return;
  }

  const header = buildHeader(title, viewAll);
  const {
    stage, viewport, track, prev, next,
  } = buildStage(items);

  block.append(...(header ? [header] : []), stage);

  wireCarousel({
    viewport, track, prev, next,
  });
}
