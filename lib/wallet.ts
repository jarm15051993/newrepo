/**
 * Placeholder for wallet pass sync. Credit count has been removed from both
 * Apple and Google Wallet passes, so there is currently nothing to sync.
 * Call sites are retained so this can be wired up if wallet fields are added
 * in the future.
 */
export async function triggerWalletPassUpdate(_userId: string): Promise<void> {
  // no-op
}
