class Commands {

    constructor(pixels, state, userInput, textGraphics, parser, soundPlayer, menu) {
        this.pixels = pixels;
        this.state = state;
        this.menu = menu;
        this.textGraphics = textGraphics;
        this.userInput = userInput;
        this.soundPlayer = soundPlayer;
        this.parser = parser;
    }

    drawPicture(pictureNum) {
        console.log("drawPicture = ", pictureNum);
        this.state.scriptBuffer.addScript("DrawPic", pictureNum);
        this.state.restoreBackgrounds();

        // By encoding and then decoding, we create a copy of the Picture.
        const picture = this.state.pictures[pictureNum];
        console.log("draw picture", picture);

        // Now clear the draw the whole Picture from the beginning on clear Bitmaps.
        //picture.Screen.Clear();
        //this.pixels.clear();
        //picture.Screen.DrawCommands(picture.CommandStack);


        for (var i = 0; i < 160 * 168; i++) {
            this.state.visualPixels[i] = 0x0F;
        }

        this.state.currentPicture = picture;

        this.updatePixelArrays();

        this.state.drawObjects();

        this.state.pictureVisible = false;
    }

    showPicture(closeWindow = true) {
        if (closeWindow) {
            // It is possible to leave the window up from the previous room, so we force a close.
            this.state.flags[Defines.LEAVE_WIN] = false;
            this.textGraphics.closeWindow(false);
        }

        // Perform the copy to the pixels array of the VisualPixels
        this.showVisualPixels();

        // Remember that the picture is now being displayed to the user.
        this.state.pictureVisible = true;
    }

    showVisualPixels() {
        const data = this.pixels;
        for (let k = 0; k < 160 * 168; k++) {
            //this.interpreter.framePriorityData.data[k] = this.interpreter.priorityBuffer.data[k];
            let rgb = AGI_PALETTE[this.state.visualPixels[k]];
            data[k * 8] = (rgb >>> 16) & 0xFF;
            data[k * 8 + 1] = (rgb >>> 8) & 0xFF;
            data[k * 8 + 2] = rgb & 0xFF;
            data[k * 8 + 3] = 255;
            data[k * 8 + 4] = (rgb >>> 16) & 0xFF;
            data[k * 8 + 5] = (rgb >>> 8) & 0xFF;
            data[k * 8 + 6] = rgb & 0xFF;
            data[k * 8 + 7] = 255;
        }
    }

