const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	let msg = await tools.getArgs(args, 1);
	let content = await tools.getArgs(msg.replace('|', '|ᜑ').split('ᜑ'), 1);
	let embed = new Discord.RichEmbed()
		.setTitle(msg.split('|')[0])
		.setDescription(content)
		.setAuthor(message.author.tag, message.author.displayAvatarURL)
		.setFooter(`${NAME}\u2800⬥\u2800Version ${VERSION}`, bot.user.displayAvatarURL)
		.setTimestamp();
	botUpdates.forEach(async (channel, guild) => {
		await bot.guilds
			.get(guild)
			.channels.get(channel)
			.send(embed.setColor(`0x${['f53131', 'f58331', 'f5e131', '89f531', '31f579', '31f5e1', '31aaf5', '4062f7', '6a42ed', 'ad52f7', 'e540f7', 'f531c4', 'f0325b'][Math.floor(Math.random() * 13)]}`));
	});
	message.channel.send(`Finished sending announcements to ${botUpdates.size} servers.`);
};

module.exports.config = {
	command: ['announce'],
	permlvl: 'BotOwner',
	help: ['BotOwner', 'Announce something to all servers.', 'BotOwner', '[title] | [message]', 'Announce something to all servers.'],
	helpg: 'generalCommandSyntax',
};
