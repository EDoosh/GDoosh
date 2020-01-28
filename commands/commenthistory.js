const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');
const XOR = require('../functions/XOR.js');
const xor = new XOR();

module.exports.run = async (bot, message, args) => {
	const e = config.emojis;
	if (!message.guild) return message.channel.send(`This command may only be used in servers, due to Discord limitations.`);
	message.delete();
	let msg = await message.channel.send(`Retrieving user...`);
	if (!args[1]) return msg.edit(`No user specified!`);
	let profile = await gdtools.idAndUn(await gdtools.getPlayerID(message, await tools.getArgs(args, 1), bot), true);
	if (!profile) msg.edit(`Cannot find this user!`);
	let user = await gdtools.profile(profile[2]);
	if (user.commentHistory !== 'all' && !config.ownerId.includes(message.author.id)) return msg.edit(`This user does not have Comment History enabled!`);

	let startEmbed = new Discord.RichEmbed() //
		.setColor(`0x${user.moderator == 0 ? '6aebc0' : user.moderator == 1 ? 'ebe23f' : 'eb3f75'}`)
		.setTitle(`${user.username}`);

	user.cube = user.icon;
	let form = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'][profile[14]];
	await msg.edit(`Creating icon thumbnail...`);
	let iconSingle = await gdtools.createIcon(user, form);
	if (iconSingle !== 'error') startEmbed.attachFiles([iconSingle]);

	await msg.edit(startEmbed);
	commentHistoryLoop(user, 0, 'recent', msg);

	async function commentHistoryLoop(user, pg, mode, msg) {
		msg.clearReactions();
		let embedBeginLoop = new Discord.RichEmbed()
			.setColor(`0x${user.moderator == 0 ? '6aebc0' : user.moderator == 1 ? 'ebe23f' : 'eb3f75'}`)
			.setTitle(`${user.username}`)
			.setFooter(`Getting comment history...`)
			.setAuthor(`Page ${pg + 1}, sorted by ${mode}`, `https://edoosh.github.io/Images/GD/Emojis/Profiles/mod_${user.moderator}.png`);
		if (iconSingle !== 'error') embedBeginLoop.setThumbnail(`attachment://${user.username}-Icon.png`);
		await msg.edit(embedBeginLoop);
		let ch = await getCommentHistory(user, pg, mode);
		let embed = new Discord.RichEmbed(msg.embeds[0]);
		if (ch == '-1') embed.addField(`Error`, `An error occured while getting this page of comments.`);
		else {
			for (i = pg == 0 ? 2 : 1; i < ch.length; i++) {
				let sp = ch[i].special;
				let text = `${sp === 0 ? '' : sp === 1 ? 'diff' : sp === 2 ? 'glsl' : sp === 3 ? 'fix' : sp === 4 ? 'md' : 'CSS'}\n${sp === 1 ? '- ' : sp === 2 || sp === 4 ? '# ' : ''}${ch[i].contents}`;
				embed.addField(`⠀\n${ch[i].likes < 0 ? e.dislike : e.like} ${ch[i].likes}⠀⠀⠀${e.recent} ${ch[i].time} ago${ch[i].percent != 0 ? ` @ ${ch[i].percent}%` : ''}`, `\`\`\`${text}\`\`\`${e.info} \`Lvl ID: ${await tools.toLength(ch[i].id, 9)}\`⠀⠀${e.settings} \`Com ID: ${await tools.toLength(ch[i].commentId, 10, 'right')}\``);
			}
		}
		msg.edit(embed.setFooter('◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Switch Search Type⠀⬥⠀Next Page ▶️'));

		let end = false;
		const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete, e.like, e.recent].includes(reaction.emoji.toString())) && user.id === message.author.id;
		var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
		rc.on('collect', async resp => {
			end = true;
			const reaction = resp.emoji.name;
			if (reaction === '◀️') {
				commentHistoryLoop(user, pg - 1, mode, msg);
				return;
			} else if (reaction === '▶️') {
				commentHistoryLoop(user, pg + 1, mode, msg);
				return;
			} else if (resp.emoji.toString() === e.page) {
				await msg.clearReactions();
				const rQ = ['◀️', e.delete];
				let newQEmbed = new Discord.RichEmbed() //
					.setTitle(`${e.comment_history} Page ${pg + 1}⠀${e.page}`)
					.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
				msg.edit(newQEmbed);
				const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
				const filterQM = fMsg => fMsg.author.id === message.author.id;
				var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
				var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
				var found = false;
				rcQ.on('collect', respQ => {
					msgQ.stop();
					if (rQ[1] === respQ.emoji.toString()) commentHistoryLoop(user, 0, mode, msg);
					else commentHistoryLoop(user, pg, mode, msg);
				});
				msgQ.on('collect', async respQ => {
					found = true;
					rcQ.stop();
					respQ.delete();
					commentHistoryLoop(user, parseInt(respQ.content) - 1, mode, msg);
				});
				rcQ.on('end', async collectedQ => {
					if (found || collectedQ.size != 0) return;
					let errorMsg = await message.channel.send(`Page selection timed out. Returning...`);
					errorMsg.delete(10000);
					commentHistoryLoop(user, pg, mode, msg);
				});
				for (const r of rQ) await msg.react(r.replace(/[<>]/g, ''));
			} else if (resp.emoji.toString() === e.delete) {
				msg.delete();
				return;
			} else if (resp.emoji.toString() === e.like) {
				commentHistoryLoop(user, 0, 'liked', msg);
				return;
			} else if (resp.emoji.toString() === e.recent) {
				commentHistoryLoop(user, 0, 'recent', msg);
				return;
			}
		});
		rc.on('end', collected => {
			end = true;
			if (collected.size != 0) return;
			// Delete the message and say so
			message.channel.send(`Display timed out.`);
			msg.clearReactions();
			return;
		});
		if (!end) if (pg > 0) await msg.react('◀️');
		if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
		if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
		if (!end) {
			if (mode === 'liked') await msg.react(e.recent.replace(/[<>]/g, ''));
			if (mode === 'recent') await msg.react(e.like.replace(/[<>]/g, ''));
		}
		if (!end) await msg.react('▶️');
	}

	async function getCommentHistory(un, pg, m) {
		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			page: pg.toString(),
			secret: 'Wmfd2893gb7',
			mode: m === 'liked' ? 1 : 0,
			userID: un.playerID,
			count: 5,
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/getGJCommentHistory.php',
			form: form,
		}).catch(() => { return '-1' });
		if (!resp || resp == '-1') return '-1';
		let respSplit = resp.split(/\#/g)[0].split(/\|/g);
		if (!respSplit || !respSplit[0]) return '-1';

		let playerData = await gdtools.parseResponse(respSplit[0].split(/\:/g)[1], '~');
		comments = [
			{
				username: playerData[1],
				playerId: respSplit[0][3],
				accountId: playerData[16],
				icon: parseInt(playerData[9]),
				form: parseInt(playerData[14]),
				col1: parseInt(playerData[10]),
				col2: parseInt(playerData[11]),
			},
		];

		if (pg == 0) {
			let respInfo = resp.split(/\#/g)[1].split(/\:/g);
			comments.push({
				totalComments: parseInt(respInfo[0]),
				lowestCommentNumber: parseInt(respInfo[1]),
				perPage: parseInt(respInfo[2]),
				page: Math.ceil(parseInt(respInfo[1]) / parseInt(respInfo[2])) + 1,
				sortedBy: m === 'liked' ? 'like' : 'recent',
			});
		}

		let levels = {};
		for (const r of respSplit) {
			let x = await gdtools.parseResponse(r.split(/\:/g)[0], '~'); // Comment data
			let content = xor.b64from(x[2]);
			if (!levels.hasOwnProperty(x[1].toString())) {
				let lvl = await gdtools.getLevel(x[1]);
				if (lvl.authorID == x[3]) levels[x[1].toString()] = true;
				else levels[x[1].toString()] = false;
			}
			let y = {
				playerId: x[3],
				contents: content.replace(/[★☆⍟]/g, ''),
				likes: parseInt(x[4]),
				time: x[9],
				id: x[1],
				percent: parseInt(x[10]),
				commentId: x[6],
				// 1 for GDoosh, 2 for GDBrowser, 3 for owns level, 4 for rob, 5 for elder mod, 0 for loser regular GD user.
				special: content.endsWith('★') ? 1 : content.endsWith('⍟') || content.endsWith('☆') ? 2 : levels[x[1].toString()] ? 3 : x[3] == 16 ? 4 : x[12] ? 5 : 0,
			};
			comments.push(y);
		}
		return comments;
	}
};

module.exports.config = {
	command: ['commenthistory', 'ch'],
	permlvl: 'All',
	help: ['Fun', "See a user's comment history.", 'All', '[gdRepresentable]', "See a user's comment history."],
	helpg: '',
};
