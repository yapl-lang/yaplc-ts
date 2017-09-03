import {NodeDefinition, NodePackage} from "./ast/Nodes";

export default class Exporter {
	getExports(node: NodePackage): NodeDefinition[] {
		return node.body.filter(def => def.modifiers.some(mod => mod.value === 'export'));
	}
}