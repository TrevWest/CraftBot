/*    
 ________  ________  ________  ________ _________  ________  ________  _________   
|\   ____\|\   __  \|\   __  \|\  _____\\___   ___\\   __  \|\   __  \|\___   ___\ 
\ \  \___|\ \  \|\  \ \  \|\  \ \  \__/\|___ \  \_\ \  \_\  \ \  \|\  \|___ \  \_| 
 \ \  \    \ \   _  _\ \   __  \ \   __\    \ \  \ \ \   __  \ \  \ \  \   \ \  \  
  \ \  \____\ \  \\  \\ \  \ \  \ \  \_|     \ \  \ \ \  \_\  \ \  \_\  \   \ \  \ 
   \ \_______\ \__\\ _\\ \__\ \__\ \__\       \ \__\ \ \_______\ \_______\   \ \__\
    \|_______|\|__|\|__|\|__|\|__|\|__|        \|__|  \|_______|\|_______|    \|__|


             Created by Trevor Westergard for OG Craftbois Discord Server
*/

/* TODO MAIN:
!steam -l: split large lists into chunks to bypass discord character limit
Fix updateActiveUsers() (don't just add/remove on join, it won't work if you start the bot with people already in voice)
Get rid of client.channels (won't update correctly if channel added) and fix say.js accordingly
Implement README.md
Audio files played through voice chat on command/action
Media files posted on command/action
*/

/* TODO SIDE:
Better logging of info on guild members & command message authors
Work out optimal data structures (what really needs to be in client object? What doesn't?)
Implement more complex command handler (DIY, or use discord.js-commando)
Better admin-only functionality (admin list, partial command restrictions)
Expand arguments (parse out flags and pass to command)
Make cooldowns into a class (stores cooldowns and has handler)
*/

/*
Command property list ('+' indicates an optional property):

name <string>          : command name
help <Object>          : contains help information
+guildOnly <bool>      : determines if command is guild-only
+adminOnly <bool>      : determines if command is admin-only
+args <bool>           : determines if command requires arguments
+cooldown <int>        : command cooldown time (per user) in seconds
*/

const fs = require('fs');
const Discord = require('discord.js');

const { prefix, commandDir, consoleCmdDir, token, adminID, voiceChannel } = require('./config.json');
const cooldowns = require('./tools/cooldown.js'); // Cooldown handler tool
const steamTools = require('./tools/steam_tools'); // Steam-related tools
const tools = require('./tools/tools'); // Misc tools

// Create client object with specified gateway intents
const { Client } = require('discord.js');
const client = new Client({ ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_PRESENCES', 'GUILD_MESSAGES'] } });

client.commands = new Discord.Collection(); // Command list

// Create array of all .js files located in ./commands
const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));

// Map command files to command names in client.commands
for (const file of commandFiles) {
    const command = require(`${commandDir}/${file}`);
    client.commands.set(command.name, command);
}

client.steamUsers = new Discord.Collection(); // Quick-access user list w/ steam ID
steamTools.read(client); // Populate client.steamUsers with steam ID information

client.activeUsers = new Discord.Collection(); // List of users in voice chat
client.masterList = new Discord.Collection(); // List of steam games with associated owners
client.sharedList = new Discord.Collection(); // List of shared steam games for current client.activeUsers
client.cooldowns = new Discord.Collection(); // Cooldown lists

var attemptLogin; // Holds <timeout> for auto-login attempts

// Once connection established with Discord servers:
client.once('ready', async () => {
    // Set status invisible
    await client.user.setStatus('invisible').then()
        .catch(console.error);
    
    // Add to client:
    client.server = client.guilds.cache.first(); // Server quick-access
    client.craftChannels = new Discord.Collection(); // Channel quick-access

    // Populate client.craftChannels using channel names as keys
    client.server.channels.cache.each(channel => {
        client.craftChannels.set(channel.name, channel);
    });

    // Build master list
    await steamTools.updateMaster(client);

    // Set active users
    tools.updateActiveUsers(client);

    // Updated active user shared game list
    steamTools.updateSharedActive(client);

    // Log bot info
    await client.user.fetch()
        .then(console.log)
        .catch(console.error);

    // Set status online
    await client.user.setStatus('online')
        .catch(console.error);
    
    console.log('\nClient ready\n');
});

// Log errors on error events
client.on('error', (error) => {
    console.error(error);
});

// If client is disconnected, begin auto-attempting login
client.on('invalidated', () => {
    console.log('Client session invalidated. Retrying login every 15 seconds.');
    attemptLogin = setInterval(() => { client.login(token); }, 1500);
});

// On successful client reconnection
client.on('ready', () => {
    if (!attemptLogin) return;
    
    // Stop auto-login attempts
    clearInterval(attemptLogin);
    attemptLogin = null;

    console.log('Login successful. Client ready.');
});

