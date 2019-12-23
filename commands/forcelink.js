const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (!args[2]) return message.channel.send(`Missing arguments.`);

	let dId = await tools.getUser(message, args[1], bot);
	if (dId) dId = dId.id;
	else if (/[0-9]{18}/.test(args[1])) dId = args[1];
	else return message.channel.send(`Can not find that user.`);
	let playerId = await gdtools.idAndUn(await tools.getArgs(args, 2));
	if (!playerId) return message.channel.send(`Could not find that player.`);
	playerId = playerId[1];

	// Check if GD player already in DB
	if (playersByPID.has(playerId)) {
		let oldDbPlayers = playersByUID.get(dId);
		playersByUID.delete(oldDbPlayers);
		playersByPID.delete(playerId);
		await db.set(`players`, await tools.arrayMap(playersByPID));
		console.log(`forcelink 23 ${await db.get(`players`)}`);
	}
	// Check if discord already in DB
	if (playersByUID.has(dId)) {
		let oldDbPlayers = playersByPID.get(playerId);
		playersByUID.delete(dId);
		playersByPID.delete(oldDbPlayers);
		await db.set(`players`, await tools.arrayMap(playersByPID));
		console.log(`forcelink 31 ${await db.get(`players`)}`);
	}

	try {
		db.push(`players`, [playerId, dId]);
		playersByPID.set(playerId, dId);
		playersByUID.set(dId, playerId);
	} catch (err) {
		console.log(err);
		message.channel.send(`There was an issue linking this account.`);
	}
	message.channel.send('Ok');
};

module.exports.config = {
	command: ['forcelink', 'fl'],
	permlvl: 'BotOwner',
	help: ['BotOwner', 'Force link a discord account with a user.', 'BotOwner', '[userID] [playerName]', 'Force link a discord account with a user.'],
	helpg: '',
};
