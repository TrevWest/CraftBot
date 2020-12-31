/*
!squid: Prints squidward

Usage: "!squid"

TODO: "!squid your text here" results in squidward "speaking" the text
*/

const { help } = require('../cmd_help.json');

module.exports = {
    name: 'squid',
    help: help.squid,
    guildOnly: false,
    args: false,
    cooldown: 10,
    execute(message, args) {
        message.channel.send('```\n           .--\'\'\'\'\'\'\'\'\'--.\n        .\'      .---.      \'.\n       /    .-----------.    \\\n      /        .-----.        \\\n      |       .-.   .-.       |\n      |      /   \\ /   \\      |\n       \\    | .-. | .-. |    /\n        \'-._| | | | | | |_.-\'\n            | \'-\' | \'-\' |\n             \\___/ \\___/\n          _.-\'  /   \\  `-._\n        .\' _.--|     |--._ \'.\n        \' _...-|     |-..._ \'\n               |     |\n               \'.___.\'\n                 | |\n                _| |_\n               /\\( )/\\\n              /  ` \'  \\\n             | |     | |\n             \'-\'     \'-\'\n             | |     | |\n             | |     | |\n             | |-----| |\n          .`/  |     | |/`.\n          |    |     |    |\n          \'._.\'| .-. |\'._.\'\n                \\ | /\n                | | |\n                | | |\n                | | |\n               /| | |\\\n             .\'_| | |_`.\n             `. | | | .\'\n          .    /  |  \\    .\n         /o`.-\'  / \\  `-.`o\\\n        /o  o\\ .\'   `. /o  o\\\n        `.___.\'       `.___.\'\n```');
    }
}