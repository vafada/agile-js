class MenuItem {
    constructor() {
        this.enabled = false;
        this.name = null;
        this.controller = 0;
        this.row = 0;
        this.col = 0;
    }
}

class MenuHeader {
    constructor() {
        this.items = [];
        this.title = null;
        this.currentItem = null;
        this.height = 0;
    }
}

class Menu {

    constructor(state, textGraphics, pixels, userInput) {
        this.state = state;
        this.textGraphics = textGraphics;
        this.headers = [];
        this.pixels = pixels;
        this.userInput = userInput;

        this.menuSubmitted = false;
        this.currentHeader = null;
        this.menuCol = 0;
    }

    setMenu(menuName) {
        // We can't accept any more menu definitions if submit.menu has already been executed.
        if (this.menuSubmitted) return;

        if (this.currentHeader == null) {
            // The first menu header starts at column 1.
            this.menuCol = 1;
        } else if (this.currentHeader.items.length === 0) {
            // If the last header didn't have any items, then disable it.
            this.currentHeader.title.enabled = false;
        }

        // Create a new MenuHeader.
        const header = new MenuHeader();

        // Set the position of this menu name in the menu strip (leave two
        // chars between menu titles).
        header.title = new MenuItem();
        header.title.row = 0;
        header.title.name = menuName;
        header.title.col = this.menuCol;
        header.title.enabled = true;
        header.iems = [];
        header.height = 0;

        this.currentHeader = header;
        this.headers.push(header);

        // Adjust the menu column for the next header.
        this.menuCol += menuName.length + 1;

        // Initialize stuff for the menu items to follow.
        this.currentItem = null;
        this.itemRow = 1;
    }

    /**
     * Creates a new menu item in the current menu, of the given name and mapped
     * to the given controller number.
     */
    setMenuItem(itemName, controller) {
        // We can't accept any more menu definitions if submit.menu has already been executed.
        if (this.menuSubmitted) return;

        // Create and define the new menu item and its position.
        const menuItem = new MenuItem();
        menuItem.name = itemName;
        menuItem.controller = controller;
        if (this.itemRow === 1) {
            if (this.currentHeader.title.col + itemName.length < 39) {
                this.itemCol = this.currentHeader.title.Col;
            } else {
                this.itemCol = 39 - itemName.length;
            }
        }
        menuItem.row = ++this.itemRow;
        menuItem.col = this.itemCol;
        menuItem.enabled = true;

        // Add the menu item to the current header's item list.
        this.currentItem = menuItem;
        this.currentHeader.items.push(menuItem);
        this.currentHeader.height++;
        if (this.currentHeader.currentItem == null) {
            this.currentHeader.currentItem = menuItem;
        }
    }

    /**
     * Signals to the menu system that the menu has now been fully defined. No further SetMenu
     * or SetMenuItem calls will be processed. The current header and item is reset back to the
     * first item in the first menu, ready for usage when the menu is activated.
     */
    submitMenu() {
        // If the last menu didn't have any items, disable it.
        if (this.currentHeader.items.length === 0)
        {
            this.currentHeader.title.enabled = false;
        }

        // Make the first menu the current one.
        this.currentHeader = (this.headers.length > 0? this.headers[0] : null);
        this.currentItem = ((this.currentHeader != null) && (this.currentHeader.items.length > 0) ? this.currentHeader.items[0] : null);

        // Remember that the submit has happened. We can't process menu definitions after submit.menu
        this.menuSubmitted = true;
    }
}