const testInput = `package yapl.test

use stdout.*

# Hello, \\
  My comment

val loggingEnabled = true
val testArray: [10]string # Auto-initialized array with 10 string-references with default non-null value(empty string)
val testArrayOfArray: [4][4]float # 4x4 array of floats. In memory will be stored as four references to arrays of four elements of float type
val testMatrix: [4, 4]float # 4x4 array of floats. In memory will be stored together: 16 elements of float type; static array

fun log call: fun(): string
	if loggingEnabled
		print(call())

# DOCs maybe that, but also may be changed
###
 # main is an entry function in any program
 # @param args Command-line arguments
 # @return status, 0 means success
###
fun main args: []string: int {
	val a = 5
	--a
	print(a)
	print(named: 18 + 1 * 9)
	log(fun \`'My number is 'a' and this is logged using string template'\`)
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
import {NodePrinterStdoutTarget} from '../src/printer/NodePrinter';
import NodeAstPrinter from '../src/printer/NodeAstPrinter';
import NodeCodePrettyPrinter from '../src/printer/NodeCodePrettyPrinter';
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
		const target = new NodePrinterStdoutTarget();
		const printer = new NodeAstPrinter('  ');
		printer.print(ast, target);
		break;
	}
	case 2: { // print code
		const ast = parser.parse();
		const target = new NodePrinterStdoutTarget();
		const printer = new NodeCodePrettyPrinter('  ');
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
