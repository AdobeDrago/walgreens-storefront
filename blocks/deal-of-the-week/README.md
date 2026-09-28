# deal-of-the-week

Custom **carousel** block. Purpose: deal-of-the-week.

Dynamically fetches a curated product set from Adobe Commerce Optimizer (ACO) via a
`productSearch` query filtered on the `deal_of_the_week` product attribute (`eq: "true"`),
sorted by relevance. The product list is never authored — it always reflects whichever
products currently have that attribute set in the catalog.

## Authoring (Document Authoring)

Model: `standalone`

Single block table with up to three optional rows:

| Row       | Content                                      |
| --------- | --------------------------------------------- |
| Title     | Text — heading shown above the carousel        |
| View all  | A link — shown as a "View all" link in the header |
| Page size | A number — how many deals to request (default 8) |

All rows are optional. Changing which products appear requires updating the
`deal_of_the_week` attribute in the catalog (Commerce/ACO), not this page's content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
