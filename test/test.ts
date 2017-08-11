const testInput = `package yapl.test

use stdout

# Hello, \\
  My comment

fun main(args: string) {
	print 'hello'
    print 'hello'
}
`;

import ArrayErrorHandler from '../src/error/ArrayErrorHandler';
import PositionalError from '../src/error/PositionalError';
import CharStream from '../src/CharStream';
import TokenStream from '../src/TokenStream';
import Parser from '../src/Parser';


const errorHandler = new ArrayErrorHandler();
const charStream = new CharStream(testInput);
const tokenStream = new TokenStream(charStream, errorHandler);
const parser = new Parser(tokenStream, errorHandler);

try {
	/*let tok;
	while ((tok = tokenStream.next()) !== null) {
		console.log(tok);
	}*/

	const ast = parser.parse();
	console.log(JSON.stringify(ast, null, '\t'));
} catch (e) {
	if (!(e instanceof PositionalError)) {
		throw e;
	}
}

errorHandler.flush().forEach(error => console.error(error.toString()));
