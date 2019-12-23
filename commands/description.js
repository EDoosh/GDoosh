const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (!args[1]) return message.channel.send(`> ${(await userDescription.get(message.author.id)) || 'No user description yet provided. Why not make one now?'}`);
	let text = await tools.getArgs(args, 1);
	await userDescription.set(message.author.id, text);
	await db.set(`userDescription`, await tools.arrayMap(userDescription));
	message.channel.send(`New user description set to\n> ${text.replace('\n', '\n> ')}`);
};

module.exports.config = {
	command: ['description', 'describe', 'me'],
	permlvl: 'All',
	help: ['Fun', 'Add a description for yourself for when a user checks your profile.', 'All', '', 'Check your current description', 'All', '[text]', 'Add a description of yourself. MAX 500 chars.'],
	helpg: '',
};