/*
Update active user list on voice channel join/leave

This is done rather than using members' online statuses
due to our use case: members who will be participating
will _always_ be in voice channel
*/
client.on('voiceStateUpdate', (oldState, newState) => {
    // Only trigger on joining/leaving voice channel
    if (oldState.channel === newState.channel) return;

    // Update client.activeUsers
    tools.updateActiveUsers(client);

    // Update client.sharedList
    steamTools.updateSharedActive(client);
});

/*
Discord command handler

For commands sent through Discord servers
*/
client.on('message', message => {
    // Which one of you fellers is the REAL Dirty Dan
    if (message.content.toLowerCase().match(/i(s|m|'m|.*am).*dirt(y|iest).*dan( |$)/) && !message.author.bot) {
        message.channel.send('No, I\'m Dirty Dan');
    }

    // Ignore normal messages, and those sent by bots
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Store command and arguments from message.content
    let args = message.content.slice(prefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();

    // Invalid command
    if (!client.commands.has(commandName)) {
        console.log(`Invalid command: ${commandName}`);
        return message.reply('your command is bad and you should feel bad.');
    }

    // Load command
    const command = client.commands.get(commandName);

    // Guild-only
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('Command cannot be executed within DMs!');
    }

    // Admin-only
    if (command.adminOnly && message.member.roles.cache.first().id != adminID) {
        return message.reply('this command is admin-only');
    }

    // Command requires arguments but no arguments given
    if (command.args && !args.length) {
        var reply = `The ${prefix}${commandName} command requires arguments.`;

        if (command.usage) {
            reply += `\nUsage: ${prefix}${command.name} ${command.usage}`;
        }

        return message.channel.send(`\`\`\`\n${reply}\n\`\`\``);
    }

    /*
    Cooldown handler

    Returns TRUE if cooldown is active for message author
    Returns FALSE if cooldown is inactive for message author
    */
    if (cooldowns.handler(command, message)) return;

    // Execute command
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.channel.send('Bot machine broke. No refunds.');
    }
});

// Create console command collection in client
client.consoleCommands = new Discord.Collection();

// Store commands in client.consoleCommands collection
const consoleCmdFiles = fs.readdirSync(consoleCmdDir).filter(file => file.endsWith('.js'));
for (const file of consoleCmdFiles) {
    const command = require(`${consoleCmdDir}/${file}`);
    client.consoleCommands.set(command.name, command);
}

/*
Console command handler

Allows for back-end interaction with CraftBot
*/
const readline = require('readline');
const consoleIO = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

consoleIO.on('line', (input) => {
    // Store command and args
    let args = input.trim().split(/ +/);
    let commandName = args.shift();

    // Verify valid command
    if (!client.consoleCommands.has(commandName)) {
        return console.log(`Invalid command: ${commandName}`);
    }

    // Load command
    const command = client.consoleCommands.get(commandName);

    // Execute
    try {
        command.execute(client, args);
    } catch (error) {
        console.error(error);
    }
});

/*
Dynamic real-time command reloading

When a command file is updated, it is automatically removed from 
require.cache and reloaded into CraftBot, while craftbot is still 
running. This allows for quick, real-time changes to CraftBot, 
without the need to restart it or type in any commands.
*/
var fsWait = false;
fs.watch(commandDir, (event, filename) => {
    // If no filename returned, or file rename, do nothing
    // (If commands are being renamed CraftBot _probably_ shouldn't be running anyway)
    if (filename && event === 'change') {
        /*
        Debounce function. Prevents command from being
        reloaded multiple times per file change.
        */
        if (fsWait) return;
        fsWait = setTimeout(() => {
            fsWait = false;
        }, 100);

        console.log(`File change detected in ${commandDir}: ${filename}`);

        // Remove file from require cache
        delete require.cache[require.resolve(`${commandDir}/${filename}`)];

        // Reload command into client.commands
        try {
            const command = require(`${commandDir}/${filename}`);
            client.commands.set(command.name, command);
            console.log(`Successfully reloaded ${filename}`);
        } catch (error) {
            console.error(`Could not reload ${filename}`);
            console.error(error);
        }
    }
});

client.login(token); // Login


/*
        .--'''''''''--.
     .'      .---.      '.
    /    .-----------.    \
   /        .-----.        \
   |       .-.   .-.       |
   |      /   \ /   \      |
    \    | .-. | .-. |    /
     '-._| | | | | | |_.-'
         | '-' | '-' |
          \___/ \___/
       _.-'  /   \  `-._
     .' _.--|     |--._ '.
     ' _...-|     |-..._ '
            |     |
            '.___.'
              | |
             _| |_
            /\( )/\
           /  ` '  \
          | |     | |
          '-'     '-'
          | |     | |
          | |     | |
          | |-----| |
       .`/  |     | |/`.
       |    |     |    |
       '._.'| .-. |'._.'
             \ | /
             | | |
             | | |
             | | |
            /| | |\
          .'_| | |_`.
          `. | | | .'
       .    /  |  \    .
      /o`.-'  / \  `-.`o\
     /o  o\ .'   `. /o  o\
     `.___.'       `.___.'
*/