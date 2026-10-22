import { createHmac, timingSafeEqual } from 'crypto';

/** Deliveries older than this are refused, so a captured request cannot be replayed later. */
export const SIGNATURE_MAX_AGE_SECONDS = 300;

/**
 * Whether a delivery carries PageCrawl's signature for this webhook.
 *
 * PageCrawl signs `{timestamp}.{raw body}` with HMAC-SHA256 and the webhook's signing secret,
 * and sends `X-PageCrawl-Signature: sha256=<hex>` and `X-PageCrawl-Timestamp: <unix seconds>`.
 * The body must be the exact bytes received, never a re-serialised object.
 */
export function verifySignature(
	secret: string,
	rawBody: Buffer | string,
	signatureHeader: unknown,
	timestampHeader: unknown,
	nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
	if (!secret || typeof signatureHeader !== 'string' || typeof timestampHeader !== 'string') {
		return false;
	}
	if (!/^\d+$/.test(timestampHeader)) {
		return false;
	}
	if (Math.abs(nowSeconds - Number(timestampHeader)) > SIGNATURE_MAX_AGE_SECONDS) {
		return false;
	}

	const match = /^sha256=([0-9a-f]{64})$/i.exec(signatureHeader.trim());
	if (!match) {
		return false;
	}

	const expected = createHmac('sha256', secret)
		.update(`${timestampHeader}.`)
		.update(rawBody)
		.digest();
	const received = Buffer.from(match[1], 'hex');

	return received.length === expected.length && timingSafeEqual(received, expected);
}