    updatePixelArrays() {
        const picture = this.state.currentPicture;

        const visualBitmap = picture.visible;
        const priorityBitmap = picture.priority;

        //console.log("visualBitmap", visualBitmap);


        for (let i = 0; i < (160 * 168); i++) {
            this.state.visualPixels[i] = visualBitmap[i];
            //const rgbColor = AGI_PALETTE[visualBitmap[i]];
            //this.state.visualPixels[ii] = rgbColor;
            //this.state.visualPixels[ii + 1] = rgbColor;
        }

        //console.log("pixels", this.pixels)


        //console.log("visualBitmap = ", visualBitmap);
        //this.pixels = visualBitmap;



        // Copy visual pixels to a 160x168 byte array.
        //const visualBitmapData = visualBitmap.LockBits(new Rectangle(0, 0, visualBitmap.Width, visualBitmap.Height), ImageLockMode.ReadWrite, visualBitmap.PixelFormat);
        //byte[] visualPixels = new byte[visualBitmapData.Stride * visualBitmapData.Height];
        //Marshal.Copy(visualBitmapData.Scan0, visualPixels, 0, visualPixels.Length);
        //visualBitmap.UnlockBits(visualBitmapData);

        // Copy the pixels to our VisualPixels array, doubling each one as we go.
        //const data = this.pixels;
        /*for (let i = 0, ii = 0; i < (160 * 168); i++, ii += 2)
        {
            const rgbColor = AGI_PALETTE[visualBitmap[i]];
            this.state.visualPixels[ii] = rgbColor;
            this.state.visualPixels[ii + 1] = rgbColor;
        }*/

        //SplitPriorityPixels();
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
        //console.log("action", action);

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
            // increment
            case 1: {
                const varNum = action.operands[0].asByte();
                if (this.state.vars[varNum] < 255) {
                    this.state.vars[varNum]++;
                }
            }
                break;
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
                this.state.vars[action.operands[1].asByte()] = aniObj.x;
                this.state.vars[action.operands[2].asByte()] = aniObj.y;
            }
                break;
            // lindirectn
            case 11: {
                const varNum = action.operands[0].asByte();
                const value = action.operands[1].asByte();
                this.state.vars[this.state.vars[varNum]] = value;
            }
                break;
            // set
            case 12:
                this.state.flags[action.operands[0].asByte()] = true;
                break;
            // reset
            case 13:
                this.state.flags[action.operands[0].asByte()] = false;
                break;
            // reset.v
            case 16:
                this.state.flags[this.state.vars[action.operands[0].asByte()]] = false;
                break;
            // new.room
            case 18:
                console.log("new room = " + action.operands[0].asByte());
                return {
                    exit: true,
                    actionNum: 0,
                    newRoom: action.operands[0].asByte(),
                }
            // load.logics
            case 20: {
                // All logics are already loaded in this interpreter, so nothing to do as such
                // other than to remember it was "loaded".
                const logic = this.state.logics[action.operands[0].asByte()];
                console.log("load.logics = " + action.operands[0].asByte());
                if ((logic != null) && !logic.isLoaded) {
                    logic.isLoaded = true;
                    this.state.scriptBuffer.addScript("LoadLogic", logic.index);
                }
            }
                break;
            // call
            case 22: {
                let tempNewRoom = this.executeLogic(action.operands[0].asByte());
                console.log("tempNewRoom", tempNewRoom);
                console.log("this.state.currentRoom", this.state.currentRoom);
                if (tempNewRoom !== this.state.currentRoom) {
                    return {
                        newRoom: tempNewRoom ?? this.state.currentRoom,
                        exit: true,
                        nextActionNum: 0,
                    }
                }
            }
                break;
            // call.v
            case 23:
                console.log("call.v " + this.state.vars[action.operands[0].asByte()]);
                let tempNewRoom = this.executeLogic(this.state.vars[action.operands[0].asByte()]);
                console.log("tempNewRoom", tempNewRoom);
                console.log("this.state.currentRoom", this.state.currentRoom);
                if (tempNewRoom !== this.state.currentRoom) {
                    return {
                        newRoom: tempNewRoom ?? this.state.currentRoom,
                        exit: true,
                        nextActionNum: 0,
                    }
                }
                break;
            // load.pic
            case 24:
                // All pictures are already loaded in this interpreter, so nothing to do as such
                // other than to remember it was "loaded".
                const pic = this.state.pictures[this.state.vars[action.operands[0].asByte()]];
                if ((pic != null) && !pic.isLoaded) {
                    pic.isLoaded = true;
                    this.state.scriptBuffer.addScript("LoadPic", pic.index);
                }
                break;
            // draw.pic
            case 25:
                this.drawPicture(this.state.vars[action.operands[0].asByte()]);
                break;
            // show.pic
            case 26:
                this.showPicture();
                break;
            // load.view
            case 30: {
                // All views are already loaded in this interpreter, so nothing to do as such
                // other than to remember it was "loaded".
                let view = this.state.views[action.operands[0].asByte()];
                if ((view != null) && !view.isLoaded) {
                    view.isLoaded = true;
                    this.state.scriptBuffer.addScript("LoadView", view.index);
                }
            }
                break;
            // load.view.v
            case 31: {
                // All views are already loaded in this interpreter, so nothing to do as such
                // other than to remember it was "loaded".
                let view = this.state.views[this.state.vars[action.operands[0].asByte()]];
                if ((view != null) && !view.isLoaded) {
                    view.isLoaded = true;
                    this.state.isLoaded.addScript("LoadView", view.index);
                }
            }
                break;
            // animate.obj
            case 33: {
                let aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                aniObj.animate();
            }
                break;
            // load.sound
            case 98:
                // All sounds are already loaded in this interpreter, so nothing to do as such
                // other than to remember it was "loaded".
                let sound = this.state.sounds[action.operands[0].asByte()];
                if ((sound != null) && !sound.isLoaded) {
                    sound.isLoaded = true;
                    this.state.scriptBuffer.addScript("LoadSound", sound.index);
                }
                break;
            // set.view.v
            case 42: {
                const aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                aniObj.setView(this.state.vars[action.operands[1].asByte()]);
            }
                break;
            // observe.objs
            case 68: {
                const aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                aniObj.ignoreObjects = false;
            }
                break;
            // stop.cycling
            case 70: {
                const aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                aniObj.cycle = false;
            }
                break;
            // ignore.blocks
            case 88: {
                const aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                aniObj.ignoreBlocks = true;
            }
                break;
            // observe.blocks
            case 89: {
                const aniObj = this.state.animatedObjects[action.operands[0].asByte()];
                aniObj.ignoreBlocks = false;
            }
                break;
            // sound
            case 99: {
                const soundNum = action.operands[0].asByte();
                const endFlag = action.operands[1].asByte();
                this.state.flags[endFlag] = false;
                const sound = this.state.sounds[soundNum];
                if ((sound != null) && (sound.isLoaded)) {
                    this.soundPlayer.playSound(sound, endFlag);
                }
            }
                break;
            // display
            case 103: {
                const row = action.operands[0].asByte();
                const col = action.operands[1].asByte();
                const message = action.logic.messages[action.operands[2].asByte()];
                this.textGraphics.display(message, row, col);
            }
                break;
            // set.cursor.char
            case 108: {
                const cursorStr = action.logic.messages[action.operands[0].asByte()];
                this.state.cursorCharacter = (cursorStr.length > 0 ? cursorStr[0] : '');
            }
                break;
            // configure.screen
            case 111:
                this.state.pictureRow = action.operands[0].asByte();
                this.state.inputLineRow = action.operands[1].asByte();
                this.state.statusLineRow = action.operands[2].asByte();
                break;
            // set.string
            case 114:
                this.state.strings[action.operands[0].asByte()] = action.logic.messages[action.operands[1].asByte()];
                break;
            // prevent.input
            case 119:
                this.state.acceptInput = false;
                this.textGraphics.updateInputLine();
                break;
            // set.key
            case 121: {
                const keyCode = (action.operands[0].asByte() + (action.operands[1].asByte() << 8));
                if (this.userInput.keyCodeMap.has(keyCode)) {
                    const controllerNum = action.operands[2].asByte();
                    const interKeyCode = this.userInput.keyCodeMap.get(keyCode);
                    if (this.state.keyToControllerMap.has(interKeyCode)) {
                        this.state.keyToControllerMap.delete(interKeyCode);
                    }
                    this.state.keyToControllerMap.set(this.userInput.keyCodeMap.get(keyCode), controllerNum);
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
            // Unconditional branch: else, goto.
            case 0xfe:
                nextActionNum = action.getDestinationActionIndex();
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
                result = (this.state.vars[condition.operands[0].asByte()] === condition.operands[1].asByte());
                break;
            // equalv
            case 2:
                result = (this.state.vars[condition.operands[0].asByte()] === this.state.vars[condition.operands[1].asByte()]);
                break;
            // lessn
            case 3:
                result = (this.state.vars[condition.operands[0].asByte()] < condition.operands[1].asByte());
                break;
            // greatern
            case 5:
                result = (this.state.vars[condition.operands[0].asByte()] > condition.operands[1].asByte());
                break;
            // isset
            case 7:
                result = this.state.flags[condition.operands[0].asByte()];
                break;
            // controller
            case 12:
                result = this.state.controllers[condition.operands[0].asByte()];
                break;
            // have.key
            case 13: {
                let key = this.state.vars[Defines.LAST_CHAR];
                if (key === 0) {
                    key = this.userInput.getKey();
                }
                if (key > 0) {
                    this.state.vars[Defines.LAST_CHAR] = key;
                }
                result = key !== 0;
            }
                break;
            // said
            case 14:
                result = this.parser.said(condition.operands[0].asInts());
                break;
            // OR
            case 0xfc:
                result = false;
                for (let orCondition of condition.operands[0].asConditions()) {
                    if (this.isConditionTrue(orCondition)) {
                        result = true;
                        break;
                    }
                }
                break;
            // NOT
            case 0xfd:
                result = !this.isConditionTrue(condition.operands[0].asCondition());
                break;
            default:
                console.log("!!!! not implemented condition = " + condition.operation.opcode);
                break;
        }
        //console.log("isConditionTrue result = ", result);
        return result;
    }
}