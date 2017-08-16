const testInput = `package yapl.test

use stdout

# Hello, \\
  My comment

val loggingEnabled = true

fun log call: lambda
	if loggingEnabled
		print(call())

fun main args: string: string {
	val a = 5
	--a
	print(a)
	print(named: 18 + 1 * 9)
	log(fun 'hello')
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
import {NodePrinterStdoutTarget, NodeCodePrettyPrinter} from '../src/visitor/NodePrinter';
import {TokenEof} from '../src/token/Tokens';


const errorHandler = new ArrayErrorHandler();
const charStream = new CharStream(testInput);
const tokenStream = new TokenStream(charStream, errorHandler);
const parser = new Parser(tokenStream, errorHandler);

try {
	const action: number = 1;
	switch (action) {
	case 0: { // print tokens
		let tok;
		while (!((tok = tokenStream.next(false)) instanceof TokenEof)) {
			console.log(JSON.stringify(tok, null, '  '));
		}
		break;
	}
	case 1: { // print ast
		const ast = parser.parse();
		console.log(JSON.stringify(ast, null, '  '));
		break;
	}
	case 2: { // print code
		const ast = parser.parse();
		const target = new NodePrinterStdoutTarget();
		const printer = new NodeCodePrettyPrinter();
		printer.print(ast, target);
		break;
	}
	}
} catch (e) {
	if (!(e instanceof PositionalError)) {
		throw e;
	}
}

errorHandler.flush().forEach(error => console.error(error.toString()));
