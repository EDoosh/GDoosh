const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (args[0] === 'inv') return message.channel.send(new Discord.RichEmbed().setDescription(`[__**Invite Link**__ *(Administrator)*](https://discordapp.com/oauth2/authorize?client_id=${config.clientId}&scope=bot&permissions=8)\n[__**Invite Link**__ *(Customize)*](https://discordapp.com/oauth2/authorize?client_id=${config.clientId}&scope=bot&permissions=1509158142)`));
	message.channel.send(
		new Discord.RichEmbed()
			.setAuthor(`EDoosh#9599`, `https://cdn.discordapp.com/avatars/267723762563022849/abdd4c93aa93f43faee284a6202f4919.png`)
			.setTitle(`${config.name} - ${bot.user.tag}`)
			.setDescription(`[__**Invite Link**__ *(Administrator)*](https://discordapp.com/oauth2/authorize?client_id=${config.clientId}&scope=bot&permissions=8)\n[__**Invite Link**__ *(Customize)*](https://discordapp.com/oauth2/authorize?client_id=${config.clientId}&scope=bot&permissions=1509158142)`)
			.setThumbnail(bot.user.displayAvatarURL)
			.addField(`Developed by **EDoosh#9599**`, `Hosted by **${(await bot.users.get(config.ownerId[0])).tag}** *(${config.ownerId[0]})*`)
			.addField(`Assistance`, `The profile picture for GDoosh was made by **Bluee!**\nA lot of the code for getting things from the GD servers ~~was stolen~~ is from Colon's GD Level Browser. [Main](https://gdbrowser.com/) - [GitHub](https://github.com/GDColon/GDBrowser) - [API](https://gdbrowser.com/api/)`)
			.setColor(`0x${['f53131', 'f58331', 'f5e131', '89f531', '31f579', '31f5e1', '31aaf5', '4062f7', '6a42ed', 'ad52f7', 'e540f7', 'f531c4', 'f0325b'][Math.floor(Math.random() * 13)]}`)
			.setFooter(`${NAME}\u2800⬥\u2800Version ${VERSION}`),
	);
};

module.exports.config = {
	command: ['info', 'invite', 'inv'],
	permlvl: 'All',
	help: ['Bot', 'Displays information about the Discord Bot.', 'All', '', 'Displays information about the Discord Bot.'],
	helpg: '',
};
