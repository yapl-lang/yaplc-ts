import {default as NodeVisitor, NodeCompactVisitor} from './NodeVisitor';
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

class NodeFullVisitorHelper extends NodeCompactVisitor {
	constructor(protected holder: NodeFullVisitor) {
		super();
	}

	rootVisit(node: Node) {
		super.visit(node);
	}

	visit(node: Node | null) {
		if (node !== null) {
			this.holder.visit(node);
		}
	}

	NodePackage(node: NodePackage): void {
		node.body.forEach(sub => this.visit(sub));
	}

	NodeLambdaTypeReference(node: NodeLambdaTypeReference): void {
		this.visit(node.func);
	}

	NodeArrayTypeReference(node: NodeArrayTypeReference): void {
		node.dimensions.forEach(sub => this.visit(sub));
		this.visit(node.target);
	}

	NodeGenericTypeReference(node: NodeGenericTypeReference): void {
		node.parameters.forEach(sub => this.visit(sub));
		this.visit(node.target);
	}

	NodeGenericParameter(node: NodeGenericParameter): void {
		this.visit(node.target);
		this.visit(node.default);
	}

	NodeVal(node: NodeVal): void {
		node.modifiers.forEach(sub => this.visit(sub));
		this.visit(node.name);
		this.visit(node.valType);
		this.visit(node.initializer);
	}

	NodeVar(node: NodeVar): void {
		node.modifiers.forEach(sub => this.visit(sub));
		this.visit(node.name);
		this.visit(node.valType);
		this.visit(node.initializer);
	}

	NodeFunction(node: NodeFunction): void {
		node.modifiers.forEach(sub => this.visit(sub));
		this.visit(node.name);
		node.arguments.forEach(sub => this.visit(sub));
		node.returns.forEach(sub => this.visit(sub));
		this.visit(node.body);
	}

	NodeFunctionArgument(node: NodeFunctionArgument): void {
		this.visit(node.name);
		this.visit(node.targetType);
	}

	NodeClass(node: NodeClass): void {
		node.modifiers.forEach(sub => this.visit(sub));
		this.visit(node.name);
		this.visit(node.primaryConstructor);
		this.visit(node.superclass);
		node.superinterfaces.forEach(sub => this.visit(sub));
		node.children.forEach(sub => this.visit(sub));
	}

	NodeInterface(node: NodeInterface): void {
		node.modifiers.forEach(sub => this.visit(sub));
		this.visit(node.name);
		node.superinterfaces.forEach(sub => this.visit(sub));
		node.children.forEach(sub => this.visit(sub));
	}

	NodeCall(node: NodeCall): void {
		this.visit(node.callee);
		node.arguments.forEach(sub => this.visit(sub));
		this.visit(node.suffix);
	}

	NodeCallArgument(node: NodeCallArgument): void {
		this.visit(node.name);
		this.visit(node.value);
	}

	NodeReference(node: NodeReference): void {
		this.visit(node.name);
	}

	NodeStringTemplate(node: NodeStringTemplate): void {
		node.expressions.forEach(sub => this.visit(sub));
	}

	NodePrefixUnaryOperator(node: NodePrefixUnaryOperator): void {
		this.visit(node.exp);
	}

	NodeSuffixUnaryOperator(node: NodeSuffixUnaryOperator): void {
		this.visit(node.exp);
	}

	NodeBinaryOperator(node: NodeBinaryOperator): void {
		this.visit(node.left);
		this.visit(node.right);
	}

	NodeIf(node: NodeIf): void {
		this.visit(node.condition);
		this.visit(node.then);
		this.visit(node.else);
	}

	NodeBlock(node: NodeBlock): void {
		node.expressions.forEach(sub => this.visit(sub));
	}
}

export default abstract class NodeFullVisitor extends NodeVisitor {
	protected helper = new NodeFullVisitorHelper(this);

	visit(node: Node) {
		this.helper.rootVisit(node);
	}
}