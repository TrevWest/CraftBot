/*
Console command to update steam game master list
*/

const steamTools = require('../tools/steam_tools');

module.exports = {
    name: 'mupdate',
    execute(client, args) {
        steamTools.updateMaster(client);
    }
}