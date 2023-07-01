export class PairingPattern {
	private static MICROBIT_NAME_LENGTH = 5;

	/**
	 * Codebook for computing name from pairing pattern. See
	 * https://support.microbit.org/support/solutions/articles/19000067679-how-to-find-the-name-of-your-micro-bit
	 */
	private static CODEBOOK: string[][] = [
		["t", "a", "t", "a", "t"],
		["p", "e", "p", "e", "p"],
		["g", "i", "g", "i", "g"],
		["v", "o", "v", "o", "v"],
		["z", "u", "z", "u", "z"],
	];

	/**
	 * Converts a pairing pattern to a name.
	 * See guide on microbit names to understand how a pattern is turned into a name
	 * https://support.microbit.org/support/solutions/articles/19000067679-how-to-find-the-name-of-your-micro-bit
	 * @param {boolean[][]} pattern The pattern to convert.
	 * @returns {string} The name of the micro:bit.
	 */
	public static patternToName(pattern: boolean[][]): string {
		const code: string[] = [" ", " ", " ", " ", " "];

		const nameLength = PairingPattern.MICROBIT_NAME_LENGTH;

		for (let col = 0; col < nameLength; col++) {
			for (let row = 0; row < nameLength; row++) {
				if (pattern[row]![col]) {
					// Find the first vertical on/true in each column
					code[col] = PairingPattern.CODEBOOK[row]![col]!; // Use code-book to find char
					break; // Rest of column is irrelevant
				}
				// If we get to here the pattern is not legal, and the returned name
				// will not match any microbit.
			}
		}
		return code.join("");
	}

	/**
	 * Converts a name to a pairing pattern.
	 * IMPORTANT: Assumes correct microbit name. Not enough error handling for
	 * 						incorrect names.
	 * @param {string} name The name of the micro:bit
	 * @returns {boolean[][]} The pairing pattern
	 */
	public static nameToPattern(name: string): boolean[][] {
		const nameLength = PairingPattern.MICROBIT_NAME_LENGTH;
		const pattern: boolean[][] = [];

		// if wrong name length, return empty pattern
		if (name.length != nameLength) {
			throw new Error(
				"Couldn't convert name to pattern. Names provided must be of length 5!"
			);
		}

		for (let i = 0; i < nameLength; i++) {
			pattern.push([true, true, true, true, true]);
		}

		for (let column = 0; column < nameLength; column++) {
			for (let row = 0; row < nameLength; row++) {
				if (
					PairingPattern.CODEBOOK[row]![column] ===
					name.charAt(column)
				) {
					break;
				}
				pattern[row]![column] = false;
			}
		}

		return pattern;
	}
}
