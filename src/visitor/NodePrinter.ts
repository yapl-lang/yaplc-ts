import Node from '../ast/Node';
import {
	NodePackage,
	NodeUse,
	NodeIdentifier,
	NodeTypeName,
	NodeNamedTypeReference,
	NodeLambdaTypeReference,
	NodeArrayTypeReference,
	NodeVal,
	NodeVar,
	NodeFunction,
	NodeFunctionArgument,
	NodeExpression,
	NodeCall,
	NodeCallArgument,
	NodeReference,
	NodeNumber,
	NodeString,
	NodePrefixUnaryOperator,
	NodeSuffixUnaryOperator,
	NodeBinaryOperator,
	NodeIf,
	NodeBlock,
} from '../ast/Nodes';
import ArrayUtil from '../util/Array';
import StringUtil from '../util/String';
import NodeVisitor from './NodeVisitor';

export interface NodePrinterTarget {
	append(data: string): void;
}

export class NodePrinterMemoryTarget implements NodePrinterTarget {
	private buffer: string = '';
	private microBuffer: string = '';

	protected flush(data: string = ''): void {
		if (this.microBuffer.length > 0) {
			this.buffer += this.microBuffer;
			this.microBuffer = data;
		}
	}

	append(data: string): void {
		if (this.microBuffer.length + data.length >= 256) {
			this.flush(data);
		} else {
			this.microBuffer += data;
		}
	}

	get(): string {
		this.flush();
		return this.buffer;
	}
}

export class NodePrinterStdoutTarget implements NodePrinterTarget {
	append(data: string): void {
		process.stdout.write(data);
	}
}

export abstract class NodePrinter extends NodeVisitor {
	protected target: NodePrinterTarget | null = null;

	public print(node: Node, target: NodePrinterTarget) {
		if (this.target !== null) {
			throw new Error('Printer is already printing');
		}
		this.reset();
		this.target = target;
		try {
			node.visit(this);
		} finally {
			this.target = null;
		}
	}

	protected onPrint(str: string) {
		(<NodePrinterTarget>this.target).append(str);
	}

	protected a(...data: any[]): this {
		if (this.target === null) {
			throw new Error('Printer is not printing');
		}
		for (const str of data) {
			if (str instanceof Node) {
				str.visit(this);
			} else if (str instanceof Array) {
				this.a(...str);
			} else {
				this.onPrint(typeof str === 'string' ? str : str === null ? '' : str.toString());
			}
		}
		return this;
	}

	protected reset(): void {

	}
}

export abstract class NodePrettyPrinter extends NodePrinter {
	protected wasNl: boolean = true;
	protected needIndent: boolean = true;
	protected indentSize: number = 0;

	constructor(protected indent: string = '\t') {
		super();
	}

	public print(node: Node, target: NodePrinterTarget, startIndent: number = 0) {
		this.indentSize = startIndent;
		super.print(node, target);
	}

	protected onPrint(str: string) {
		if (str.length !== 0 && this.needIndent) {
			this.needIndent = false;
			super.a(this.indent.repeat(this.indentSize));
		}
		super.onPrint(str);
	}

	protected a(...data: any[]): this {
		if (data.length > 0 && this.wasNl) {
			this.wasNl = false;
			this.needIndent = true;
		}
		super.a(...data);
		return this;
	}

	protected nl(...data: any[]): this {
		this.a(...data, '\n');
		this.wasNl = true;
		return this;
	}

	protected ind(call: () => void): this {
		++this.indentSize;
		try {
			call();
		} finally {
			--this.indentSize;
		}
		return this;
	}

	protected reset(): void {
		this.indentSize = 0;
	}
}

export class NodeCodePrettyPrinter extends NodePrettyPrinter {
	protected block(call: () => void, before: string = '{', after: string = '}'): this {
		return this.nl(before).ind(call).a(after);
	}

