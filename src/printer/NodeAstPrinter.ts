import Node from '../ast/Node';
import {Operator} from '../Operators';
import NodePrettyPrinter from './NodePrettyPrinter';

export default class NodeAstPrinter extends NodePrettyPrinter {
	visit(node: Node) {
		this.a('[', node.begin);
		if (!node.begin.equals(node.end)) {
			this.a('-', node.end);
		}
		this.nl('] ', node.type);
		this.ind(() => {
			Object.keys(node).filter(key => !['whitespaces', 'begin', 'end', 'type'].includes(key)).forEach(key => {
				const value = (<any>node)[key];
				this.a(key, ' => ');
				this.printValue(value);
			});
		});
	}

	printValue(value: any) {
		if (value instanceof Array) {
			this.nl().ind(() => value.forEach(e => {
				this.printValue(e);
			}));
		} else if (value instanceof Node) {
			this.a(value);
		} else if (value instanceof Operator) {
			this.nl(value.name, ' (', value.value, ')');
		} else {
			this.nl(value);
		}
	}
}