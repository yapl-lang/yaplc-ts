import {default as Node, BaseNode} from './Node';

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


export class NodeFunction extends BaseNode<NodeFunction> {
	type = 'fun';

	name: NodeIdentifier;
	arguments: NodeFunctionArgument[];
	returns: NodeTypeReference[];
	body: NodeExpression[];
}

export class NodeFunctionArgument extends BaseNode<NodeFunctionArgument> {
	type = 'funarg';

	name: NodeIdentifier;
	targetType: NodeTypeReference | null;
}

export abstract class NodeExpression<Self extends Node = Node> extends BaseNode<Self> {
}

export class NodeNull extends NodeExpression<NodeNull> {
	type = 'null';
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
