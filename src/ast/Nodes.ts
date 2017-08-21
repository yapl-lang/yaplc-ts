import {default as Node, BaseNode} from './Node';
import {Operator} from '../Operators';

export class NodePackage extends BaseNode<NodePackage> {
	type = 'package';

	package: string | null;
	body: Node[];
}

export class NodeUse extends BaseNode<NodeUse> {
	type = 'use';

	name: string;
	alias: string;
}

export class NodeUseAll extends BaseNode<NodeUseAll> {
	type = 'use';
	package: string;
}

export class NodeTypeName extends BaseNode<NodeTypeName> {
	type = 'typename';

	name: string;
}

export class NodeIdentifier extends BaseNode<NodeIdentifier> {
	type = 'id';
	name: string;
}

export abstract class NodeTypeReference<Self extends Node = Node> extends BaseNode<Self> {
}

export class NodeNamedTypeReference extends NodeTypeReference<NodeNamedTypeReference> {
	type = 'named-typeref';
	name: NodeTypeName;
}

export class NodeLambdaTypeReference extends NodeTypeReference<NodeLambdaTypeReference> {
	type = 'lambda-typeref';
	func: NodeFunction;
}

export class NodeArrayTypeReference extends NodeTypeReference<NodeArrayTypeReference> {
	type = 'array-typeref';
	target: NodeTypeReference;
	dimensions: (NodeExpression | null)[];
}

export abstract class NodeExpression<Self extends Node = Node> extends BaseNode<Self> {
}

export class NodeDefinitionModifier extends BaseNode<NodeDefinitionModifier> {
	type = 'def-mod';

	value: string;
}

export abstract class NodeDefinition<Self extends Node = Node> extends NodeExpression<Self> {
	modifiers: NodeDefinitionModifier[];
	name: NodeTypeName | null;
}

export abstract class BaseNodeVal<Self extends Node = Node> extends NodeDefinition<Self> {
	valType: NodeTypeReference | null;
	initializer: NodeExpression | null;
}

export class NodeVal extends BaseNodeVal<NodeVal> {
	type = 'val';
}

export class NodeVar extends BaseNodeVal<NodeVar> {
	type = 'var';
}

export class NodeFunction extends NodeDefinition<NodeFunction> {
	type = 'fun';

	arguments: NodeFunctionArgument[];
	returns: NodeTypeReference[];
	body: NodeExpression | null;
}

export class NodeFunctionArgument extends BaseNode<NodeFunctionArgument> {
	type = 'funarg';

	name: NodeIdentifier | null;
	targetType: NodeTypeReference | null;
}

export class NodeClass extends NodeDefinition<NodeClass> {
	type = 'class';
	children: NodeDefinition[];
}


export class NodeCall extends NodeExpression<NodeCall> {
	type = 'call';
	callee: NodeExpression;
	arguments: NodeCallArgument[];
	suffix: NodeExpression;
}

export class NodeCallArgument extends BaseNode<NodeCallArgument> {
	type = 'callarg';

	name: NodeIdentifier | null;
	value: NodeExpression;
}

export class NodeReference extends NodeExpression<NodeReference> {
	type = 'ref';
	name: NodeIdentifier | null;
}

export class NodeNumber extends NodeExpression<NodeNumber> {
	type = 'num';
	value: string;
}

export class NodeString extends NodeExpression<NodeString> {
	type = 'str';

	stringType: string;
	value: string;
}

export class NodeStringTemplate extends NodeExpression<NodeStringTemplate> {
	type = 'str-tmpl';
	expressions: NodeExpression[];
}


export abstract class NodeOperator<Self extends Node = Node> extends NodeExpression<Self> {
	op: Operator;
}

export class NodePrefixUnaryOperator extends NodeOperator<NodePrefixUnaryOperator> {
	type = 'prefop';

	exp: NodeExpression;
}

export class NodeSuffixUnaryOperator extends NodeOperator<NodeSuffixUnaryOperator> {
	type = 'suffop';

	exp: NodeExpression;
}

export class NodeBinaryOperator extends NodeOperator<NodeBinaryOperator> {
	type = 'binop';

	left: NodeExpression;
	right: NodeExpression;
}

export class NodeIf extends NodeExpression<NodeIf> {
	type = 'if';

	condition: NodeExpression;
	then: NodeExpression;
	else: NodeExpression | null;
}

export class NodeBlock extends NodeExpression<NodeBlock> {
	type = 'block';
	expressions: NodeExpression[];
}
