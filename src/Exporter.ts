import {NodeDefinition, NodeFunction, NodePackage} from "./ast/Nodes";
import CodeStripper from './CodeStripper';

export default class Exporter {
	stripper = new CodeStripper();

	getExports(node: NodePackage): NodeDefinition[] {
		return (<NodeDefinition[]>node.body
			.filter(def => def instanceof NodeDefinition))
			.filter(def => def.modifiers.some(mod => mod.value === 'export'))
			.map(def => {
				return def;
			})
			.map(def => this.stripper.strip(def));
	}
}