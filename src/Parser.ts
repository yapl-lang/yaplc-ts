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
	TokenSemicolon,
	TokenPunctuation,
	TokenOperator,
	TokenModifier,
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
	NodeUseAll,
	NodeIdentifier,
	NodeTypeName,
	NodeTypeReference,
	NodeNamedTypeReference,
	NodeLambdaTypeReference,
	NodeArrayTypeReference,
	NodeExpression,
	NodeDefinitionModifier,
	NodeDefinition,
	NodeVal,
	NodeVar,
	NodeFunction,
	NodeFunctionArgument,
	NodeClass,
	NodeCall,
	NodeCallArgument,
	NodeReference,
	NodeNumber,
	NodeString,
	NodeStringTemplate,
	NodePrefixUnaryOperator,
	NodeSuffixUnaryOperator,
	NodeBinaryOperator,
	NodeIf,
	NodeBlock,
} from './ast/Nodes';
import {OperatorType, OperatorsProvider} from './Operators';

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
		const whitespaces: Token[] = [];
		this.input.pushWhitespaceHandler(token => whitespaces.push(token));
		try {
			const node = <T>method.call(this, ...args);
			if (node === null) {
				return null;
			}
			const end = this.input.position;
			node.whitespaces = whitespaces;
			node.begin = node.begin || this.currentNodeBegin || begin;
			node.end = node.end || end;
			return node;
		} finally {
			this.currentNodeBegin = oldBegin;
			this.input.popWhitespaceHandler();
		}
	}

	protected parseOf<T extends Node>(...call: ((c: Token) => T | null)[]): T | null {
		let node = null;
		const tok = this.input.peek();
		for (const acall of call) {
			if ((node = this.doParse<T>(acall, tok)) !== null) {
				if (tok === this.input.peek()) {
					this.take();
					node.end = this.input.position;
				}
				break;
			} else if (tok !== this.input.peek()) {
				throw this.error(`Internal parser error: parseOf call took token but returned null; call: ${call}, token: ${tok}`);
			}
		}
		return node;
	}

	protected while<T extends Node>(...call: ((c: Token) => T | null)[]): T[] {
		const result: T[] = [];
		while (true) {
			const node = this.parseOf(...call);
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

	protected skip<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, field: string | null = 'value', skipWhitespace: boolean = true): T | string {
		if (!this.is<T>(constructor, value, field, skipWhitespace)) {
			throw this.error(`Expected ${value === null ? constructor === null ? '' : constructor.name : value}`, this.input.peek());
		}
		return <T | string>this.take<T>(null, null, field, skipWhitespace);
	}

	protected take<T extends Token>(constructor: {new(): T} | null = null, value: string[] | string | null = null, field: string | null = 'value', skipWhitespace: boolean = true): T | string | null {
		if (!this.is<T>(constructor, value, field, skipWhitespace)) {
			return null;
		}
		if (this.currentNodeBegin === null && !this.input.peek().isWhitespace) {
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
		let tok, skipCounter = -1, wasDelim = false, wasClosingDelim = false;
		while ((tok = this.input.peek(false, skipCounter + 1)).isWhitespace && !(tok instanceof TokenEof) && !(tok instanceof TokenIndent)) {
			++skipCounter;
			wasDelim = true;
			if (tok instanceof TokenNewline || tok instanceof TokenSemicolon) {
				wasClosingDelim = true;
			}
		}
		if (tok instanceof TokenIndent) {
			this.input.next(false, skipCounter + 1);
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
			this.input.next(false, skipCounter);
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
		} else if (wasDelim && !wasClosingDelim) {
			this.input.next(false, skipCounter);
			let res = null;
			for (const acall of call) {
				if ((res = this.doParse<T>(acall, this.input.peek(), result.length)) !== null) {
					break;
				}
			}
			if (res !== null) {
				result.push(res);
			}
		}
		return result;
	}

	protected parseIdentifier(): NodeIdentifier | null {
		const name = <string>(this.take(TokenIdentifier) || this.take(TokenKeyword, [
			'null',
			'this',
			'true',
			'false',
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
		if (this.is(TokenKeyword, 'fun')) {
			const func = this.doParse(this.parseFun, true, false);
			if (func === null) {
				throw this.error('Expected function template', this.input.peek(true, 1));
			}
			return new NodeLambdaTypeReference({
				func: func
			});
		}
		if (this.is(TokenPunctuation, '[')) {
			const dimensions = this.delimited(() => this.parseExpression(),
				{type: TokenPunctuation, value: '['},
				{type: TokenPunctuation, value: ','},
				{type: TokenPunctuation, value: ']'})
			const nextType = this.doParse(this.parseTypeRef);
			if (nextType === null) {
				throw this.error('Type expected');
			}
			return new NodeArrayTypeReference({
				target: nextType,
				dimensions
			});
		}
		const type = this.doParse(this.parseTypeName);
		if (type !== null) {
			// TODO: Parse things like generics(templates)
			return new NodeNamedTypeReference({
				name: type,
			});
		}
		return null;
	}

	protected parsePackage(): NodePackage {
		const pack = this.take(TokenKeyword, 'package') ? this.takeDottedId() : null;
		return new NodePackage({
			package: pack,
			body: this.while<Node>(this.parseUse, this.parseDefinition),
		});
	}

	protected parseUse(): NodeUse | NodeUseAll | null {
		if (!this.take(TokenKeyword, 'use')) {
			return null;
		}
		const pack = [<string>this.skip(TokenIdentifier)];
		while (this.take(TokenDot)) {
			if (this.take(TokenOperator, '*')) {
				return new NodeUseAll({
					package: pack.join('.')
				});
			}
			let id = <string | null>this.take(TokenIdentifier);
			if (id === null) {
				throw this.error('Expected identifier or *');
			}
			pack.push(id);
		}
		const alias = this.take(TokenKeyword, 'as') ? <string>this.skip(TokenIdentifier) : pack[pack.length - 1];
		return new NodeUse({
			name: pack.join('.'),
			alias: alias,
		});
	}

	protected parseDefinition(): NodeDefinition | null {
		const modifiers = this.while(tok => tok instanceof TokenModifier ? new NodeDefinitionModifier({ value: <string>this.take() }) : null);
		const definition = this.parseOf<NodeDefinition>(this.parseVarOrVal, () => this.parseFun(), this.parseClass);
		if (definition !== null) {
			definition.modifiers = modifiers;
		} else if (modifiers.length !== 0) {
			// TODO: Rollback if parse failed
			throw this.error('Unhandled parser situation');
		}
		return definition;
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

	protected parseFun(expression: boolean = false, hasBody: boolean = true): NodeFunction | null {
		if (this.take(TokenKeyword, 'fun')) {
			let name = this.doParse(this.parseIdentifier);
			if (!expression && name === null) {
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
			this.take(TokenOperator, '=');
			return new NodeFunction({
				name: name,
				arguments: args,
				returns: returns,
				body: hasBody ? this.doParse(this.parseExpressionalBlock) : null,
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


	protected parseClass(): NodeClass | null {
		if (this.take(TokenKeyword, 'class')) {
			const name = this.doParse(this.parseTypeName);
			if (name === null) {
				throw this.error('Class name expected');
			}
			const children = this.enterBlock<NodeDefinition>(this.parseDefinition);
			return new NodeClass({
				name: name,
				children: children
			});
		}
		return null;
	}


	// Everything that are related to code in functions and expressions
	protected parseStatement(): NodeExpression | NodeVal | NodeVar | null {
		return this.doParse(this.parseVarOrVal) || this.doParse(this.parseExpression);
	}

	protected parseExpression(canBlock: boolean = false): NodeExpression | null {
		return this.doParse(() => this.parseMaybeUnary(() => this.doParse(this.parseMaybeCall, () => this.doParse(this.parseMaybeBinary, this.doParse(this.parseAtom, canBlock), 128))));
	}

	protected parseExpressionalBlock(): NodeExpression | null {
		const exps = this.enterBlock(this.parseStatement);
		switch (exps.length) {
		case 0:
			return null;
		case 1:
			return exps[0];
		default:
			return new NodeBlock({
				expressions: exps
			});
		}
	}

	protected parseMaybeCall(calleeGen: (() => Node | null)): NodeCall | NodeExpression | null {
		const callee = calleeGen();
		if (callee === null) {
			return null;
		}
		const call = new NodeCall({ callee: callee, arguments: [] });
		let returnCall = false;
		if (this.is(TokenPunctuation, '(')) {
			call.arguments = this.delimited(this.parseCallArgument,
				{type: TokenPunctuation, value: '('},
				{type: TokenPunctuation, value: ','},
				{type: TokenPunctuation, value: ')'});
			returnCall = true;
		}
		const expBlock = this.doParse(this.parseExpressionalBlock);
		if (expBlock !== null) {
			call.suffix = expBlock;
			returnCall = true;
		}
		return returnCall ? call : callee;
	}

	protected parseCallArgument(): NodeCallArgument | null {
		let name = null;
		if (this.is(TokenOperator, ':', 'value', true, 1)) {
			name = this.doParse(this.parseIdentifier);
			this.take();
		}
		const value = this.doParse(this.parseExpression);
		if (value === null) {
			return null;
		}
		return new NodeCallArgument({
			name: name,
			value: value,
		});
	}

	protected parseStringTemplate(): NodeStringTemplate | null {
		if (this.take(TokenPunctuation, '`')) {
			const expressions = [];
			while (!this.take(TokenPunctuation, '`')) {
				const exp = this.doParse(this.parseExpression);
				if (exp === null) {
					throw this.error('Expression expected');
				}
				expressions.push(exp);
			}
			return new NodeStringTemplate({
				expressions: expressions
			});
		}
		return null;
	}

	protected parseAtom(canBlock: boolean = false): Node | null {
		if (this.take(TokenPunctuation, '(')) {
			const exp = this.doParse(this.parseExpression);
			if (exp === null) {
				throw this.error('Expression expected');
			}
			this.skip(TokenPunctuation, ')');
			return exp;
		}
		const number = <string | null>this.take(TokenNumber);
		if (number !== null) {
			return new NodeNumber({
				value: number
			});
		}
		const string = <TokenString | null>this.take(TokenString, null, null);
		if (string !== null) {
			return new NodeString({
				stringType: string.stringType,
				value: string.value,
			});
		}
		if (this.is(TokenPunctuation, '`')) {
			return this.doParse(this.parseStringTemplate);
		}
		const identifier = this.doParse(this.parseIdentifier);
		if (identifier !== null) {
			return new NodeReference({
				name: identifier
			});
		}
		const fun = this.doParse(this.parseFun, true);
		if (fun !== null) {
			return fun;
		}
		const ifnode = this.doParse(this.parseIf);
		if (ifnode !== null) {
			return ifnode;
		}
		if (canBlock) {
			const block = this.enterBlock(this.parseStatement);
			return new NodeBlock({
				expressions: block
			});
		}
		return null;
	}

	protected parseMaybeUnary(expGen: (() => NodeExpression | null)): NodeExpression | NodePrefixUnaryOperator | NodeSuffixUnaryOperator | null {
		let op = this.input.peek();
		if (op instanceof TokenOperator) {
			const thatOp = OperatorsProvider.get(op.value, OperatorType.PrefixUnary);
			if (thatOp !== null) {
				this.take();
				const exp = expGen();
				if (exp === null) {
					return null;
				}
				return new NodePrefixUnaryOperator({
					op: thatOp,
					exp: exp
				});
			}
		}
		const exp = expGen();
		if (exp === null) {
			return null;
		}
		op = this.input.peek(false);
		if (op instanceof TokenOperator) {
			const thatOp = OperatorsProvider.get(op.value, OperatorType.SuffixUnary);
			if (thatOp !== null) {
				this.take();
				return new NodeSuffixUnaryOperator({
					op: thatOp,
					exp: exp
				});
			}
		}
		return exp;
	}

	public parseMaybeBinary(left: NodeExpression, leftPriority: number): Node | null {
		const op = this.input.peek();
		if (op instanceof TokenOperator) {
			const thatOp = OperatorsProvider.get(op.value, OperatorType.Binary);
			if (thatOp !== null && thatOp.priority <= leftPriority) {
				this.take();
				const right = <NodeBinaryOperator>this.doParse(this.parseMaybeBinary, this.doParse(this.parseAtom), thatOp.priority);
				const current = new NodeBinaryOperator({
					op: thatOp,
					left: left,
					right: right,
				});
				return this.doParse(this.parseMaybeBinary, current, leftPriority);
			}
		}
		return left;
	}

	public parseIf(): NodeIf | null {
		if (this.take(TokenKeyword, 'if')) {
			const condition = this.doParse(this.parseExpressionalBlock);
			if (condition === null) {
				throw this.error('Condition expected');
			}
			this.take(TokenKeyword, 'then');
			const then = this.doParse(this.parseExpressionalBlock);
			if (then === null) {
				throw this.error('Expression expected');
			}
			let elsee = null;
			if (this.take(TokenKeyword, 'else') && (elsee = this.doParse(this.parseExpressionalBlock)) === null) {	
				throw this.error('Expression expected');
			}
			return new NodeIf({
				condition: condition,
				then: then,
				else: elsee,
			});
		}
		return null;
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