export default class Array {
	static fillBetween<T>(array: T[], filler: T): T[] {
		const result: T[] = [];
		array.forEach(element => {
			if (result.length !== 0) {
				result.push(filler);
			}
			result.push(element);
		});
		return result;
	}
}