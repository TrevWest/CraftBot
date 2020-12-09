/*
say: sends a message as CraftBot

Usage: "say <message>"                 : Sends message in #general
       "say -c <channel> <message>"    : Sends message in specified channel
*/

module.exports = {
    name: 'say',
    execute(args) {
        console.log('Say command works');
    }
}