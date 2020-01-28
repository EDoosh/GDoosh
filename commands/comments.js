const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');
const XOR = require('../functions/XOR.js');
const xor = new XOR();

module.exports.run = async (bot, message, args) => {
	if (!message.guild) return message.channel.send(`This command may only be used in servers, due to Discord limitations.`);
	if (!args[1]) return message.channel.send(`Please provide a level ID.`);
	if (parseInt(args[1]) === NaN) return message.channel.send(`Please provide a valid level ID.`);
	if (parseInt(args[1]) > 100000000 || parseInt(args[1]) < -100000000) return message.channel.send(`Please provide a level ID which is between -100,000,000 and 100,000,000.`);
	if (!args[2] || ['read', 'r', 'view', 'v', 'comments', 'comm', 'c'].includes(args[2])) {
		const e = config.emojis;
		message.delete();

		let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Beginning Comment Search...`));
		let lvl = await gdtools.getLevel(args[1].toString());
		if (lvl == -1) lvl = undefined;
		// page, mode, msg, lvl, count (as b)
		const b = 5;
		commentLoop(0, 'recent', lvl || args[1], msg);

		async function commentLoop(pg, mode, lvl, msg) {
			msg.clearReactions();
			let embed = new Discord.RichEmbed()
				.setColor(0x4287f5)
				.setTitle(`__${lvl.name || '*Invalid Level*'}__⠀*(${lvl.id || lvl})*⠀by ${lvl.author || '*Unknown*'}`)
				.setAuthor(`Page ${pg + 1}, sorted by ${mode}`, `https://gdbrowser.com/assets/comment.png`);
			let ch = await read(lvl, mode, pg, b);
			if (ch == '-1' || !ch || !ch[0] || !ch[1]) embed.addField(`Error`, `An error occured while getting this page of comments.`);
			else {
				for (i = 1; i < ch.length; i++) {
					let sp = ch[i].special;
					let text = `${sp === 0 ? '' : sp === 1 ? 'diff' : sp === 2 ? 'glsl' : sp === 3 ? 'fix' : sp === 4 ? 'md' : 'CSS'}\n${sp === 1 ? '- ' : sp === 2 || sp === 4 ? '# ' : ''}${ch[i].contents}`;
					embed.addField(`⠀`, `__**${ch[i].author}**__⠀⠀⠀${ch[i].likes < 0 ? e.dislike : e.like} ${ch[i].likes}⠀⠀⠀${e.recent} ${ch[i].time} ago${ch[i].percent != 0 ? ` @ ${ch[i].percent}%` : ''}\n\`\`\`${text}\`\`\`${e.settings} \`Com ID: ${await tools.toLength(ch[i].commentId || 'error', 10, 'right')}\``);
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
					commentLoop(pg - 1, mode, lvl, msg);
					return;
				} else if (reaction === '▶️') {
					commentLoop(pg + 1, mode, lvl, msg);
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
						if (rQ[1] === respQ.emoji.toString()) commentLoop(0, mode, lvl, msg);
						else commentLoop(pg, mode, lvl, msg);
					});
					msgQ.on('collect', async respQ => {
						found = true;
						rcQ.stop();
						respQ.delete();
						commentLoop(parseInt(respQ.content) - 1, mode, lvl, msg);
					});
					rcQ.on('end', async collectedQ => {
						if (found || collectedQ.size != 0) return;
						await msg.edit(new Discord.RichEmbed().setFooter(`Page selection timed out. Returning...`));
						commentLoop(pg, mode, lvl, msg);
					});
					for (const r of rQ) await msg.react(r.replace(/[<>]/g, ''));
				} else if (resp.emoji.toString() === e.delete) {
					msg.delete();
					return;
				} else if (resp.emoji.toString() === e.like) {
					commentLoop(0, 'liked', lvl, msg);
					return;
				} else if (resp.emoji.toString() === e.recent) {
					commentLoop(0, 'recent', lvl, msg);
					return;
				}
			});
			rc.on('end', collected => {
				end = true;
				if (collected.size != 0) return;
				// Delete the message and say so
				msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Display timed out.`));
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

		async function read(lvl, m, pg, cnt) {
			let id = lvl.id || lvl;
			let author = lvl.authorID || -2;
			let resp = await rp({
				method: 'POST',
				uri: 'http://www.boomlings.com/database/getGJComments21.php',
				form: {
					gameVersion: '21',
					binaryVersion: '35',
					page: pg.toString(),
					secret: 'Wmfd2893gb7',
					mode: m === 'liked' ? 1 : 0,
					levelID: id.toString(),
					count: parseInt(cnt),
				},
			});
			if (!resp || resp == '-1') return;
			let respInfo = resp.split(/\#/g)[1].split(/\:/g);
			comments = [
				{
					totalComments: parseInt(respInfo[0]),
					lowestCommentNumber: parseInt(respInfo[1]),
					perPage: parseInt(respInfo[2]),
					page: Math.ceil(parseInt(respInfo[1]) / parseInt(respInfo[2])) + 1,
					sortedBy: m === 'liked' ? 'like' : 'recent',
					id: id,
				},
			];
			let respSplit = resp.split(/\#/g)[0].split(/\|/g);
			if (!respSplit || !respSplit[0]) return;
			for (const r of respSplit) {
				let x = await gdtools.parseResponse(r.split(/\:/g)[0], '~'); // Comment data
				let z = await gdtools.parseResponse(r.split(/\:/g)[1], '~'); // Player data
				let content = xor.b64from(x[2]);
				let y = {
					author: z[1],
					playerId: x[3],
					accountId: z[16],
					contents: content.replace(/[★☆⍟]/g, ''),
					likes: parseInt(x[4]),
					time: x[9],
					percent: parseInt(x[10]),
					commentId: x[6],
					icon: parseInt(z[9]),
					form: parseInt(z[14]),
					col1: parseInt(z[10]),
					col2: parseInt(z[11]),
					// 1 for GDoosh, 2 for GDBrowser, 3 for owns level, 4 for rob, 5 for elder mod, 0 for loser regular GD user.
					special: content.endsWith('★') ? 1 : content.endsWith('⍟') || content.endsWith('☆') ? 2 : x[3] == author ? 3 : x[3] == 16 ? 4 : x[12] ? 5 : 0,
				};
				comments.push(y);
			}
			return comments;
		}
	} else if (['post', 'p', 'write', 'w'].includes(args[2])) {
		if (!args[3]) return message.channel.send(`Please provide some text to comment!`);
		let text = await tools.getArgs(args, 3);
		if (text.length > 149) return message.channel.send(`You may not post comments which are longer than 149 characters. Your current comment length: ${text.length} characters.`);
		let pId = await playersByUID.get(message.author.id);
		if (!pId) return message.channel.send(`Please link up your account using \`${config.prefix}link\``);
		let ps = await passwords.get(message.author.id);
		if (!ps) return message.channel.send(`Please link up your password using \`${config.prefix}pass\``);
		let profile = await gdtools.idAndUn(pId);
		if (!profile) return message.channel.send(`Sorry, there was an issue getting your profile information!`);

		let percent = 0;
		text = xor.b64to(text + '★');
		let chk = xor.encrypt(await gdtools.sha1(profile[0] + text + args[1] + percent + '0xPT6iUrtws0J'), 29481);
		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			accountID: profile[2],
			gjp: xor.encrypt(ps, 37526),
			userName: profile[0],
			comment: text,
			secret: 'Wmfd2893gb7',
			levelID: args[1].toString(),
			percent: percent.toString(),
			chk: chk,
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/uploadGJComment21.php',
			form: form,
			headers: {
				'x-forwarded-for': '255.255.255.255',
			},
		});

		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. Perhaps they are down?`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your comment! Try again later, or verify your password is still up to date.');
		if (resp.startsWith('temp')) {
			let banStuff = resp.split('_');
			return message.channel.send(`You have been banned from commenting for ${(parseInt(banStuff[1]) / 86400).toFixed(0)} days. Reason: ${banStuff[2] || 'None'}`);
		}
		message.channel.send(`Your comment was successfully posted! CommentID: ${resp}`);
	} else if (['delete', 'del', 'd', 'r', 'remove', 'rem'].includes(args[2])) {
		if (!args[3]) return message.channel.send(`Please provide a commentId to delete! This can be found by the ${config.emojis.settings} emoji using \`${config.prefix}comments [lvlId] read\``);
		let cId = args[3];
		let pId = await playersByUID.get(message.author.id);
		if (!pId) return message.channel.send(`Please link up your account using \`${config.prefix}link\``);
		let ps = await passwords.get(message.author.id);
		if (!ps) return message.channel.send(`Please link up your password using \`${config.prefix}pass\``);
		let profile = await gdtools.idAndUn(pId);
		if (!profile) return message.channel.send(`Sorry, there was an issue getting your profile information!`);
		let form = {
			gameVersion: '21',
			binaryVersion: '35',
			gdw: '0',
			accountID: profile[2],
			gjp: xor.encrypt(ps, 37526),
			commentID: cId.toString(),
			secret: 'Wmfd2893gb7',
			levelID: args[1].toString(),
		};
		let resp = await rp({
			method: 'POST',
			uri: 'http://www.boomlings.com/database/deleteGJComment20.php',
			form: form,
		});

		if (!resp) return message.channel.send(`The Geometry Dash servers returned nothing. Perhaps they are down?`);
		if (resp == '-1') return message.channel.send('The Geometry Dash servers rejected your delete request! Try again later, or verify your password is still up to date.\nPlease note that it will not delete it if the level does not currently exist.');
		message.channel.send(`Your comment was successfully deleted!`);
	} else return message.channel.send(`Valid types are \`read\`, \`post\`, or \`delete\``);
};

module.exports.config = {
	command: ['comments', 'comment', 'com', 'comm', 'lvlcomments', 'lvlcomment', 'lvlcomm', 'levelcomments', 'levelcomment'],
	permlvl: 'All',
	help: ['Fun', 'Display, post, and delete comments on a level.', 'All', '[lvlId] read', 'Display comments on a level.', 'All', '[lvlId] post [commentText]', 'Post comments on a level.', 'All', '[lvlId] delete [commentId]', "Delete a comment from a level. The level must exist in-game. CommentID's are displayed when running the Read command."],
	helpg: '[lvlId] (read | post | delete)',
};
