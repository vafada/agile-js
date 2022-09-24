class Commands {

    constructor(pixels, state, userInput, textGraphics, parser, soundPlayer, menu) {
        this.pxels = pixels;
        this.state = state;
    }

    /**
     * Executes the Logic identified by the given logic number.
     * 
     * @param {*} logicNum The number of the Logic to execute.
     * 
     * @returns If new.room was invoked, the new room number; otherwise the current room number.
     */
    executeLogic(logicNum) {
        // Remember the previous Logic number.
        const previousLogNum = this.state.currentLogNum;

        // Store the new Logic number in the state so that actions will know this.
        this.state.currentLogNum = logicNum;

        // Prepare to start executing the Logic.
        const logic = this.state.logics[logicNum];
        let actionNum = this.state.scanStart[logicNum];
        const newRoom = this.state.currentRoom;
        let exit = false;

        console.log("logic = ", logic);
        // Continually execute the Actions in the Logic until one of them tells us to exit.
        //do actionNum = ExecuteAction(logic.Actions[actionNum], ref newRoom, ref exit); while (!exit);
        do {
            let returnValue = this.executeAction(logic.actions[actionNum], newRoom, exit);
            exit = returnValue.exit;

            console.log("exit", exit);
        } while (!exit)

        // Restore the previous Logic number before we leave.
        this.state.currentLogNum = previousLogNum;

        // If new.room was not one of the Actions executed, then newRoom will still have the current
        // room value; otherwise it will have the number of the new room.
        return newRoom;
    }

    executeAction(action, newRoom, exit) {
        console.log("executeAction", {
            action, newRoom, exit
        });
        return {
            exit: true,
            actionNum: 0,
        }
    }
}