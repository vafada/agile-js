const REST_OF_LINE = 9999;
const ANYWORD = 1;

class Parser {

    constructor(state) {
        this.state = state;
        this.recognisedWordNumbers = [];
    }

    said(wordNumbers) {
        // If there are no recognised words then we obviously didn't say what we're testing against.
        if (this.recognisedWordNumbers.length === 0) {
            return false;
        }

        // We should only perform the check if we have input, and there hasn't been a match already.
        if (!this.state.flags[Defines.INPUT] || this.state.flags[Defines.HADMATCH]) {
            return false;
        }

        // Compare each word number in order.
        for (let i = 0; i < wordNumbers.length; i++) {
            const testWordNumber = wordNumbers[i];

            // If test word number matches the rest of the line, then it's a match.
            if (testWordNumber === REST_OF_LINE) {
                this.state.flags[Defines.HADMATCH] = true;
                return true;
            }

            // Exit if we have reached the end of the user entered words. No match.
            if (i >= this.recognisedWordNumbers.length) {
                return false;
            }

            const inputWordNumber = this.recognisedWordNumbers[i];

            // If word numbers don't match, and test word number doesn't represent anyword, then no match.
            if ((testWordNumber !== inputWordNumber) && (testWordNumber !== ANYWORD)) {
                return false;
            }
        }

        // If more words were entered than in the said, and there obviously wasn't a REST_OF_LINE, then no match.
        if (this.state.recognisedWords.length > wordNumbers.length) {
            return false;
        }

        // Otherwise if we get this far without having exited already, it is a match.
        this.state.flags[Defines.HADMATCH] = true;
        return true;
    }
}