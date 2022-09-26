const UNASSIGNED = -1;

class TextGraphics {
    constructor(pixels, state, userInput) {
        this.pixels = pixels;
        this.state = state;
        this.userInput = userInput;
        this.openWindow = null;
    }

    updateInputLine(clearWhenNotEnabled = true) {
        if (this.state.graphicsMode) {
            if (this.state.acceptInput) {
                // Input line has the prompt string at the start, then the user input.
                let inputLine = '';
                if (this.state.strings[0] != null) {
                    inputLine = inputLine + this.expandReferences(this.state.strings[0]);
                }
                inputLine = inputLine + this.state.currentInput;
                if (this.state.cursorCharacter > 0) {
                    // Cursor character is optional. There isn't one at the start of the game.
                    inputLine = inputLine + this.state.cursorCharacter;
                }

                //TODO this.drawString(this.pixels, inputLine.padEnd(Defines.MAXINPUT, ' '), 0, this.state.inputLineRow * 8);
            } else if (clearWhenNotEnabled) {
                // If not accepting input, clear the prompt and text input.
                //TODO ClearLines(state.InputLineRow, state.InputLineRow, 0);
            }
        }
    }

    updateStatusLine() {

    }

    isWindowOpen() {
        // TODO: Implement.
        return false;
    }

    drawWindow() {
        // TODO: Implement.
    }

    expandReferences(str) {
        // TODO
        return str;
    }

    drawString(text, x, y, foregroundColour = UNASSIGNED, backgroundColour = UNASSIGNED, halfTone = false) {
        // This method is used as both a general text drawing method, for things like the menu
        // and inventory, and also for the print and display commands. The print and display
        // commands will operate using the currently set text attribute, foreground and background
        // values. The more general use cases would pass in the exact colours that they want to
        // use, no questions asked.

        // Foreground colour.
        /*if (foregroundColour === UNASSIGNED) {
            if (this.state.graphicsMode) {
                // In graphics mode, if background is not black, foreground is black; otherwise as is.
                foregroundColour = (this.state.backgroundColour === 0 ? this.state.foregroundColour : 0);
            } else {
                // In text mode, we use the text attribute foreground colour as is.
                foregroundColour = (this.state.textAttribute & 0x0F);
            }
        }

        // Background colour.
        if (backgroundColour === UNASSIGNED) {
            if (this.state.graphicsMode) {
                // In graphics mode, background can only be black or white.
                backgroundColour = (this.state.backgroundColour == 0 ? 0 : 15);
            } else {
                // In text mode, we use the text attribute background colour as is.
                backgroundColour = ((this.state.textAttribute >> 4) & 0x0F);
            }
        }*/

        //const textBytes = Encoding.ASCII.GetBytes(text);
        console.log("TextGraphic drawString", text);
        let row = x;
        let col = y;
        for (let charPos = 0; charPos < text.length; charPos++) {
            const chr = text[charPos].charCodeAt(0);

            if (chr === 10) {
                row++;
                col = 0;
                continue;
            }
            const fontStream = this.state.game.fonts;
            fontStream.position = chr * 8;

            for (let yy = 0; yy < 8; yy++) {
                var colData = fontStream.readUint8();
                for (var xx = 0; xx < 8; xx++) {
                    var color = 0x00;
                    if ((colData & 0x80) === 0x80)
                        color = 0xFF;
                    var idx = (row * 8 + yy) * 320 + (col * 8 + xx);
                    this.pixels[idx * 4 + 0] = color;
                    this.pixels[idx * 4 + 1] = color;
                    this.pixels[idx * 4 + 2] = color;
                    this.pixels[idx * 4 + 3] = 0xFF;
                    colData = colData << 1;
                }
            }

            col++;
            if (col >= 40) {
                col = 0;
                row++;
            }
        }
    }


    buildMessageLines(str, width, startColumn) {
        const lines = [];

        this.maxLength = 0;

        if (str != null) {
            // Recursively expand/substitute references to other strings.
            const processedMessage = this.expandReferences(str);

            // Now that we have the processed message text, split it in to lines.
            let currentLine = "";

            // Pad the first line with however many spaces required to begin at starting column.
            if (startColumn > 0) {
                currentLine = currentLine + " ".padEnd(startColumn);
            }

            for (let i = 0; i < processedMessage.length; i++) {
                let addLines = i === (processedMessage.length - 1) ? 1 : 0;

                if (processedMessage[i] === 0x0A) {
                    addLines++;
                } else {
                    // Add the character to the current line.
                    currentLine += processedMessage[i];

                    // If the current line has reached the width, then word wrap.
                    if (currentLine.length >= width) {
                        i = this.wrapWord(currentLine, i);
                        addLines = 1;
                    }
                }

                while (addLines-- > 0) {
                    if ((startColumn > 0) && (lines.length === 0)) {
                        // Remove the extra padding that we added at the start of first line.
                        currentLine = currentLine.substring(startColumn);
                        startColumn = 0;
                    }

                    lines.push(currentLine);

                    if (currentLine.length > this.maxLength) {
                        this.maxLength = currentLine.length;
                    }

                    currentLine = '';
                }
            }
        }

        return lines;
    }

    display(str, row, col) {
        console.log("TextGraphic display = ", str, row, col);
        // Expand references and split on new lines.
        const lines = this.buildMessageLines(str, Defines.TEXTCOLS + 1, col);

        console.log("lines", lines);

        for (let i = 0; i < lines.length; i++) {
            this.drawString(lines[i], col * 8, (row + i) * 8);
            // For subsequent lines, we start at column 0 and ignore what was passed in.
            col = 0;
        }
    }

    closeWindow(restoreBackPixels = true) {
        if (this.openWindow != null) {
            if (restoreBackPixels) {
                const startScreenPos = (openWindow.Y * 320) + openWindow.X;
                const screenYAdd = (320 - openWindow.Width);

                // Copy each of the stored background pixels back in to their original places.
                for (let y = 0, screenPos = startScreenPos; y < openWindow.Height; y++, screenPos += screenYAdd) {
                    for (let x = 0; x < openWindow.Width; x++, screenPos++) {
                        this.pixels[screenPos] = openWindow.BackPixels[x, y];
                    }
                }
            }

            // Clear the currently open window variable.
            this.openWindow = null;
        }
    }

    wrapWord(str, i) {
        // TODO
        return i;
    }
}