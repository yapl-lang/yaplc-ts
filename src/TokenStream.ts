import CharStream from './CharStream';
import CodePosition from './CodePosition';
import Token from './token/Token';
import Error from './error/Error';
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
	private readonly input: CharStream;
	private readonly current: Token[] = [];
	private previous: Token | null = null;
	private oldIndent: string = '';
	private readonly errors: ErrorHandler | null;
	private pos: CodePosition;

	get position() {
		return this.pos;
	}

	constructor(input: CharStream, errors: ErrorHandler | null = null) {
		this.input = input;
		this.errors = errors;
		this.pos = input.position;
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

	private read(): Token {
		if (this.input.eof()) {
			return new TokenEof();
		}
		let c = this.input.peek();
		if (Char.isWhitespaceButNl(c) || this.oldIndent !== '') {
			const whitespace = this.readWhile(Char.isWhitespaceButNl);
			if (this.previous instanceof TokenNewline && this.oldIndent !== whitespace) {
				const len = Math.min(this.oldIndent.length, whitespace.length);
				if (this.oldIndent.substr(0, len) !== whitespace.substr(0, len)) {
					this.error('Inconsistent indentation', this.input.position.relative(-whitespace.length), this.input.position);
				} else {
					const oldIndent = this.oldIndent;
					this.oldIndent = whitespace;
					if (oldIndent.length < whitespace.length) {
						return new TokenIndent();
					} else {
						return new TokenOutdent();
					}
				}
			}
			if (whitespace !== '') {
				return new TokenWhitespace({
					value: whitespace
				});
			}
		}
		if (Char.isNewline(c)) {
			this.input.next();
			return new TokenNewline();
		}
		if (c === ';') {
			return new TokenSemicolon();
		}
		if (TokenPunctuation.CHARS.includes(c)) {
			return new TokenPunctuation({
				value: this.input.next()
			});
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
			return new TokenOperator({
				value: operator
			});
		}
		// TODO: Parse named operators(and, or, etc.)
		if (Char.isIdBegin(c)) {
			const id = this.readWhile(Char.isIdBody);
			if (TokenKeyword.KEYWORDS.includes(id)) {
				return new TokenKeyword({
					value: id
				});
			}
			return new TokenIdentifier({
				value: id
			});
		}
		if (c === '.') {
			this.input.next();
			if (Char.isDigit(this.input.peek())) {
				return this.readNumber('.', true);
			}
			return new TokenDot();
		}
		if (Char.isDigit(c)) {
			return this.readNumber();
		}
		if (c === '#') {
			return new TokenComment({
				commentType: '#',
				value: this.readUntil('\n')
			});
		}
		if (c === '\'' || c === '\"') {
			const type = this.input.next();
			return new TokenString({
				stringType: type,
				value: this.readUntil(type),
			});
		}
		// TODO: String templates
		throw this.error('Unexpected ' + c);
	}

	public peek(skipWhitespace: boolean = true, skipCount: number = 0): Token {
		if (!skipWhitespace && this.current.length !== 0) {
			return this.current[0];
		}
		for (const tok of this.current) {
			if (!tok.isWhitespace && skipCount-- === 0) {
				return tok;
			}
		}

		while (true) {
			const begin = this.input.position;
			const tok = this.read();
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
			if (this.current.shift() === tok) {
				break;
			}
		}
		this.pos = tok.end;
		return tok;
	}

	public eof(): boolean {
		return this.peek() instanceof TokenEof;
	}

	private error(message: string, begin: CodePosition | null = null, end: CodePosition | null = null): Error {
		if (begin === null) {
			begin = this.input.position;
		}
		const error = new SyntaxError(message, begin, end);
		this.errors && this.errors.error(error);
		return error;
	}
}