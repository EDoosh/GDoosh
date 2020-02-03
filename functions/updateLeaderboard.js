const Discord = require('discord.js');
const db = require('quick.db');
const request = require('request-promise');
const tools = require('./generalFunctions.js');
const gdtools = require('./gdFunctions.js');

/*

Get the playerId database
For every player in there, get their stats
Store their stats in the lb database, along with their playerId

*/

module.exports.run = async () => {
	let fplayers = await db.get(`players`);
	if (!fplayers || !fplayers.length || fplayers.length < 1) fplayers = [[]];
	playersByPID = new Discord.Collection(fplayers);
	let push = new Discord.Collection();
	push.set('time', Date.now());
	for (var x of playersByPID) {
		let y = await gdtools.profile((await gdtools.idAndUn(x[0], true))[2]);
		if (!y) {
			console.log(`Failed updateLeaderboard user due to profile problems - ${x[0]} / ${x[1]}`);
			continue;
		}
		let z = {};
		z.username = y.username;
		z.accountId = y.accountID;
		z.stars = parseInt(y.stars);
		z.coins = parseInt(y.coins);
		z.usercoins = parseInt(y.userCoins);
		z.demons = parseInt(y.demons);
		z.cp = parseInt(y.cp);
		z.userId = x[1];
		await push.set(y.playerID, z);
	}
	db.set(`lb`, await tools.arrayMap(push));
};
