import Node from '../ast/Node';
import {
	NodePackage,
	NodeUse,
	NodeUseAll,
	NodeIdentifier,
	NodeTypeReference,
	NodeNamedTypeReference,
	NodeLambdaTypeReference,
	NodeArrayTypeReference,
	NodeGenericTypeReference,
	NodeGenericParameter,
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
} from '../ast/Nodes';
import ArrayUtil from '../util/Array';
import StringUtil from '../util/String';
import {NodeCompactVisitorInterface, compactVisit} from '../visitor/NodeVisitor';
import NodePrettyPrinter from './NodePrettyPrinter';

export default class NodeCodePrettyPrinter extends NodePrettyPrinter implements NodeCompactVisitorInterface {
	protected block(call: () => void, before: string = '{', after: string = '}'): this {
		return this.nl(before).ind(call).a(after);
	}

	visit(node: Node) {
		compactVisit(node, this);
	}

	NodePackage(node: NodePackage): void {
		if (node.package !== null) {
			this.nl('package ', node.package).nl();
		}
		node.body.forEach(sub => this.nl(sub).nl());
	}

	NodeUse(node: NodeUse): void {
		if (node.name.substr(node.name.length - node.alias.length - 1) === '.' + node.alias || node.name == node.alias) {
			this.a('use ', node.name);
		} else {
			this.a('use ', node.name, ' as ', node.alias);
		}
	}

	NodeUseAll(node: NodeUseAll): void {
		this.a('use ', node.package, '.*');
	}

	NodeIdentifier(node: NodeIdentifier): void {
		this.a(node.name);
	}


	NodeNamedTypeReference(node: NodeNamedTypeReference): void {
		this.a(node.name);
	}

	NodeLambdaTypeReference(node: NodeLambdaTypeReference): void {
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

	NodeArrayTypeReference(node: NodeArrayTypeReference): void {
		this.a('[', ArrayUtil.fillBetween<any>(node.dimensions, ', '), ']', node.target);
	}

	NodeGenericTypeReference(node: NodeGenericTypeReference): void {
		this.a('<', ArrayUtil.fillBetween<any>(node.parameters, ', '), '>', node.target);
	}

	NodeGenericParameter(node: NodeGenericParameter): void {
		this.a(node.target);
		node.default && this.a(' = ', node.default);
	}

	NodeDefinitionModifier(node: NodeDefinitionModifier): void {
		this.a(node.value, ' ');
	}

	NodeVal(node: NodeVal): void {
		this.a('val ', node.name);
		if (node.valType !== null) {
			this.a(': ', node.valType);
		}
		if (node.initializer !== null) {
			this.a(' = ', node.initializer);
		}
	}

	NodeVar(node: NodeVar): void {
		this.a('var ', node.name);
		if (node.valType !== null) {
			this.a(': ', node.valType);
		}
		if (node.initializer !== null) {
			this.a(' = ', node.initializer);
		}
		this.nl();
	}

	NodeFunction(node: NodeFunction): void {
		this.a('fun');
		this.NodeFunctionAfterKw(node);
	}

	NodeFunctionAfterKw(node: NodeFunction) {
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
		node.body && this.a(' ', node.body);
	}

	NodeFunctionArgument(node: NodeFunctionArgument): void {
		this.a(node.name);
		if (node.targetType !== null) {
			this.a(': ', node.targetType);
		}
	}

	NodeType(node: NodeType): void {
		this.block(() => node.children.forEach(child => this.nl(child)), ' {');
	}

	NodeClass(node: NodeClass): void {
		this.a(node.modifiers, 'class ', node.name);
		node.primaryConstructor && this.NodeFunctionAfterKw(node.primaryConstructor);
		node.superclass && this.a(' extends ', node.superclass);
		node.superinterfaces.length !== 0 && this.a(' implements ', ArrayUtil.fillBetween<any>(node.superinterfaces, ', '));
		this.NodeType(node);
	}

	NodeInterface(node: NodeInterface): void {
		this.a(node.modifiers, 'interface ', node.name);
		node.superinterfaces.length !== 0 && this.a(' extends ', ArrayUtil.fillBetween<any>(node.superinterfaces, ', '));
		this.NodeType(node);
	}

	NodeCall(node: NodeCall): void {
		this.a(node.callee, '(', ArrayUtil.fillBetween<any>(node.arguments, ', '), ')');
		node.suffix && this.a(' ', node.suffix);
	}

	NodeCallArgument(node: NodeCallArgument): void {
		if (node.name !== null) {
			this.a(node.name, ': ');
		}
		this.a(node.value);
	}

	NodeReference(node: NodeReference): void {
		this.a(node.name);
	}

	NodeNumber(node: NodeNumber): void {
		this.a(node.value);
	}

	NodeString(node: NodeString): void {
		this.a(node.stringType, StringUtil.escape(node.value), node.stringType);
	}

	NodeStringTemplate(node: NodeStringTemplate): void {
		this.a('`', node.expressions, '`')
	}

	NodePrefixUnaryOperator(node: NodePrefixUnaryOperator): void {
		this.a(node.op.value, node.exp);
	}

	NodeSuffixUnaryOperator(node: NodeSuffixUnaryOperator): void {
		this.a(node.exp, node.op.value);
	}

	NodeBinaryOperator(node: NodeBinaryOperator): void {
		this.a(node.left, ' ', node.op.value, ' ', node.right);
	}

	NodeIf(node: NodeIf): void {
		this.a('if ', node.condition, ' then ', node.then);
		if (node.else !== null) {
			this.a(' else ', node.else);
		}
	}

	NodeBlock(node: NodeBlock): void {
		this.block(() => node.expressions.forEach(sub => this.nl(sub)));
	}
}