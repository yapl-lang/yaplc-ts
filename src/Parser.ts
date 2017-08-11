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
	TokenString,
} from './token/Tokens';
import Node from './ast/Node';
import {
	NodePackage,
	NodeUse,
	NodeTypeReference,
	NodeVal,
	NodeVar,
	NodeFunction,
	NodeFunctionArgument,
	NodeExpression,
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

	protected skip<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, skipWhitespace: boolean = true, field: string | null = null): T | string {
		if (!this.is<T>(constructor, value, skipWhitespace, field)) {
			throw this.error(`Expected ${value === null ? constructor === null ? '' : constructor.name : value}`, this.input.peek());
		}
		return <T | string>this.take<T>(constructor, value, skipWhitespace, field);
	}

	protected take<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, skipWhitespace: boolean = true, field: string | null = null): T | string | null {
		if (!this.is<T>(constructor, value, skipWhitespace, field)) {
			return null;
		}
		if (this.currentNodeBegin === null) {
			this.currentNodeBegin = this.input.peek().begin;
		}
		const tok = <T>this.input.next(skipWhitespace);
		if (field) {
			return (<any>tok)[field];
		}
		return tok;
	}

	protected is<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, skipWhitespace: boolean = true, field: string | null = 'value'): boolean {
		const tok = this.input.peek(skipWhitespace);
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
		optional: boolean = false): T[] {
		const result: T[] = [];
		if (!optional) {
			this.skip(before.type, before.value);
		} else {
			if (!this.take(before.type, before.value)) {
				return result;
			}
		}
		do {
			const node = this.doParse(item);
			if (node === null) {
				break;
			}
			result.push(node);
		} while (this.take(delimiter.type, delimiter.value));
		this.skip(after.type, after.value);
		return result;
	}

	protected takeArrayDottedId(optional: boolean = false): string[] {
		const id: string[] = [];
		let first;
		if (first = (optional
				? <string>this.take(TokenIdentifier, null, true, 'value')
				: <string>this.skip(TokenIdentifier, null, true, 'value'))) {
			id.push(first);
			while (this.take(TokenDot)) {
				id.push(<string>this.skip(TokenIdentifier, null, true, 'value'));
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

	protected parseTypeRef(): NodeTypeReference | null {
		const type = <string>(this.take(TokenIdentifier, null, true, 'value') || this.take(TokenKeyword, [
			// TODO: Add keywords that are types
		], true, 'value'));
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
		const name = <string>this.skip(TokenIdentifier, null, true, 'value');
		// TODO: Parse type
		if (this.take(TokenOperator, '=')) {
			// TODO: Parse initializer as an expression
		}
		return new type({
			name: name,
			initializer: null,
		});
	}

	protected parseFun(): NodeFunction | null {
		if (this.take(TokenKeyword, 'fun')) {
			const name = this.skip(TokenIdentifier, null, true, 'value');
			const args = this.delimited(this.parseFunArgument,
				{type: TokenPunctuation, value: '('}, {type: TokenPunctuation, value: ','}, {type: TokenPunctuation, value: ')'}, true);
			return new NodeFunction({
				arguments: args,
				//body: this.enterBlock(),
			})
		}
		return null;
	}

	protected parseFunArgument(): NodeFunctionArgument | null {
		const name = <string>this.take(TokenIdentifier, null, true, 'value');
		if (name !== null) {
			const type = this.take(TokenOperator, ':', true, 'value') ? this.doParse(this.parseTypeRef) : null;
			return new NodeFunctionArgument({
				name: name,
				targetType: type,
			});
		}
		return null;
	}

	public parse(): NodePackage {
		return <NodePackage>this.doParse(this.parsePackage);
	}

	public eof(): boolean {
		return this.input.eof();
	}

	private error(message: string, ...tokens: Token[]): Error {
		if (tokens.length === 0) {
			tokens.push(this.input.peek());
		}
		const begin = tokens[0].begin, end = tokens[tokens.length - 1].end;
		const error = new SyntaxError(message, begin, end);
		this.errors && this.errors.error(error);
		return error;
	}
}