	visitNodePackage(node: NodePackage): void {
		if (node.package !== null) {
			this.nl('package ', node.package).nl();
		}
		node.body.forEach(sub => this.nl(sub).nl());
	}

	visitNodeUse(node: NodeUse): void {
		if (node.name.substr(node.name.length - node.alias.length - 1) === '.' + node.alias || node.name == node.alias) {
			this.a('use ', node.name);
		} else {
			this.a('use ', node.name, ' as ', node.alias);
		}
	}

	visitNodeTypeName(node: NodeTypeName): void {
		this.a(node.name);
	}

	visitNodeIdentifier(node: NodeIdentifier): void {
		this.a(node.name);
	}


	visitNodeNamedTypeReference(node: NodeNamedTypeReference): void {
		this.a(node.name);
	}

	visitNodeLambdaTypeReference(node: NodeLambdaTypeReference): void {
		const func = node.func;
		this.a('fun(', func.arguments, ')');
		switch (func.returns.length) {
		case 0:
			break;
		case 1:
			this.a(': ', func.returns[0]);
			break;
		default:
			this.a(': (', func.returns, ')');
			break;
		}
	}

	visitNodeArrayTypeReference(node: NodeArrayTypeReference): void {
		this.a('[', ArrayUtil.fillBetween<any>(node.dimensions, ', '), ']', node.target);
	}

	visitNodeVal(node: NodeVal): void {
		this.a('val ', node.name);
		if (node.valType !== null) {
			this.a(': ', node.valType);
		}
		if (node.initializer !== null) {
			this.a(' = ', node.initializer);
		}
	}

	visitNodeVar(node: NodeVar): void {
		this.a('var ', node.name);
		if (node.valType !== null) {
			this.a(': ', node.valType);
		}
		if (node.initializer !== null) {
			this.a(' = ', node.initializer);
		}
		this.nl();
	}

	visitNodeFunction(node: NodeFunction): void {
		this.a('fun');
		if (node.name !== null) {
			this.a(' ', node.name);
		}
		if (node.arguments.length > 0) {
			this.a('(', ArrayUtil.fillBetween<any>(node.arguments, ', '), ')');
		}
		if (node.returns.length > 0) {
			this.a(': ');
			if (node.returns.length === 1) {
				this.a(node.returns[0]);
			} else {
				this.a('(', ArrayUtil.fillBetween<any>(node.returns, ', '), ')');
			}
		}
		this.a(' ', node.body);
	}

	visitNodeFunctionArgument(node: NodeFunctionArgument): void {
		this.a(node.name);
		if (node.targetType !== null) {
			this.a(': ', node.targetType);
		}
	}

	visitNodeCall(node: NodeCall): void {
		this.a(node.callee, '(', ArrayUtil.fillBetween<any>(node.arguments, ', '), ')');
	}

	visitNodeCallArgument(node: NodeCallArgument): void {
		if (node.name !== null) {
			this.a(node.name, ': ');
		}
		this.a(node.value);
	}

	visitNodeReference(node: NodeReference): void {
		this.a(node.name);
	}

	visitNodeNumber(node: NodeNumber): void {
		this.a(node.value);
	}

	visitNodeString(node: NodeString): void {
		this.a(node.stringType, StringUtil.escape(node.value), node.stringType);
	}

	visitNodePrefixUnaryOperator(node: NodePrefixUnaryOperator): void {
		this.a(node.op.value, node.exp);
	}

	visitNodeSuffixUnaryOperator(node: NodeSuffixUnaryOperator): void {
		this.a(node.exp, node.op.value);
	}

	visitNodeBinaryOperator(node: NodeBinaryOperator): void {
		this.a(node.left, node.op.value, node.right);
	}

	visitNodeIf(node: NodeIf): void {
		this.a('if ', node.condition, ' then ', node.then);
		if (node.else !== null) {
			this.a('else ', node.else);
		}
	}

	visitNodeBlock(node: NodeBlock): void {
		this.block(() => node.expressions.forEach(sub => this.nl(sub)));
	}
}