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
        startKey: "A",
        targetKey: "Enter",
        blockedKeys: [],
        enemies: [],
        message: "REACH ↵"
    },
    {
        id: 2,
        startKey: "C",
        targetKey: "Enter",
        blockedKeys: ["T", "Y", "G", "H", "B", "N"],
        enemies: [],
        message: "REACH ↵"
    },
    {
        id: 3,
        startKey: "G",
        targetKey: "Enter",
        blockedKeys: ["T", "Y", "H", "B", "N"],
        enemies: [
            { id: "e1", startKey: "Q", type: "chaser" },
            { id: "e2", startKey: "P", type: "chaser" },
        ],
        message: "AVOID 👾; REACH ↵"
    },
    {
        id: 4,
        startKey: "2",
        targetKey: "Enter",
        blockedKeys: [],
        enemies: [
            { id: "e1", startKey: "E", type: "chaser" }
        ],
    },
    {
        id: 5,
        startKey: "Z",
        targetKey: "Enter",
        blockedKeys: [],
        enemies: [
            { id: "e1", startKey: "S", type: "chaser" }
        ],
    },
    {
        id: 6,
        layout: "split",
        startKey: "Q",
        targetKey: "P",
        blockedKeys: [],
        enemies: [
            { id: "e1", startKey: "E", type: "chaser" }
        ],
        message: "USE SPACE TO SLIDE",
        regions: [
            ["`", "1", "2", "3", "4", "5",
                "Tab", "Q", "W", "E", "R", "T",
                "CapsLock", "A", "S", "D", "F", "G",
                "ShiftLeft", "Z", "X", "C", "V", "B"],
            ["6", "7", "8", "9", "0", "-", "=", "Backspace",
                "Y", "U", "I", "O", "P", "[", "]", "\\",
                "H", "J", "K", "L", ";", "'", "Enter",
                "N", "M", ",", ".", "/", "ShiftRight"]
        ]
    }
];
