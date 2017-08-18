import CharStream from './CharStream';
import CodePosition from './CodePosition';
import Token from './token/Token';
import CompilerError from './error/Error';
import SyntaxError from './error/SyntaxError';
import ErrorHandler from './error/ErrorHandler';
import {
	TokenNewline,
	TokenEof,
	TokenIndent,
	TokenOutdent,
	TokenWhitespace,
	TokenSemicolon,
	TokenPunctuation,
	TokenOperator,
	TokenKeyword,
	TokenIdentifier,
	TokenDot,
	TokenComment,
	TokenNumber,
	TokenString,
} from './token/Tokens';
import { default as Char, char } from './util/Char';

export default class TokenStream {
	private readonly generator: IterableIterator<Token>;
	private readonly current: Token[] = [];
	private previous: Token | null = null;
	private oldIndent: string = '';
	private singleIndent: string | null = null;
	private pos: CodePosition;
	private whitespaceHandler: ((token: Token) => void) | null = null;
	private whitespaceHandlers: (((token: Token) => void) | null)[] = [];

	get position() {
		return this.pos;
	}

	constructor(private readonly input: CharStream, private readonly errors: ErrorHandler | null = null) {
		this.generator = this.read();
		this.pos = input.position;
	}

	public pushWhitespaceHandler(handler: (token: Token) => void) {
		this.whitespaceHandlers.push(this.whitespaceHandler);
		this.whitespaceHandler = handler;
	}

	public popWhitespaceHandler() {
		const handler = this.whitespaceHandlers.pop();
		if (handler === undefined) {
			throw new Error('Whitespace handler stack overflow');
		}
		this.whitespaceHandler = handler;
	}

	public peek(skipWhitespace: boolean = true, skipCount: number = 0): Token {
		if (!skipWhitespace && this.current.length > skipCount) {
			return this.current[skipCount];
		}
		for (const tok of this.current) {
			if (!tok.isWhitespace && skipCount-- === 0) {
				return tok;
			}
		}

		while (true) {
			const begin = this.input.position;
			const tok = this.generator.next().value;
			this.previous = tok;
			const end = this.input.position;
			if (tok !== null) {
				tok.begin = begin;
				tok.end = end;
			}
			this.current.push(tok);
			if ((!skipWhitespace || !tok.isWhitespace) && skipCount-- === 0) {
				return tok;
			}
		}
	}

	public next(skipWhitespace: boolean = true): Token {
		const tok = this.peek(skipWhitespace);
		while (this.current.length !== 0) {
			const tok2 = <Token>this.current.shift();
			if (tok2 === tok) {
				break;
			}
			this.whitespaceHandler && this.whitespaceHandler(tok2);
		}
		this.pos = tok.end;
		return tok;
	}

	public eof(): boolean {
		return this.peek() instanceof TokenEof;
	}

	private error(message: string, begin: CodePosition | null = null, end: CodePosition | null = null): CompilerError {
		if (begin === null) {
			begin = this.input.position;
		}
		const error = new SyntaxError(message, begin, end);
		this.errors && this.errors.error(error);
		return error;
	}

	private readWhile(...call: ((c: string, i: number) => boolean)[]): string {
		let result = '';
		while (!this.input.eof() && call.some(call => call.call(this, this.input.peek(), result.length))) {
			result += this.input.next();
		}
		return result;
	}

	private readUntil(breakpoint: string, handleEscape: boolean = true) {
		const val = handleEscape
			? (handleEscape = false) || this.readWhile(c => {
				if (handleEscape) {
					handleEscape = false;
					return true;
				}
				if (c === '\\') {
					handleEscape = true;
					return true;
				}
				return !breakpoint.includes(c);
			})
			: this.readWhile(c => !breakpoint.includes(c));
		this.input.next();
		return val;
	}

