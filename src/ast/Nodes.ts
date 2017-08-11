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

export class NodeTypeReference extends BaseNode<NodeTypeReference> {
	type = 'typeref';

	name: string;
}


export abstract class BaseNodeVal<T> extends BaseNode<T> {
	name: string;
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

	arguments: NodeFunctionArgument[];
	body: NodeExpression[];
}

export class NodeFunctionArgument extends BaseNode<NodeFunctionArgument> {
	type = 'arg';

	name: string;
	targetType: NodeTypeReference | null;
}

export class NodeExpression extends BaseNode<NodeExpression> {
	type = 'exp';

	// TODO:
}
