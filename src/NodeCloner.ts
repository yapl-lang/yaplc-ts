import Node from './ast/Node';
import NodeFullVisitor from "./visitor/NodeFullVisitor";

export default class NodeCloner extends NodeFullVisitor {
	clone<T extends Node>(node: T): T {
		return node;
	}
}