const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	let msg = await message.channel.send(`Finding user...`);
	if (!args[1]) args[1] = message.author.id;
	let player = await gdtools.idAndUn(await gdtools.getPlayerID(message, await tools.getArgs(args, 1)));
	if (!player) return msg.edit(`Cannot find this user!`);
	await msg.edit(`Looking for their In-Game CP count...`);
	let cpOld = await gdtools.profile(player[1]);
	await msg.edit(`Looking for their accurate CP count...`);
	let cpNew = await gdtools.requestCP(player[1]);
	if (cpNew === undefined) return msg.edit(`${player[0]} has too many levels to check for accurate CP! Their in game is \`${cpOld.cp}CP\``);
	if (cpOld.cp != cpNew) msg.edit(`${player[0]} has currently got \`${cpNew}CP\`. In game, it is displayed as \`${cpOld.cp}CP\``);
	else msg.edit(`${player[0]} has currently got \`${cpNew}CP\``);
};

module.exports.config = {
	command: ['cp', 'getcp', 'correctcp'],
	permlvl: 'All',
	help: ['Fun', 'Gets the in-game and correct CP count of a user', 'All', '[gdRepresentable]', 'Gets the in-game and correct CP count of a user', 'All', '', 'Gets your own in-game and correct CP count, provided you are linked with the bot.'],
	helpg: '',
};
