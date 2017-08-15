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

export class NodeTypeName extends BaseNode<NodeTypeName> {
	type = 'typename';

	name: string;
}

export class NodeIdentifier extends BaseNode<NodeIdentifier> {
	type = 'id';

	name: string;
}

export class NodeTypeReference extends BaseNode<NodeTypeReference> {
	type = 'typeref';

	name: NodeTypeName;
}


export abstract class BaseNodeVal<T> extends BaseNode<T> {
	name: NodeIdentifier;
	valType: NodeTypeReference | null;
	initializer: NodeExpression | null;
}

export class NodeVal extends BaseNodeVal<NodeVal> {
	type = 'val';
}

export class NodeVar extends BaseNodeVal<NodeVar> {
	type = 'var';
}


export abstract class NodeExpression<Self extends Node = Node> extends BaseNode<Self> {
}

export class NodeFunction extends NodeExpression<NodeFunction> {
	type = 'fun';

	name: NodeIdentifier | null;
	arguments: NodeFunctionArgument[];
	returns: NodeTypeReference[];
	body: NodeExpression[];
}

export class NodeFunctionArgument extends BaseNode<NodeFunctionArgument> {
	type = 'funarg';

	name: NodeIdentifier;
	targetType: NodeTypeReference | null;
}

export class NodeCall extends NodeExpression<NodeCall> {
	type = 'call';
	callee: NodeExpression;
	arguments: NodeCallArgument[];
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

	value: string;
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
