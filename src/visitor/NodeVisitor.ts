import Node from '../ast/Node';

export default abstract class NodeVisitor {
	abstract visit(node: Node): void;
}

export interface NodeCompactVisitorInterface extends NodeVisitor {
}

export abstract class NodeCompactVisitor extends NodeVisitor implements NodeCompactVisitorInterface {
	visit(node: Node): void {
		compactVisit(node, this);
	}
}

export function compactVisit(node: Node, visitor: NodeCompactVisitorInterface) {
	const methodContainer = <any>visitor;
	const methodName = node.constructor.name;
	if (methodName in methodContainer) {
		const method = <(node: Node) => void>methodContainer[methodName];
		method.call(methodContainer, node);
	}
}
