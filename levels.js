const KEYBOARD_LAYOUT = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
    ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["ShiftLeft", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "ShiftRight"],
//     ["Space"]
];

const KEY_LABELS = {
    "ShiftLeft": "Shift",
    "ShiftRight": "Shift",
    "CapsLock": "Caps",
    "Backspace": "⌫",
    "Enter": "↵",
    "Tab": "↹",
    "Space": " "
};

const LEVELS = [
    {
        id: 1,
        startKey: "G",
        targetKey: "Enter",
        blockedKeys: ["T", "Y", "H", "B", "N"],
        enemies: [
            { id: "e1", startKey: "Q", type: "chaser" },
            { id: "e2", startKey: "P", type: "chaser" }
        ],
        message: "AVOID 👾; REACH ↵"
    }
];
