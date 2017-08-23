import * as assert from 'assert';
import CharStream from '../src/CharStream';
import TokenStream from '../src/TokenStream';

const TestCode = 'package something; 5 * 10;';

describe('CharStream', () => {
	let charStream: CharStream;

	beforeEach(() => {
		charStream = new CharStream(TestCode);
	});

	describe('#peek()', () => {
		it('should return "p"', () => assert.equal(charStream.peek(), 'p'));
		it('should return the same value two calls of peek', () => assert.equal(charStream.peek(), charStream.peek()));
	});

	describe('#next()', () => {
		it('should return "p"', () => assert.equal(charStream.next(), 'p'));
		it('should return different chars after two calls of next', () => assert.notEqual(charStream.next(), charStream.next()));
	});

	it('should return the same value one call of peek and then next', () => {
		assert.equal(charStream.peek(), charStream.next());
	});

	it('should return different value one call of next and then peek', () => {
		assert.notEqual(charStream.next(), charStream.peek());
	});
});
