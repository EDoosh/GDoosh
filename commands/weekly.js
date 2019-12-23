const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	let msg = await message.channel.send(`Retrieving weekly level...`);
	let weekly = await gdtools.getLevel('weekly');
	if (!weekly || weekly === '-1') return msg.edit(`There is currently no weekly level.`);
	weekly.type = 'weekly';
	msg.edit(`${config.emojis.weekly} Here is the weekly level!`, await gdtools.createEmbed(bot, weekly, true));
};

module.exports.config = {
	command: ['weekly', 'w'],
	permlvl: 'All',
	help: ['Fun', 'Retrieves the weekly level.', 'All', '', 'Retrieves the weekly level.'],
	helpg: '',
};
