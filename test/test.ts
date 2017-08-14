const testInput = `package yapl.test

use stdout

# Hello, \\
  My comment

fun main args: string: string {
	print(5.9)
	print(named: 18)
}

fun main2 args: string: string
	print(18.64)
	print(named: 15.84E-5)
`;

import ArrayErrorHandler from '../src/error/ArrayErrorHandler';
import PositionalError from '../src/error/PositionalError';
import CharStream from '../src/CharStream';
import TokenStream from '../src/TokenStream';
import Parser from '../src/Parser';
import {TokenEof} from '../src/token/Tokens';


const errorHandler = new ArrayErrorHandler();
const charStream = new CharStream(testInput);
const tokenStream = new TokenStream(charStream, errorHandler);
const parser = new Parser(tokenStream, errorHandler);

try {
	if (!false) {
		let tok;
		while (!((tok = tokenStream.next(false)) instanceof TokenEof)) {
			console.log(JSON.stringify(tok, null, '  '));
		}
	} else {
		const ast = parser.parse();
		console.log(JSON.stringify(ast, null, '  '));
	}
} catch (e) {
	if (!(e instanceof PositionalError)) {
		throw e;
	}
}

errorHandler.flush().forEach(error => console.error(error.toString()));
