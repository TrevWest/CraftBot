/**
 * Tools for handling steam-related functions.
 */

const { ENETUNREACH } = require('constants');
const Discord = require('discord.js');
const fs = require('fs');
const http = require('http');

const {steamKey} = require('../config.json');

module.exports = {
    /**
     * Updates client.steamUsers from steam.json
     * @param {Discord.Client} client
     */
    read: client => {
        // Remove steam.json from require.cache
        delete require.cache[require.resolve('../steam.json')];
        steam = require('../steam.json');

        // Map steam.IDs to discord collection
        var idCollection = new Discord.Collection();
        for (const item of steam.IDs) {
            idCollection.set(item[0], item[1]);
        }

        // Update client.steamUsers
        client.steamUsers = idCollection;
    },

    /**
     * Writes data back to steam.json.
     * @param {Discord.Client} client 
     */
    write: client => {
        // Convert idCollection back to array
        _IDs = client.steamUsers.map((val, key) => {
            return [key, val];
        });

        // JSON to be stored
        steamJSON = {
            IDs: _IDs,
            gamesInCommon: steam.gamesInCommon
        };

        // Write JSON to steam.json
        fs.writeFile('./steam.json', JSON.stringify(steamJSON, null, 4), (err) => {
            if (err) throw err;
            console.log('steam.json updated');
        });
    },

    /**
     * Builds shared games list of active users.
     * <info>Active user shared games list is stored in client.sharedList</info>
     * @param {Discord.Client} client 
     */
    updateSharedActive: client => {
        /*
        If no active users, set client.sharedList to blank collection
        */
        if (!client.activeUsers.size) {
            return client.sharedList = new Discord.Collection();
        }
        /*
        For each item in master list, add to shared list only if owners array
        contains all users present in client.activeUsers
        */
        client.sharedList = client.masterList.filter(owners => {
            var isShared = true;
            client.activeUsers.each((ID, user) => {
                if (!owners.includes(user)) {
                    isShared = false;
                }
            });
            return isShared;
        });
    },

    /**
     * Builds and returns shared games list of chosen users.
     * @param {Discord.Client} client 
     * @param {Array} mentions 
     * @returns {Discord.Collection}
     */
    getChosenShared: (client, mentions) => {
        var chosen;

        // If no mentions, use all CraftBois
        if (!mentions.length) {
            chosen = client.steamUsers;
        }
        else chosen = client.steamUsers.filter((ID, username) => {
            return mentions.includes(username);
        });

        // Return list of shared games
        return client.masterList.filter(owners => {
            var isShared = true;
            chosen.each((ID, user) => {
                if (!owners.includes(user)) {
                    isShared = false;
                }
            });
            return isShared;
        });
    },

    /**
     * Updates master games list (client.masterList).
     * <info>Master list is a Discord Collection using game titles as keys
     * and arrays of game owner usernames as values. The master list is
     * drawn from to dynamically create the shared game list for currently
     * active users (i.e. users in voice chat).</info>
     * @param {Discord.Client} client 
     */
    updateMaster: client => {
        var gamesLists = new Discord.Collection(); // Contains all members' games lists
        var requestsComplete = 0; // Tracks number of HTTP requests completed
        const numMembers = client.steamUsers.size;
        const { masterList } = client;

        return new Promise(resolve => {
            /**
             * Builds client.masterList.
             */
            function buildMasterList() {
                gamesLists.each((list, username) => {
                    for (const game of list) {
                        if (masterList.has(game)) { // Game in master list
                            // Add username to master list game entry
                            masterList.get(game).push(username);
                        } else {
                            // Add game entry to master list
                            masterList.set(game, [username]);
                        }
                    }
                });
                console.log('Master list updated.');
                resolve();
            }

            /*
            For each server member, make http GET request for list and
            add to gamesLists: [username, [list]].
            */
            client.steamUsers.each((ID, username) => {
                // Set http request options.
                var options = {
                    host: 'api.steampowered.com',
                    path: `/IPlayerService/GetOwnedGames/v0001/?key=${steamKey}&steamid=${ID}&include_appinfo=true&format=json`,
                    method: 'GET'
                };

                // HTTP Callback
                function callback(res) {
                    var responseString = '';

                    res.on('data', chunk => {
                        responseString += chunk;
                    });

                    res.on('end', () => {
                        try {
                            resJSON = JSON.parse(responseString);
                        } catch (error) {
                            console.error('JSON failed to parse!');
                            console.error(error);
                            console.error('Bailing out. Try again maybe?');
                            return;
                        }

                        var games = [];
                        for (const game of resJSON.response.games) {
                            games.push(game.name);
                        }

                        gamesLists.set(username, games);

                        // If final request, call buildMasterList()
                        ++requestsComplete;
                        if (requestsComplete == numMembers) {
                            buildMasterList();
                        }
                    });
                }

                // HTTP Request
                try {
                    http.get(options, callback);
                } catch (error) {
                    console.log(error);
                }
            });
        });
    }
}