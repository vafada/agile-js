class ScriptBufferEvent {

    constructor(type, resourceNumber, data) {
        this.type = type;
        this.resourceNumber = resourceNumber;
        this.data = data;
    }
}

class ScriptBuffer {

    constructor(state) {
        this.state = state;
        // Default script size is 50 according to original AGI specs.
        this.scriptSize = 50;
        this.events = [];
        this.initScript();
        this.doScript = false;
        this.maxScript = 0;
    }

    /**
     * Add an event to the script buffer
     *
     * @param {*} action
     * @param {*} who
     * @param {*} data
     */
    addScript(action, who, data = null) {
        if (this.state.flags[Defines.NO_SCRIPT]) {
            return;
        }

        if (this.doScript) {
            if (this.events.length >= this.scriptSize) {
                // TODO: Error. Error(11, maxScript);
                return;
            } else {
                this.events.push(new ScriptBufferEvent(action, who, data));
            }
        }

        if (this.events.length > this.maxScript) {
            this.maxScript = this.events.length;
        }
    }

    setScriptSize(scriptSize) {
        this.scriptSize = scriptSize;
        this.events = [];
    }

    initScript() {
        this.events = [];
    }

    scriptOff() {
        this.doScript = false;
    }

    scriptOn() {
        this.doScript = true;
    }
}