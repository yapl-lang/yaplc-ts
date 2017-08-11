export default interface ErrorHandler {
	error(error: Error): void;
}