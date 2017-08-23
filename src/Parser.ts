import CodePosition from './CodePosition';
import TokenStream from './TokenStream';
import ErrorHandler from './error/ErrorHandler';
import CompilationError from './error/Error';
import SyntaxError from './error/SyntaxError';
import {
	default as Token,
	ValueToken
 } from './token/Token';
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
	NodeType,
	NodeClass,
	NodeInterface,
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

class TokenTemplate<T extends Token = Token, Value = string> {
	readonly type?: {new(): T};
	readonly value?: Value[] | Value;
	readonly skipWhitespace?: boolean;
	readonly skip?: number;

	static toString<T extends Token = Token, Value = string>(template: TokenTemplate<T, Value> | {new(): Token}): string {
		if (template instanceof Function) {
			return template.name;
		}

		template instanceof Function ? template.name : (template.value
				? (template.value instanceof Array ? template.value: [template.value]).map(val => `'${val}'`).join(' or ')
				: template.constructor.name)

		return [
			template.type ? 'Token ' + template.type.name : null,
			template.value ? ('Value ' + (template.value instanceof Array ? template.value.join(' or ') : template.value)) : null,
			template.skipWhitespace ? 'Skip Whitespace' : null,
			template.skip ? 'Skip ' + template.skip : null,
		].filter(i => i !== null).join(', ');
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

	// Basic parsing functions
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

	// Functions-consumers
	protected is<T extends Token = Token, Value = string>(template: TokenTemplate<T, Value> | {new(): T} = {}): boolean {
		if (template instanceof Function) {
			template = { type: template };
		}

		const tok = this.input.peek(template.skipWhitespace, template.skip);

		if (template.type !== void 0 && !(tok instanceof (template.type))) {
			return false;
		}

		if (template.value !== void 0) {
			if (!(tok instanceof ValueToken)) {
				throw new Error(`Template has value but Token is not ValueToken`);
			}

			if (template.value instanceof Array) {
				if (!template.value.includes(tok.value)) {
					return false;
				}
			} else {
				if (template.value !== tok.value) {
					return false;
				}
			}
		}

		return true;
	}

	protected take<T extends Token = Token, Value = string>(template: TokenTemplate<T, Value> | {new(): T} = {}): T | null {
		if (template instanceof Function) {
			template = { type: template };
		}

		if (!this.is<T, Value>(template)) {
			return null;
		}
		if (this.currentNodeBegin === null && !this.input.peek().isWhitespace) {
			this.currentNodeBegin = this.input.peek().begin;
		}
		return <T>this.input.next(template.skipWhitespace, template.skip);
	}

	protected skip<T extends Token = Token, Value = string>(template: TokenTemplate<T, Value> | {new(): T} = {}): T {
		const token = this.take<T, Value>(template);
		if (token === null) {
			throw this.error(`Expected ${TokenTemplate.toString(template)}`, this.input.peek());
		}
		return token;
	}

	protected takeValue<T extends ValueToken<T, Value> = ValueToken<T, Value>, Value = string>(template: TokenTemplate<T, Value> | {new(): T} = {}): Value | null {
		const tok = this.take<T, Value>(template);
		if (tok === null) {
			return null;
		}
		return tok.value;
	}

	protected skipValue<T extends ValueToken<T, Value> = ValueToken<T, Value>, Value = string>(template: TokenTemplate<T, Value> | {new(): T} = {}): Value {
		return this.skip<T, Value>(template).value;
	}

	// Utils
	protected delimited<T extends Node>(
		item: string | String | ((c: Token, i: number) => T | null),
		before: TokenTemplate | null = null,
		delimiter: TokenTemplate | null = null,
		after: TokenTemplate | null = before,
		optional: boolean = false,
		optionalBeforeAndAfter: boolean = false): T[] {
		const result: T[] = [];
		let needAfter = true;
		if (before !== null) {
			if (!optional) {
				this.skip(before);
			} else {
				if (!this.take(before)) {
					if (optionalBeforeAndAfter) {
						needAfter = false;
					} else {
						return result;
					}
				}
			}
		}
		do {
			const node = this.doParse(item);
			if (node === null) {
				break;
			}
			result.push(node);
		} while (delimiter === null || this.take(delimiter));
		if (after !== null && needAfter) {
			this.skip(after);
		}
		return result;
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
		} else if (this.take({ type: TokenPunctuation, value: '{' })) {
			this.input.next(false, skipCounter);
			while (!this.take({ type: TokenPunctuation, value: '}' })) {
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

	protected takeArrayDottedId(optional: boolean = false): string[] {
		const id: string[] = [];
		let first;
		if (first = (optional
				? this.takeValue(TokenIdentifier)
				: this.skipValue(TokenIdentifier))) {
			id.push(first);
			while (this.take(TokenDot)) {
				id.push(this.skipValue(TokenIdentifier));
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

	// Simple things parsers
	protected parseIdentifier(): NodeIdentifier | null {
		const name = this.takeValue(TokenIdentifier) || this.takeValue({ type: TokenKeyword, value: [
			'null',
			'this',
			'true',
			'false',
			// TODO: Add keywords that are identifiers
		]});
		if (name !== null) {
			return new NodeIdentifier({
				name: name,
			});
		}
		return null;
	}

	protected parseTypeName(): NodeTypeName | null {
		const name = this.takeValue(TokenIdentifier) || this.takeValue({ type: TokenKeyword, value: <string[]>[
			// TODO: Add keywords that are types
		]});
		if (name !== null) {
			return new NodeTypeName({
				name: name,
			});
		}
		return null;
	}

	protected parseTypeRef(): NodeTypeReference | null {
		if (this.is({ type: TokenKeyword, value: 'fun'} )) {
			const func = this.doParse(this.parseFun, true, false);
			if (func === null) {
				throw this.error('Expected function template', this.input.peek(true, 1));
			}
			return new NodeLambdaTypeReference({
				func: func
			});
		}
		if (this.is({ type: TokenPunctuation, value: '['})) {
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

	// Root-level nodes parsers
	protected parsePackage(): NodePackage {
		const pack = this.take({ type: TokenKeyword, value: 'package' }) ? this.takeDottedId() : null;
		return new NodePackage({
			package: pack,
			body: this.while<Node>(this.parseUse, this.parseDefinition),
		});
	}

	protected parseUse(): NodeUse | NodeUseAll | null {
		if (!this.take({ type: TokenKeyword, value: 'use' })) {
			return null;
		}
		const pack = [this.skipValue(TokenIdentifier)];
		while (this.take(TokenDot)) {
			if (this.take({ type: TokenOperator, value: '*'})) {
				return new NodeUseAll({
					package: pack.join('.')
				});
			}
			let id = this.takeValue(TokenIdentifier);
			if (id === null) {
				throw this.error('Expected identifier or *');
			}
			pack.push(id);
		}
		const alias = this.takeValue({ type: TokenKeyword, value: 'as' }) ? this.skipValue(TokenIdentifier) : pack[pack.length - 1];
		return new NodeUse({
			name: pack.join('.'),
			alias: alias,
		});
	}

	// Definitions parsers
	protected parseDefinition(): NodeDefinition | null {
		const modifiers = this.while(tok => tok instanceof TokenModifier ? new NodeDefinitionModifier({ value: this.skipValue() }) : null);
		const definition = this.parseOf<NodeDefinition>(this.parseVarOrVal, () => this.parseFun(), this.parseClass, this.parseInterface);
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
		if (this.take({ type: TokenKeyword, value: 'val' })) {
			type = NodeVal;
		} else if (this.take({ type: TokenKeyword, value: 'var' })) {
			type = NodeVar;
		} else {
			return null;
		}
		const name = <NodeIdentifier>this.doParse(this.parseIdentifier);
		const valType = this.take({ type: TokenOperator, value: ':' }) ? this.doParse(this.parseTypeRef) : null;
		const initializer = this.take({ type: TokenOperator, value: '=' }) ? this.doParse(this.parseExpression) : null;
		return new type({
			name: name,
			valType: valType,
			initializer: initializer,
		});
	}

	protected parseFun(expression: boolean = false, hasBody: boolean = true): NodeFunction | null {
		if (this.take({ type: TokenKeyword, value: 'fun' })) {
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
			const returns = this.take({ type: TokenOperator, value: ':' }) ? this.delimited(this.parseTypeRef,
				{type: TokenPunctuation, value: '('},
				{type: TokenPunctuation, value: ','},
				{type: TokenPunctuation, value: ')'}, true, true) : [];
			this.take({ type: TokenOperator, value: '=' });
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
			const type = this.take({ type: TokenOperator, value: ':' }) ? this.doParse(this.parseTypeRef) : null;
			return new NodeFunctionArgument({
				name: name,
				targetType: type,
			});
		}
		return null;
	}

	protected parseType<T extends NodeType>(constructor: {new(init?: Partial<NodeType>): T}, before: string, header?: (node: T) => void): T | null {
		if (this.take({ type: TokenKeyword, value: before })) {
			const name = this.doParse(this.parseTypeName);
			if (name === null) {
				throw this.error('Type name expected');
			}
			const node = new constructor({
				name: name
			});
			header && header(node);
			node.children = this.enterBlock(this.parseDefinition);
			return node;
		}
		return null;
	}

	protected parseClass(): NodeClass | null {
		return this.parseType(NodeClass, 'class', node => {
			if (this.take({ type: TokenKeyword, value: 'extends' })) {
				node.superclass = this.doParse(this.parseTypeRef);
				if (this.is({ type: TokenPunctuation, value: ',' })) {
					throw this.error('Class cannot have multiple superclasses');
				}
			}

			if (this.take({ type: TokenKeyword, value: 'implements' })) {
				node.superinterfaces = this.delimited(this.parseTypeRef, null, { type: TokenPunctuation, value: ',' });
			}
		});
	}

	protected parseInterface(): NodeInterface | null {
		return this.parseType(NodeInterface, 'interface', node => {
			if (this.take({ type: TokenKeyword, value: 'extends' })) {
				node.superinterfaces = this.delimited(this.parseTypeRef, null, { type: TokenPunctuation, value: ',' });
			}
		});
	}


	// Statements, expressions
	protected parseStatement(): NodeExpression | NodeVal | NodeVar | null {
		return this.parseOf(this.parseVarOrVal, () => this.parseFun(), () => this.parseExpression());
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
		if (this.is({ type: TokenPunctuation, value: '(' })) {
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
		if (this.is({ type: TokenOperator, value: ':', skip: 1 })) {
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
		if (this.take({ type: TokenPunctuation, value: '`' })) {
			const expressions = [];
			do {
				const exp = this.doParse(this.parseExpression);
				if (exp === null) {
					throw this.error('Expression expected');
				}
				expressions.push(exp);
			} while (this.take({ type: TokenPunctuation, value: ',' }));
			this.skip({ type: TokenPunctuation, value: '`' });
			return new NodeStringTemplate({
				expressions: expressions
			});
		}
		return null;
	}

	protected parseAtom(canBlock: boolean = false): Node | null {
		if (this.take({ type: TokenPunctuation, value: '(' })) {
			const exp = this.doParse(this.parseExpression);
			if (exp === null) {
				throw this.error('Expression expected');
			}
			this.skip({ type: TokenPunctuation, value: ')' });
			return exp;
		}
		const number = this.takeValue(TokenNumber);
		if (number !== null) {
			return new NodeNumber({
				value: number
			});
		}
		const string = this.take(TokenString);
		if (string !== null) {
			return new NodeString({
				stringType: string.stringType,
				value: string.value,
			});
		}
		if (this.is({ type: TokenPunctuation, value: '`' })) {
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
		if (this.take({ type: TokenKeyword, value: 'if' })) {
			const condition = this.doParse(this.parseExpressionalBlock);
			if (condition === null) {
				throw this.error('Condition expected');
			}
			this.take({ type: TokenKeyword, value: 'then' });
			const then = this.doParse(this.parseExpressionalBlock);
			if (then === null) {
				throw this.error('Expression expected');
			}
			let elsee = null;
			if (this.take({ type: TokenKeyword, value: 'else' }) && (elsee = this.doParse(this.parseExpressionalBlock)) === null) {	
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

	// API
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

	private error(message: string, ...tokens: Token[]): CompilationError {
		if (tokens.length === 0) {
			tokens.push(this.input.peek());
		}
		const begin = tokens[0].begin, end = tokens[tokens.length - 1].end.relative(-1);
		const error = new SyntaxError(message, begin, end);
		this.errors && this.errors.error(error);
		return error;
	}
}