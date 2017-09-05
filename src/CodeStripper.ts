import Node from './ast/Node';
import {NodeFunction} from './ast/Nodes';
import {compactVisit, NodeCompactVisitorInterface} from './visitor/NodeVisitor';
import NodeFullVisitor from './visitor/NodeFullVisitor';
import * as clone from 'clone';

export default class CodeStripper extends NodeFullVisitor implements NodeCompactVisitorInterface {
	visit(node: Node): void {
		compactVisit(node, this);
		super.visit(node);
	}

	NodeFunction(node: NodeFunction) {
		node.body = null;
	}

	strip<T extends Node>(node: T): T {
		node = clone(node);
		this.visit(node);
		return node;
	}
}