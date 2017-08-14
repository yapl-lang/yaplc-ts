import CodePosition from './CodePosition';
import TokenStream from './TokenStream';
import ErrorHandler from './error/ErrorHandler';
import Error from './error/Error';
import SyntaxError from './error/SyntaxError';
import Token from './token/Token';
import {
	TokenNewline,
	TokenEof,
	TokenIndent,
	TokenOutdent,
	TokenWhitespace,
	TokenPunctuation,
	TokenOperator,
	TokenKeyword,
	TokenIdentifier,
	TokenDot,
	TokenComment,
	TokenNumber,
	TokenString,
} from './token/Tokens';
import Node from './ast/Node';
import {
	NodePackage,
	NodeUse,
	NodeIdentifier,
	NodeTypeName,
	NodeTypeReference,
	NodeVal,
	NodeVar,
	NodeFunction,
	NodeFunctionArgument,
	NodeExpression,
	NodeNull,
	NodeCall,
	NodeCallArgument,
	NodeReference,
	NodeNumber,
	NodeString,
} from './ast/Nodes';

class TokenEqualiter {
	constructor(readonly type: {new(): Token} | null = null, readonly value: string | null = null) {
	}
}

export default class Parser {
	private readonly input: TokenStream;
	private readonly errors: ErrorHandler | null;
	private currentNodeBegin: CodePosition | null = null;

	constructor(input: TokenStream, errors: ErrorHandler | null = null) {
		this.input = input;
		this.errors = errors;
	}

	protected doParse<T extends Node>(method: string | String | ((...args: any[]) => T | null), ...args: any[]): T | null {
		if (typeof method === 'string' || method instanceof String) {
			method = <() => T>(<any>this)[method.toString()];
		}
		const oldBegin = this.currentNodeBegin;
		this.currentNodeBegin = null;
		const begin = this.input.position;
		const node = <T>method.call(this, ...args);
		if (node === null) {
			return null;
		}
		const end = this.input.position;
		node.begin = this.currentNodeBegin || begin;
		node.end = end;
		this.currentNodeBegin = oldBegin;
		return node;
	}

