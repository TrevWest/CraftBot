/*
!server: Returns server information

Usage: "!server"
*/

const { help } = require('../cmd_help.json');

module.exports = {
    name: 'server',
    help: help.server,
    guildOnly: true,
    args: false,
    execute(message, args) {
        var data = [];

        data.push('```');
        data.push(`Server: ${message.guild.name}`);
        data.push(`Craftboi Count: ${message.guild.memberCount - 1}`);
        data.push(`Established: ${message.guild.createdAt}`);
        data.push(`Region: ${message.guild.region}`);
        data.push('```');

        message.channel.send(data);
    }
}