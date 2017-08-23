import * as assert from 'assert';
import CharStream from '../src/CharStream';
import TokenStream from '../src/TokenStream';
import ArrayErrorHandler from '../src/error/ArrayErrorHandler';

const TestCode = 'package something; 5 * 10;';

describe('TokenStream', () => {
	let tokenStream: TokenStream;
	let errorHandler: ArrayErrorHandler;

	beforeEach(() => {
		errorHandler = new ArrayErrorHandler();
		tokenStream = new TokenStream(new CharStream(TestCode), errorHandler);
	});
	
	afterEach(() => {
		assert.doesNotThrow(() => {
			const error = errorHandler.shift();
			if (error) {
				throw error;
			}
		}, 'Errors should be empty');
	});

	describe('#peek()', () => {
		it('should return keyword package', () => {
			assert.deepEqual(tokenStream.peek().type, 'kw');
			assert.deepEqual((<any>tokenStream.peek()).value, 'package');
		});
		
		it('should return the same value two calls of peek', () => {
			assert.deepEqual(tokenStream.peek(), tokenStream.peek());
		});
	});

	describe('#next()', () => {
		it('should return different value two calls of next', () => {
			assert.notDeepEqual(tokenStream.next(), tokenStream.next());
		});
	});

	it('should return the same value one call of peek and then next', () => {
		assert.deepEqual(tokenStream.peek(), tokenStream.next());
	});

	it('should return different value one call of next and then peek', () => {
		assert.notDeepEqual(tokenStream.next(), tokenStream.peek());
	});
});
