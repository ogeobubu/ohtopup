# OhTopUp customer discounts and retained margin

Open **Admin → Providers → Customer Discounts**. No rules are seeded or applied to live accounts by this code change.

For the ₦100 MTN data example, choose `vtpass`, `data`, `mtn`, leave the plan code empty, select percentage commission, enter provider commission `2`, and customer discount `1`. Save the rule. The customer confirms a ₦99 wallet debit; the provider receives the ₦100 service value. Estimated provider cost is ₦98 and estimated OhTopUp margin is ₦1 before fees.

Rules are scoped to a provider and service, then optionally a network/service ID and a plan code. A specific plan takes priority over a network, which takes priority over `*`. Within a plan, the specific network takes priority over `*`. An explicit 0% customer discount overrides broader discounts. Saving the same scope updates it. Matching OhTopUp rules override legacy AirtimeSettings/ElectricitySettings discounts; unmatched services retain those legacy discounts. Stored data-plan `discount` fields are not stacked on top: listings and checkout now use the same pricing calculation.

Provider commission can be a percentage or a flat naira amount, with an optional naira cap. Customer discount is a percentage of the listed retail price. If a data plan has an admin price, it is the retail base only: it is never sent to the provider as the face value. The quote and purchase recheck data catalogs and cable prices. Plan listings reflect saved catalog prices; the final confirmation verifies current prices.

These rules describe your provider contract; they do not configure the provider account. Enter the applicable rate and keep it current. Special provider computation methods that cannot be represented by percentage/flat/cap should not be approximated as a guaranteed profit. Checkout refuses a price below the configured provider cost. It cannot guarantee that a manually entered rate matches what the provider will actually charge.

The authenticated quote endpoint is `POST /api/users/purchase-quote/:service`. It accepts purchase details without a PIN and returns the canonical face amount, retail amount, customer discount, wallet debit, provider, service ID, and pricing key. Purchases with matching OhTopUp rules require this key. A changed price or rule requires a fresh confirmation, without debiting the wallet. Existing clients without a key cannot bypass an active OhTopUp rule.

Transactions snapshot the quote in `Utility.pricing`. Provider-reported costs come from VTPass `content.transactions.total_amount` or ClubKonnect `amountcharged`. Actual gross margin is recorded only for delivered transactions when the provider reports a cost; absent costs are not fabricated. The admin transaction detail compares estimates with reported costs. The Customer Discounts summary excludes failed/pending transactions and counts delivered transactions awaiting cost confirmation separately. Historical records without snapshots are not retroactively treated as known profits.

A confirmed failed purchase refunds the original wallet debit exactly once. A timeout remains pending for reconciliation. Changes to rules do not change the price or refund of a reserved transaction. Customer receipts and transaction lists display the wallet debit separately from the service value.

VTPass reference: [commission calculations and response fields](https://vtpass.com/documentation/understanding-how-vtpass-commission-works/). Provider-reported cost and configured estimates remain distinct, including when actual fees or rates differ.

Validation: `npm test` uses an isolated MongoDB replica set and mocked provider calls; `npm run build --prefix client` builds the frontend. No live purchases are required for these checks.
