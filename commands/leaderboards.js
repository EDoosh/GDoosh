const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');
const ms = require('ms');

module.exports.run = async (bot, message, args) => {
	if (!message.guild) return message.channel.send(`This command may only be used in servers.`);
	const a = args[1] === 'g' || args[1] === 'global' ? 2 : 1;
	const b = 10;
	const e = config.emojis;
	if (!args[a] || ['s', 'stars', 'top', 'star', 'player', 'p'].includes(args[a])) args[a] = 'stars';
	else if (['c', 'coin', 'coins'].includes(args[a])) args[a] = 'coins';
	else if (['uc', 'usercoin', 'usercoins'].includes(args[a])) args[a] = 'usercoins';
	else if (['d', 'demon', 'demons'].includes(args[a])) args[a] = 'demons';
	else if (['cp', 'creator', 'creators', 'creatorpoints'].includes(args[a])) args[a] = 'cp';
	else return message.channel.send(`Valid leaderboard types are \`stars\`, \`coins\`, \`usercoins\`, \`demons\`, or \`cp\``);

	let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Retrieving leaderboards...`));
	try {
		var lbfetch = await db.fetch(`lb`);
	} catch {
		return await msg.edit(new Discord.RichEmbed().setFooter(`There are currently no users in the database.`));
	}
	if (lbfetch.size === 1) return await msg.edit(new Discord.RichEmbed().setFooter(`There are currently no users in the database.`));
	lbfetch = new Discord.Collection(lbfetch);
	let lbPreSort = [];
	for (const n of a === 1 ? message.guild.members : bot.users) {
		let playerId = await playersByUID.get(n[0]);
		if (!playerId) continue;
		let pData = await lbfetch.get(playerId);
		if (!pData) continue;
		lbPreSort.push({
			value: pData[args[a]],
			username: pData.username,
			accountId: pData.accountId,
			playerId: playerId,
			userId: pData.userId,
			tag: a === 1 ? n[1].user.tag : n[1].tag,
		});
	}
	let lb = lbPreSort.sort((x, y) => y.value - x.value);
	for (i = 0; i < lb.length; i++) {
		if (lb[i].userId === message.author.id) var position = i + 1;
	}
	leaderboardsLoop(args[a], lb, 0, await lbfetch.get(`time`), msg);

	async function leaderboardsLoop(type, lb, lbpos, time, msg) {
		await msg.clearReactions();
		let typeIndex = ['stars', 'coins', 'usercoins', 'demons', 'cp'].indexOf(type);
		let embed = new Discord.RichEmbed() //
			.setColor(`0x${lbpos < 10 ? 'ffd700' : lbpos < 50 ? 'dcdcdc' : lbpos < 100 ? 'ff9f20' : lbpos < 200 ? 'a5f900' : lbpos < 500 ? '48e0ff' : lbpos < 1000 ? 'ff6cff' : 'ff7966'}`)
			.setAuthor(`Page ${Math.floor(lbpos / b) + 1} / ${Math.ceil(lb.length / b)} - ${a === 1 ? `${message.guild.name}'s` : `Global`} ${type.replace(/^\w/, c => c.toUpperCase())} Leaderboard`, `https://edoosh.github.io/Images/GD/Emojis/${['star', 'coin_secret', 'coin_verified', 'Profiles/demons', 'Profiles/cp'][typeIndex]}.png`);
		if (!lb || lb == 0 || !lb[lbpos]) embed.addField(`Error`, `An error occured while getting this page of the leaderboards.`);
		else {
			desc = [];
			for (i = lbpos; i < lbpos + b && i < lb.length; i++) {
				let a = lb[i];
				a.rank = i + 1;
				let rankText = a.rank <= 10 ? e.S : a.rank <= 50 ? e.A : a.rank <= 100 ? e.B : a.rank <= 200 ? e.C : a.rank <= 500 ? e.D : a.rank <= 1000 ? e.E : e.F;

				let text = [];
				text.push(`${rankText} \`${await tools.toLength((i + 1).toString(), 4)}\``);
				text.push(`${[e.gd_star, e.coin_secret, e.coin_verified, e.demons, e.cp][typeIndex]} \`${await tools.toLength(a.value.toString(), 6, 'right')}\``);
				text.push(`**${a.username}**`);
				text.push(`\`${a.tag}\``);

				desc.push(text.join('⠀⠀'));
			}
			embed.setDescription(`This leaderboard is updated every ${config.updateLeaderboards} hours, and is based off of what is displayed on a user's profile.\nLast updated: ${await timeSince(time)} ago.\n${position ? `Your position: \`${position} / ${lb.length}\`` : `Total players: ${lb.length}`}⠀\n` + desc.join('\n'));
		}
		msg.edit(embed.setFooter('◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Next Page ▶️'));

		let end = false;
		const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
		var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
		rc.on('collect', async resp => {
			end = true;
			const reaction = resp.emoji.name;
			if (reaction === '◀️') {
				leaderboardsLoop(type, lb, lbpos - b, time, msg);
				return;
			} else if (reaction === '▶️') {
				leaderboardsLoop(type, lb, lbpos + b, time, msg);
				return;
			} else if (resp.emoji.toString() === e.page) {
				await msg.clearReactions();
				const rQ = ['◀️', e.delete];
				let newQEmbed = new Discord.RichEmbed() //
					.setTitle(`${[e.gd_star, e.coin_secret, e.coin_verified, e.demons, e.cp][typeIndex]} Page ${Math.floor(lbpos / b) + 1} / ${Math.ceil(lb.length / b)}⠀${e.page}`)
					.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
				msg.edit(newQEmbed);
				const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
				const filterQM = fMsg => fMsg.author.id === message.author.id;
				var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
				var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
				var found = false;
				rcQ.on('collect', respQ => {
					msgQ.stop();
					if (rQ[1] === respQ.emoji.toString()) leaderboardsLoop(type, lb, 0, time, msg);
					else leaderboardsLoop(type, lb, lbpos, time, msg);
				});
				msgQ.on('collect', async respQ => {
					found = true;
					rcQ.stop();
					respQ.delete();
					leaderboardsLoop(type, lb, (parseInt(respQ.content) - 1) * b, time, msg);
				});
				rcQ.on('end', async collectedQ => {
					if (found || collectedQ.size != 0) return;
					await msg.edit(new Discord.RichEmbed().setFooter(`Page selection timed out. Returning...`));
					leaderboardsLoop(type, lb, lbpos, time, msg);
				});
				for (const r of rQ) await msg.react(r.replace(/[<>]/g, ''));
			} else if (resp.emoji.toString() === e.delete) {
				msg.delete();
				return;
			}
		});
		rc.on('end', collected => {
			end = true;
			if (collected.size != 0) return;
			// Delete the message and say so
			msg.clearReactions();
			msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Display timed out.`));
			return;
		});
		if (!end) if (lbpos > 0) await msg.react('◀️');
		if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
		if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
		if (!end) if (Math.floor(lbpos / b) < Math.ceil(lb.length / b) - 1) await msg.react('▶️');
	}

	async function timeSince(time) {
		return new Promise((resolve, reject) => {
			// time is already in ms
			// Convert to sec
			let t = Date.now() - time;
			let i = t / 31557600000;
			let out = '';

			if (i > 1) {
				out += `${Math.floor(i)}y `;
				i -= Math.floor(i);
			}
			i *= 365.25 / 7;
			if (i > 1) {
				out += `${Math.floor(i)}w `;
				i -= Math.floor(i);
			}
			i *= 7;
			if (i > 1) {
				out += `${Math.floor(i)}d `;
				i -= Math.floor(i);
			}
			i *= 24;
			if (i > 1) {
				out += `${Math.floor(i)}h `;
				i -= Math.floor(i);
			}
			i *= 60;
			if (i > 1) {
				out += `${Math.floor(i)}m `;
				i -= Math.floor(i);
			}
			i *= 60;
			if (i > 1) out += `${Math.floor(i)}s`;
			return resolve(out);
		});
	}
};

module.exports.config = {
	command: ['leaderboards', 'leaderboard', 'lb'],
	permlvl: 'All',
	help: ['Fun', "Display a Guild's Leaderboard, based on linked player's stats.", 'All', '(g) (stars | coins | usercoins | demons | cp)', "Display a Guild's Leaderboard, based on linked player's stats. Adding 'g' as a modifier will make it all players, instead of just server members."],
	helpg: '',
};
