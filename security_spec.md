# Security Specification — Chez LouLou Firestore Rules

## 1. Data Invariants
1. **Catalog Integrity**: Only verified administrators (`isAdmin()`) may create, update, or delete `/products/{productId}` and `/settings/{settingId}`. Public storefront visitors may read products and store settings.
2. **Order Ownership & PII Isolation**: `/orders/{orderId}` contains customer PII. Only the verified owner (`customerId == request.auth.uid`) or an administrator may read an order.
3. **Order State Machine & Terminal Locking**: Customers may only create orders with `status == 'pending'`, `customerId == request.auth.uid`, `pointsCredited == false`, and `referralRewarded == false`. Customers may only transition their own `pending` order to `cancelled`, or submit payment verification (`paymentStatus`, `paymentReference`, `paymentProvider`) on their own `pending` order.
4. **Loyalty Points Anti-Minting & Atomic Redemption**:
   - Customers may initialize their own `/loyaltyAccounts/{uid}` once with the 50-point welcome balance (`pointsBalance == 50`, `totalEarned == 50`, `totalRedeemed == 0`).
   - Customers can NEVER increase their own `pointsBalance` except when atomically cancelling a `pending` order (`get(/orders/orderId).data.status == 'pending'` and `getAfter(/orders/orderId).data.status == 'cancelled'`) to refund `pointsRedeemed`.
   - Customers can ONLY decrease `pointsBalance` in the exact same atomic `writeBatch` as creating a valid `/orders/{lastOrderId}`.
   - Only `isAdmin()` may credit earned purchase points (`type: 'earn'`), referral bonuses (`type: 'referral'`), or manual bonuses (`type: 'bonus'`).
5. **Verified Reviews Master Gate**: Customers can only create `/reviews/{reviewId}` if they reference an existing `orderId` owned by `request.auth.uid` whose `status == 'delivered'`.
6. **Promo Code Atomic Redemption**: Only `isAdmin()` can create, modify rules, or delete `/promoCodes/{code}`. Customers can only increment `usedCount` by 1 in the exact same atomic `writeBatch` as creating a valid `/orders/{lastOrderId}` referencing that `promoCode`.
7. **Referral Anti-Self-Referral**: Customers can create their own referral code `/referrals/{code}` with `successfulCount == 0` and `totalBonusPoints == 0`. Only `isAdmin()` can increment referral reward counters when confirming an order.
8. **Notification PII Isolation**: `/notifications/{notificationId}` contains customer phone numbers and is strictly readable only by `isAdmin()`.
9. **Temporal Integrity**: All `createdAt` and `updatedAt` fields MUST equal `request.time`.

## 2. Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Self-Minting Loyalty Points**: Customer tries `updateDoc(doc(db, 'loyaltyAccounts', uid), { pointsBalance: 99999 })`. Blocked by strict `totalEarned == existing().totalEarned` and `getAfter` order/cancellation binding.
2. **Unverified Fake Review**: Customer attempts to submit a review without a `delivered` order owned by `request.auth.uid`. Blocked by `get(/orders/$(incoming().orderId)).data.status == 'delivered'`.
3. **Promo Code Scraping / Tampering**: Customer runs `getDocs(collection(db, 'promoCodes'))` or modifies `discountValue`. Blocked by `allow list: if isBootstrappedAdmin()` and `affectedKeys().hasOnly(['usedCount', 'lastOrderId', 'updatedAt'])`.
4. **Self-Rewarding Referral**: Customer increments `successfulCount` on `/referrals/{code}` directly. Blocked by `allow update: if isAdmin()`.
5. **Notification Phone Scraping**: Non-admin reads `/notifications`. Blocked by `allow get, list: if isAdmin() / isBootstrappedAdmin()`.
6. **Order Credit / Referral Forgery**: Customer creates order with `pointsCredited: true` or `referralRewarded: true`. Blocked on create.
7. **Shadow Field Injection / Email Spoofing / Cross-Customer PII Read / Resource Poisoning / Timestamp Forgery**: Blocked by validation helpers and `isValidId()`.