	private readNumber(readed: string = '', wasDot: boolean = false, wasE: boolean = false): TokenNumber {
		if (wasE) {
			return new TokenNumber({
				value: readed
			});
		}
		if (wasDot) {
			readed += this.readWhile(Char.isDigit);
			if ('eE'.includes(this.input.peek())) { // Science notation
				this.input.next();
				readed += 'E';
				if (this.input.peek() === '-') {
					readed += this.input.next();
				}
				readed += this.readWhile(Char.isDigit);
			}
			return this.readNumber(readed, true, true);
		}
		const beforeComma = this.readWhile(Char.isDigit);
		const hasComma = this.input.peek() === '.';
		if (hasComma) {
			this.input.next();
		}
		return this.readNumber(beforeComma + (hasComma ? '.' : ''), true, !hasComma);
	}

	private *read(): IterableIterator<Token> {
		while (!this.input.eof()) {
			let c = this.input.peek();
			if (Char.isWhitespaceButNl(c) || this.oldIndent !== '') {
				const whitespace = this.readWhile(Char.isWhitespaceButNl);
				if (this.previous instanceof TokenNewline && this.oldIndent !== whitespace) {
					if (this.singleIndent === null) {
						this.singleIndent = whitespace;
					}
					const len = Math.min(this.oldIndent.length, whitespace.length);
					if (this.oldIndent.substr(0, len) !== whitespace.substr(0, len) ||
						(len !== 0 && this.oldIndent.substr(len) !== this.singleIndent && whitespace.substr(len) !== this.singleIndent)) {
						this.error('Inconsistent indentation', this.input.position.relative(-whitespace.length), this.input.position);
					} else {
						const oldIndent = this.oldIndent;
						this.oldIndent = whitespace;
						if (oldIndent.length < whitespace.length) {
							yield new TokenIndent();
							continue;
						} else {
							for (let i = 0; i < (oldIndent.length - len) / this.singleIndent.length; ++i) {
								yield new TokenOutdent();
							}
							continue;
						}
					}
				}
				if (whitespace !== '') {
					yield new TokenWhitespace({
						value: whitespace
					});
					continue;
				}
			}
			if (Char.isNewline(c)) {
				this.input.next();
				yield new TokenNewline();
				continue;
			}
			if (c === ';') {
				yield new TokenSemicolon();
				continue;
			}
			if (TokenPunctuation.CHARS.includes(c)) {
				yield new TokenPunctuation({
					value: this.input.next()
				});
				continue;
			}
			if (Char.isOperator(c)) {
				let iteration = 0, operators = TokenOperator.OPERATORS;
				while (operators.length !== 1) {
					c = this.input.peek();
					const nextOperators = operators.filter(op => op.length > iteration && op[iteration] === c);
					if (nextOperators.length === 0) {
						break;
					}
					c = this.input.next();
					operators = nextOperators;
					++iteration;
				}
				operators = operators.filter(op => op.length === iteration);
				if (operators.length === 0) {
					throw this.error('Unknown operator', this.input.position.relative(-iteration), this.input.position);
				}
				const operator = operators[0];
				yield new TokenOperator({
					value: operator
				});
				continue;
			}
			// TODO: Parse named operators(and, or, etc.)
			if (Char.isIdBegin(c)) {
				const id = this.readWhile(Char.isIdBody);
				if (TokenKeyword.KEYWORDS.includes(id)) {
					yield new TokenKeyword({
						value: id
					});
					continue;
				}
				yield new TokenIdentifier({
					value: id
				});
				continue;
			}
			if (c === '.') {
				this.input.next();
				if (Char.isDigit(this.input.peek())) {
					yield this.readNumber('.', true);
					continue;
				}
				yield new TokenDot();
				continue;
			}
			if (Char.isDigit(c)) {
				yield this.readNumber();
				continue;
			}
			if (c === '#') {
				yield new TokenComment({
					commentType: '#',
					value: this.readUntil('\n')
				});
				continue;
			}
			if (c === '\'' || c === '\"') {
				const type = this.input.next();
				yield new TokenString({
					stringType: type,
					value: this.readUntil(type),
				});
				continue;
			}
			throw this.error('Unexpected ' + c);
		}
		while (true) {
			yield new TokenEof();
		}
	}
}