const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (!message.guild) return message.channel.send(`This command may only be used in servers, due to Discord limitations.`);
	if (isNaN(args[args.length - 1 || 0])) var pg = 1;
	else {
		var pg = parseInt(args[args.length - 1]);
		args.splice(args.length - 1, 1);
	}
	let msg = await message.channel.send(`Finding user...`);
	if (!args[1]) args[1] = message.author.id;
	let player = await gdtools.idAndUn(await gdtools.getPlayerID(message, await tools.getArgs(args, 1), bot));
	if (!player) return msg.edit(`Cannot find this user!`);
	chooseLevel(player, pg, msg);

	async function chooseLevel(player, loop, msg) {
		let lvlsF = await gdtools.searchLevel(player[1], { user: true, page: Math.ceil(loop / 2) - 1 });
		await msg.clearReactions();
		let lvls = [];
		for (i = 0; i < 5; i++) lvls.push(lvlsF[i + (loop % 2 == 1 ? 0 : 5)]);
		if (lvlsF == '-1' && loop === 1) {
			msg.delete();
			message.channel.send(`This user has no levels.`);
			return;
		}
		if (lvlsF == '-1' || lvls[0] == undefined) {
			msg.delete();
			message.channel.send(`There was an issue getting this page.`);
			return;
		}
		msg.edit((await gdtools.createListEmbed(lvls)).setTitle(`${config.emojis.search} Level Search⠀⠀⠀⠀⠀⠀Page ${loop}⠀${config.emojis.page}`));
		const filter = (reaction, user) => {
			return ['◀️', '📄', '▶️'].includes(reaction.emoji.name) && user.id === message.author.id;
		};
		var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
		rc.on('collect', async resp => {
			const reaction = resp.emoji.name;
			if (reaction === '◀️') {
				chooseLevel(player, loop - 1, msg);
				return;
			} else if (reaction === '▶️') {
				chooseLevel(player, loop + 1, msg);
				return;
			} else if (reaction === '📄') {
				let pgS = await message.channel.send(`Which page would you like to be shown?`);
				const filterPg = fmsg => {
					return fmsg.author.id === message.author.id && /[0-9]/.test(fmsg.content);
				};
				try {
					var pg = await message.channel.awaitMessages(filterPg, { maxMatches: 1, time: 10000, errors: ['time'] });
				} catch {
					message.channel.send(`Page selection times out`);
					msg.clearReactions();
					return;
				}
				chooseLevel(player, parseInt(pg.first().content), msg);
				pg.first().delete();
				pgS.delete();
				return;
			}
		});
		rc.on('end', collected => {
			if (collected.size != 0) return;
			// Delete the message and say so
			message.channel.send(`Display timed out.`);
			msg.clearReactions();
		});
		if (loop > 1) await msg.react('◀️');
		await msg.react('📄');
		if (lvls[4] !== undefined) await msg.react('▶️');
	}
};

module.exports.config = {
	command: ['levelsby', 'by', 'lvlsby', 'lvlby'],
	permlvl: 'All',
	help: ['Fun', 'Displays all levels by a specified author.', 'All', '(gdRepresentable) (page)', 'Displays all levels by a specified author.'],
	helpg: '',
};
