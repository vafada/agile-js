class ScriptBuffer {

    constructor() {
        this.scriptSize = 0;
        this.events = [];
    }

    /**
     * Add an event to the script buffer
     * 
     * @param {*} action 
     * @param {*} who 
     * @param {*} data 
     */
    addScript(action, who, data = null) {

    }

    setScriptSize(scriptSize) {
        this.scriptSize = scriptSize;
        this.events = [];
    }
}