	protected skip<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, field: string | null = 'value', skipWhitespace: boolean = true): T | string {
		if (!this.is<T>(constructor, value, field, skipWhitespace)) {
			throw this.error(`Expected ${value === null ? constructor === null ? '' : constructor.name : value}`, this.input.peek());
		}
		return <T | string>this.take<T>(constructor, value, field, skipWhitespace);
	}

	protected take<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, field: string | null = 'value', skipWhitespace: boolean = true): T | string | null {
		if (!this.is<T>(constructor, value, field, skipWhitespace)) {
			return null;
		}
		if (this.currentNodeBegin === null) {
			this.currentNodeBegin = this.input.peek().begin;
		}
		const tok = <T>this.input.next(skipWhitespace);
		if (field) {
			return (<any>tok)[field] || tok;
		}
		return tok;
	}

	protected is<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, field: string | null = 'value', skipWhitespace: boolean = true, skipCount: number = 0): boolean {
		const tok = this.input.peek(skipWhitespace, skipCount);
		return (constructor === null || tok instanceof constructor)
			&& (typeof value !== 'string' || (<any>tok)[field || 'value'] === value)
			&& (!(value instanceof Array) || value.includes((<any>tok)[field || 'value']));
	}

	protected while<T extends Node>(...call: ((c: Token, i: number) => T | null)[]): T[] {
		const result: T[] = [];
		while (true) {
			let node = null;
			for (const acall of call) {
				if ((node = this.doParse<T>(acall, this.input.peek(), result.length)) !== null) {
					break;
				}
			}
			if (node === null) {
				break;
			}
			result.push(node);
		}
		return result;
	}

	protected delimited<T extends Node>(
		item: string | String | ((c: Token, i: number) => T | null),
		before: TokenEqualiter,
		delimiter: TokenEqualiter,
		after: TokenEqualiter = before,
		optional: boolean = false,
		optionalBeforeAndAfter: boolean = false): T[] {
		const result: T[] = [];
		let needAfter = true;
		if (!optional) {
			this.skip(before.type, before.value);
		} else {
			if (!this.take(before.type, before.value)) {
				if (optionalBeforeAndAfter) {
					needAfter = false;
				} else {
					return result;
				}
			}
		}
		do {
			const node = this.doParse(item);
			if (node === null) {
				break;
			}
			result.push(node);
		} while (this.take(delimiter.type, delimiter.value));
		if (needAfter) {
			this.skip(after.type, after.value);
		}
		return result;
	}

	protected takeArrayDottedId(optional: boolean = false): string[] {
		const id: string[] = [];
		let first;
		if (first = (optional
				? <string>this.take(TokenIdentifier)
				: <string>this.skip(TokenIdentifier))) {
			id.push(first);
			while (this.take(TokenDot)) {
				id.push(<string>this.skip(TokenIdentifier));
			}
		}
		return id;
	}

	protected takeDottedId(optional: boolean = false): string | null {
		const elements = this.takeArrayDottedId(optional);
		if (elements.length === 0) {
			return null;
		}
		return elements.join('.');
	}

	protected enterBlock<T extends Node>(...call: ((c: Token, i: number) => T | null)[]): T[] {
		const result: T[] = [];
		let tok;
		while ((tok = this.input.peek(false)).isWhitespace && !(tok instanceof TokenEof) && !(tok instanceof TokenIndent)) {
			this.input.next(false);
		}
		if (tok instanceof TokenIndent) {
			this.input.next(false);
			while (true) {
				let res = null;
				for (const acall of call) {
					if ((res = this.doParse<T>(acall, this.input.peek(), result.length)) !== null) {
						break;
					}
				}
				if (res === null) {
					throw this.error('Unexpected');
				}
				result.push(res);
				while ((tok = this.input.peek(false)).isWhitespace && !(tok instanceof TokenEof) && !(tok instanceof TokenOutdent)) {
					this.input.next(false);
				}
				if (tok instanceof TokenEof || tok instanceof TokenOutdent) {
					this.input.next(false);
					break;
				}
			}
		} else if (this.take(TokenPunctuation, '{')) {
			while (!this.take(TokenPunctuation, '}')) {
				let res = null;
				for (const acall of call) {
					if ((res = this.doParse<T>(acall, this.input.peek(), result.length)) !== null) {
						break;
					}
				}
				if (res === null) {
					throw this.error('Unexpected');
				}
				result.push(res);
			}
		} else {
			let res = null;
			for (const acall of call) {
				if ((res = this.doParse<T>(acall, this.input.peek(), result.length)) !== null) {
					break;
				}
			}
			if (res === null) {
				throw this.error('Unexpected');
			}
			result.push(res);
		}
		return result;
	}

	protected parseIdentifier(): NodeIdentifier | null {
		const name = <string>(this.take(TokenIdentifier) || this.take(TokenKeyword, [
			'this',
			'null',
			// TODO: Add keywords that are identifiers
		]));
		if (name !== null) {
			return new NodeIdentifier({
				name: name,
			});
		}
		return null;
	}

	protected parseTypeName(): NodeTypeName | null {
		const name = <string>(this.take(TokenIdentifier) || this.take(TokenKeyword, [
			// TODO: Add keywords that are types
		]));
		if (name !== null) {
			return new NodeTypeName({
				name: name,
			});
		}
		return null;
	}

	protected parseTypeRef(): NodeTypeReference | null {
		const type = this.doParse(this.parseTypeName);
		if (type !== null) {
			// TODO: Parse things like generics(templates) and arrays
			return new NodeTypeReference({
				name: type,
			});
		}
		return null;
	}

	protected parsePackage(): NodePackage {
		const pack = this.take(TokenKeyword, 'package') ? this.takeDottedId() : null;
		return new NodePackage({
			package: pack,
			body: this.while<Node>(this.parseUse, this.parseVarOrVal, this.parseFun),
		});
	}

	protected parseUse(): NodeUse | null {
		if (!this.take(TokenKeyword, 'use')) {
			return null;
		}
		const id = this.takeArrayDottedId();
		// TODO: Handle as and multiple use
		return new NodeUse({
			name: id.join('.'),
			alias: id[id.length - 1],
		});
	}

	protected parseVarOrVal(): NodeVal | NodeVar | null {
		let type: {new(init: Partial<NodeVal | NodeVar>): NodeVal | NodeVar};
		if (this.take(TokenKeyword, 'val')) {
			type = NodeVal;
		} else if (this.take(TokenKeyword, 'var')) {
			type = NodeVar;
		} else {
			return null;
		}
		const name = <NodeIdentifier>this.doParse(this.parseIdentifier);
		const valType = this.take(TokenOperator, ':') ? this.doParse(this.parseTypeRef) : null;
		const initializer = this.take(TokenOperator, '=') ? this.doParse(this.parseExpression) : null;
		return new type({
			name: name,
			valType: valType,
			initializer: initializer,
		});
	}

	protected parseFun(): NodeFunction | null {
		if (this.take(TokenKeyword, 'fun')) {
			let name = this.doParse(this.parseIdentifier);
			if (name === null) {
				this.error('Function name expected');
				name = new NodeIdentifier({
					name: ''
				});
			}
			const args = this.delimited(this.parseFunArgument,
				{type: TokenPunctuation, value: '('},
				{type: TokenPunctuation, value: ','},
				{type: TokenPunctuation, value: ')'}, true, true);
			const returns = this.take(TokenOperator, ':') ? this.delimited(this.parseTypeRef,
				{type: TokenPunctuation, value: '('},
				{type: TokenPunctuation, value: ','},
				{type: TokenPunctuation, value: ')'}, true, true) : [];
			// TODO: Just-return function(fun name(some: string) = print(some))
			return new NodeFunction({
				name: name,
				arguments: args,
				returns: returns,
				body: this.enterBlock(this.parseStatement),
			})
		}
		return null;
	}

	protected parseFunArgument(): NodeFunctionArgument | null {
		const name = this.doParse(this.parseIdentifier);
		if (name !== null) {
			const type = this.take(TokenOperator, ':') ? this.doParse(this.parseTypeRef) : null;
			return new NodeFunctionArgument({
				name: name,
				targetType: type,
			});
		}
		return null;
	}

	protected parseStatement(): NodeExpression | NodeVal | NodeVar | null {
		return this.parseVarOrVal() || this.parseExpression();
	}

	protected parseExpression(): NodeExpression | null {
		return this.doParse(() => this.parseMaybeCall(() => this.doParse(this.parseMaybeBinary, this.parseAtom, 0)));
	}

	protected parseMaybeCall(calleeGen: (() => Node | null)): NodeCall | NodeExpression | null {
		const callee = calleeGen();
		if (callee === null) {
			return null;
		}
		if (this.is(TokenPunctuation, '(')) {
			return new NodeCall({
				callee: callee,
				arguments: this.delimited(this.parseCallArgument,
					{type: TokenPunctuation, value: '('},
					{type: TokenPunctuation, value: ','},
					{type: TokenPunctuation, value: ')'})
			});
		}
		return callee;
	}

	protected parseCallArgument(): NodeCallArgument | null {
		let name = null;
		if (this.is(TokenOperator, ':', 'value', true, 1)) {
			name = this.doParse(this.parseIdentifier);
			this.input.next();
		}
		const value = this.doParse(this.parseExpression);
		if (value === null) {
			throw this.error('Expression expected');
		}
		return new NodeCallArgument({
			name: name,
			value: value,
		});
	}

	protected parseAtom(): Node | null {
		if (this.take(TokenKeyword, 'null')) {
			return new NodeNull();
		}
		const number = <string | null>this.take(TokenNumber);
		if (number !== null) {
			return new NodeNumber({
				value: number
			});
		}
		const string = <string | null>this.take(TokenString);
		if (string !== null) {
			return new NodeString({
				value: string
			});
		}
		const identifier = this.parseIdentifier();
		if (identifier !== null) {
			return new NodeReference({
				name: identifier
			});
		}
		return null;
	}

	public parseMaybeBinary(left: NodeExpression, leftPrec: number): Node | null {
		const op = this.take(TokenOperator);
		if (op !== null) {
			// TODO: Compare, etc.
		}
		return left;
	}

	public parse(): NodePackage {
		const pack = <NodePackage>this.doParse(this.parsePackage);
		if (!this.eof()) {
			this.error('Unexpected');
		}
		return pack;
	}

	public eof(): boolean {
		return this.input.eof();
	}

	private error(message: string, ...tokens: Token[]): Error {
		if (tokens.length === 0) {
			tokens.push(this.input.peek());
		}
		const begin = tokens[0].begin, end = tokens[tokens.length - 1].end.relative(-1);
		const error = new SyntaxError(message, begin, end);
		this.errors && this.errors.error(error);
		return error;
	}
}