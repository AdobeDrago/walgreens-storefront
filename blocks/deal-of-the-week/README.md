# deal-of-the-week

Custom **carousel** block. Purpose: deal-of-the-week.

Dynamically fetches a curated product set from Adobe Commerce Optimizer (ACO) via a
`productSearch` query filtered on the `deal_of_the_week` product attribute (`eq: "true"`),
sorted by relevance. The product list is never authored — it always reflects whichever
products currently have that attribute set in the catalog.

## Authoring (Document Authoring)

Model: `standalone`

Same authoring pattern as `deals-rail`: default content directly before the block is
re-absorbed into the rail header, and the block itself carries no card rows (leave the
block table empty, or with only an optional `Page size` config row).

Section head (default content directly before the block):
```
<p><img icon></p> <h2><strong>Deals</strong> <em>of the</em> <strong>Week</strong></h2>
<p><a href>View all</a></p> <p>Deals for STORE <strong>expires in N days!</strong></p>
```

Any of the icon, heading, link, or store line may be omitted. Optionally, a single
block-config row can override the request size:

| Row       | Content                                           |
| --------- | -------------------------------------------------- |
| Page size | A number — how many deals to request (default 8)  |

Changing which products appear requires updating the `deal_of_the_week` attribute in the
catalog (Commerce/ACO), not this page's content — the cards themselves are never authored.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
