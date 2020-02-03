const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

const chars = 'abcefghijklmnopqrstuvwxyz0123456789';

module.exports.run = async (bot, message, args) => {
	if (args[1] === 'u') {
		if (!playersByUID.has(message.author.id)) return message.channel.send(`This Discord account is currently not connected to a Geometry Dash account.`);
		let oldDbPlayers = playersByUID.get(message.author.id);
		playersByUID.delete(message.author.id);
		playersByPID.delete(oldDbPlayers);
		let map = await tools.arrayMap(playersByPID);
		if (!map || !map.length || map.length < 1) map = [[]];
		await db.set(`players`, map);
		if (passwords.has(message.author.id)) {
			passwords.delete(message.author.id);
			let map = await tools.arrayMap(passwords);
			if (!map || !map.length || map.length < 1) map = [[]];
			await db.set(`passwords`, map);
			message.channel.send(`Successfully unlinked your account from **${(await gdtools.idAndUn(oldDbPlayers))[0]}**, and removed the associated password!`);
		} else {
			message.channel.send(`Successfully unlinked your account from **${(await gdtools.idAndUn(oldDbPlayers))[0]}**!`);
		}
	} else {
		// Check if this account already has something associated with it
		if (playersByUID.has(message.author.id)) return message.channel.send(`This account is already connected with the Geometry Dash account **${(await gdtools.idAndUn(playersByUID.get(message.author.id)))[0]}**`);

		let code = '';
		for (i = 0; i < 8; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		message.author.send(`To connect up your account to ${config.name}, send the following code to the Geometry Dash account **${config.accountName}**.\nThe code must be the message content **and** title. Please allow up to ${config.linkAccInterval} seconds for it to connect you.`).then(
			() => {
				message.author.send(`\`${code}\``);
				linkAccMap.set(code, message.author.id);
				setTimeout(() => {
					if (!linkAccMap.has(code)) return;
					linkAccMap.delete(code);
					try {
						message.author.send(`Linking timed out.`);
					} catch {
						message.channel.send(`Linking accounts with **${message.author}** timed out.`);
					}
				}, 300000);
			},
			err => message.channel.send("Could not send you the code. Please check the server's Privacy Settings and turn on 'Allow Direct Messages from server members.'"),
		);
	}
};

module.exports.config = {
	command: ['link', 'connect'],
	permlvl: 'All',
	help: ['Other', 'Link your account with a Geometry Dash account', 'All', '', 'Link your account with a Geometry Dash account', 'All', 'u', 'Unlink your Geometry Dash account with your Discord one.'],
	helpg: '',
};
