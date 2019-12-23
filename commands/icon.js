const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	var a = ['cube', 'icon', 'ship', 'ball', 'ufo', 'bird', 'wave', 'dart', 'robot', 'spider', 'cursed'].includes(args[1]) ? 2 : 1;
	let msg = await message.channel.send(`Finding user...`);
	if (!args[a]) args[a] = message.author.id;
	let player = await gdtools.idAndUn(await gdtools.getPlayerID(message, await tools.getArgs(args, a), bot), true);
	if (!player) return msg.edit(`Cannot find this user!`);
	await msg.edit(`Looking at their profile information...`);
	let profile = await gdtools.profile(player[2]);
	await msg.edit(`Generating images...`);
	profile.cube = profile.icon;
	if (a === 2) var img = await gdtools.createIcon(profile, args[1]);
	else var img = await gdtools.createIcons(profile);
	msg.delete();
	message.channel.send(
		new Discord.RichEmbed()
			.setTitle(`${profile.username}'s Icon${a === 1 ? `s` : ''}`)
			.setImage(`attachment://${profile.username}-Icon${a === 1 ? `-Set` : ''}.png`)
			.attachFile(img),
	);
};

module.exports.config = {
	command: ['icon', 'icons', 'i'],
	permlvl: 'All',
	help: ['Fun', 'Generates a players icons.', 'All', '(iconType) (gdRepresentable)', "Generates a player's icons. iconType can be icon, cube, ship, ball, ufo, bird, wave, dart, robot, spider, or cursed."],
	helpg: '',
};
