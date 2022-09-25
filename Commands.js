class Commands {

    constructor(pixels, state, userInput, textGraphics, parser, soundPlayer, menu) {
        this.pxels = pixels;
        this.state = state;
        this.menu = menu;
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
        let newRoom = this.state.currentRoom;
        let exit = false;

        //let iterate = 0;

        // Continually execute the Actions in the Logic until one of them tells us to exit.
        do {
            let returnValue = this.executeAction(logic.actions[actionNum], newRoom, exit);
            exit = returnValue.exit;
            newRoom = returnValue.newRoom;
            actionNum = returnValue.actionNum;

            /*iterate++;
            if (iterate == 100) {
                exit = true;
            }*/
        } while (!exit)

        // Restore the previous Logic number before we leave.
        this.state.currentLogNum = previousLogNum;

        // If new.room was not one of the Actions executed, then newRoom will still have the current
        // room value; otherwise it will have the number of the new room.
        return newRoom;
    }

    executeAction(action, newRoom, exit) {
        console.log("action", action);

        // Normally the next Action will be the next one in the Actions list, but this
        // can be overwritten by the If and Goto actions.
        let nextActionNum = action.logic.addressToActionIndex.get(action.address) + 1;

        console.log("OPCODE: " + action.operation.opcode + ", NAME:" + action.operation.name)

        switch (action.operation.opcode) {
            // return
            case 0:
                return {
                    exit: true,
                    nextActionNum: 0,
                }
            // decrement
            case 2: {
                const varNum = action.operands[0].asByte();
                if (this.state.vars[varNum] > 0) {
                    this.state.vars[varNum]--;
                }
            }
                break;
            // assignn
            case 3: {
                const varNum = action.operands[0].asByte();
                const value = action.operands[1].asByte();
                this.state.vars[varNum] = value;
            }
                break;
            // assignv
            case 4: {
                const varNum1 = action.operands[0].asByte();
                const varNum2 = action.operands[1].asByte();
                this.state.vars[varNum1] = this.state.vars[varNum2];
            }
                break;
            // get.posn
            case 39: {
                const aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                this.state.vars[action.operands[1].asByte()] = aniObj.X;
                this.state.vars[action.operands[2].asByte()] = aniObj.Y;
            }
                break;
            // reset
            case 13:
                this.state.flags[action.operands[0].asByte()] = false;
                break;
            // new.room
            case 18:
                return {
                    exit: true,
                    actionNum: 0,
                    newRoom: action.operands[0].asByte(),
                }
            // call.v
            case 23:
                let tempNewRoom = this.executeLogic(this.state.vars[action.operands[0].asByte()]);
                console.log("tempNewRoom", tempNewRoom);
                console.log("this.state.currentRoom", this.state.currentRoom);
                if (tempNewRoom !== this.state.currentRoom) {
                    return {
                        newRoom: tempNewRoom,
                        exit: true,
                        nextActionNum: 0,
                    }
                }
                break;
            // script.size
            case 142:
                this.state.scriptBuffer.setScriptSize(action.operands[0].asByte());
                break;
            // set.game.id (was max.drawn in AGI v2.001)
            case 143:
                this.state.gameId = action.logic.messages[action.operands[0].asByte()];
                break;
            // set.menu
            case 156:
                this.menu.setMenu(action.logic.messages[action.operands[0].asByte()]);
                break;
            // set.menu.item
            case 157:
                let menuItemName = action.logic.messages[action.operands[0].asByte()];
                let controllerNum = action.operands[1].asByte();
                this.menu.setMenuItem(menuItemName, controllerNum);
                break;
            // submit.menu
            case 158:
                this.menu.submitMenu();
                break;
            // Conditional branch: if.
            case 0xff:
                for (let condition of action.operands[0].asConditions()) {
                    if (!this.isConditionTrue(condition)) {
                        nextActionNum = action.getDestinationActionIndex();
                        break;
                    }
                }
                break;

            default:
                console.log("!!!! not implemented opcode= " + action.operation.opcode);
                break;
        }

        return {
            exit,
            actionNum: nextActionNum,
            newRoom,
        }
    }

    isConditionTrue(condition) {
        let result = false;

        switch (condition.operation.opcode) {
            // equaln
            case 1:
                result = (this.state.vars[condition.operands[0].asByte()] == condition.operands[1].asByte());
                break;
            // greatern
            case 5:
                result = (this.state.vars[condition.operands[0].asByte()] > condition.operands[1].asByte());
                break;
            // isset
            case 7:
                result = this.state.flags[condition.operands[0].asByte()];
                break;
            // NOT
            case 0xfd:
                result = !this.isConditionTrue(condition.operands[0].asCondition());
                break;
            default:
                console.log("!!!! not implemented condition = " + condition.operation.opcode);
                break;
        }
        return result;
    }
}