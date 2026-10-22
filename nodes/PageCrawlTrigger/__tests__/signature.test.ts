import { createHmac } from 'crypto';
import { verifySignature, SIGNATURE_MAX_AGE_SECONDS } from '../signature';

const SECRET = 'f'.repeat(64);
const NOW = 1_800_000_000;
const sign = (body: string, timestamp: number, secret = SECRET) =>
	'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

describe('verifySignature', () => {
	const body = '{"id":1,"title":"Plans"}';

	it('accepts the signature PageCrawl sends', () => {
		expect(verifySignature(SECRET, body, sign(body, NOW), String(NOW), NOW)).toBe(true);
		expect(verifySignature(SECRET, Buffer.from(body), sign(body, NOW).toUpperCase().replace('SHA256=', 'sha256='), String(NOW), NOW)).toBe(true);
	});

	it('refuses another secret, a changed body or a changed timestamp', () => {
		expect(verifySignature(SECRET, body, sign(body, NOW, 'e'.repeat(64)), String(NOW), NOW)).toBe(false);
		expect(verifySignature(SECRET, body + ' ', sign(body, NOW), String(NOW), NOW)).toBe(false);
		expect(verifySignature(SECRET, body, sign(body, NOW), String(NOW + 1), NOW)).toBe(false);
	});

	it('refuses deliveries outside the replay window', () => {
		const old = NOW - SIGNATURE_MAX_AGE_SECONDS - 1;
		const future = NOW + SIGNATURE_MAX_AGE_SECONDS + 1;
		expect(verifySignature(SECRET, body, sign(body, old), String(old), NOW)).toBe(false);
		expect(verifySignature(SECRET, body, sign(body, future), String(future), NOW)).toBe(false);
		const edge = NOW - SIGNATURE_MAX_AGE_SECONDS;
		expect(verifySignature(SECRET, body, sign(body, edge), String(edge), NOW)).toBe(true);
	});

	it.each([
		['no secret', '', sign(body, NOW), String(NOW)],
		['no signature', SECRET, undefined, String(NOW)],
		['no timestamp', SECRET, sign(body, NOW), undefined],
		['a timestamp that is not a number', SECRET, sign(body, NOW), '17e8'],
		['a signature without the sha256= prefix', SECRET, sign(body, NOW).slice(7), String(NOW)],
		['a short signature', SECRET, 'sha256=abcd', String(NOW)],
		['header arrays', SECRET, [sign(body, NOW)], String(NOW)],
	])('refuses %s', (_label, secret, signature, timestamp) => {
		expect(verifySignature(secret as string, body, signature, timestamp, NOW)).toBe(false);
	});
});
