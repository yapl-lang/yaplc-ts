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
	type = 'arg';

	name: NodeIdentifier;
	targetType: NodeTypeReference | null;
}

export class NodeExpression extends BaseNode<NodeExpression> {
	type = 'exp';

	// TODO:
}
