import {
	NodePackage,
	NodeUse,
	NodeIdentifier,
	NodeTypeName,
	NodeNamedTypeReference,
	NodeLambdaTypeReference,
	NodeArrayTypeReference,
	NodeVal,
	NodeVar,
	NodeFunction,
	NodeFunctionArgument,
	NodeExpression,
	NodeCall,
	NodeCallArgument,
	NodeReference,
	NodeNumber,
	NodeString,
	NodePrefixUnaryOperator,
	NodeSuffixUnaryOperator,
	NodeBinaryOperator,
	NodeIf,
	NodeBlock,
} from '../ast/Nodes';

export default abstract class NodeVisitor {
	abstract visitNodePackage(node: NodePackage): void;
	abstract visitNodeUse(node: NodeUse): void;
	abstract visitNodeTypeName(node: NodeTypeName): void;
	abstract visitNodeIdentifier(node: NodeIdentifier): void;
	abstract visitNodeNamedTypeReference(node: NodeNamedTypeReference): void;
	abstract visitNodeLambdaTypeReference(node: NodeLambdaTypeReference): void;
	abstract visitNodeArrayTypeReference(node: NodeArrayTypeReference): void;
	abstract visitNodeVal(node: NodeVal): void;
	abstract visitNodeVar(node: NodeVar): void;
	abstract visitNodeFunction(node: NodeFunction): void;
	abstract visitNodeFunctionArgument(node: NodeFunctionArgument): void;
	abstract visitNodeCall(node: NodeCall): void;
	abstract visitNodeCallArgument(node: NodeCallArgument): void;
	abstract visitNodeReference(node: NodeReference): void;
	abstract visitNodeNumber(node: NodeNumber): void;
	abstract visitNodeString(node: NodeString): void;
	abstract visitNodePrefixUnaryOperator(node: NodePrefixUnaryOperator): void;
	abstract visitNodeSuffixUnaryOperator(node: NodeSuffixUnaryOperator): void;
	abstract visitNodeBinaryOperator(node: NodeBinaryOperator): void;
	abstract visitNodeIf(node: NodeIf): void;
	abstract visitNodeBlock(node: NodeBlock): void;
}