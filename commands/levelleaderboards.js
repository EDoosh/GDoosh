const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');

module.exports.run = async (bot, message, args) => {
	if (!message.guild) return message.channel.send(`This command may only be used in servers, due to Discord limitations.`);
	if (!args[1]) return message.channel.send(`Please specify a level ID!`);
	const b = 10;
	const e = config.emojis;
	if (!args[2] || args[2] === 't' || args[2] === 'best' || args[2] === 'all') args[2] = 'top';
	else if (args[2] === 'w' || args[2] === 'week') args[2] = 'weekly';
	else return message.channel.send(`Valid leaderboard types are \`weekly\` or \`top\``);

	let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Retrieving leaderboards...`));
	let lb = await getScores(args[1], args[2]);
	let lvl = await gdtools.retrieveLevel(args[1]);
	leaderboardsLoop([lvl || args[1], args[2]], lb, 0, msg);

	async function leaderboardsLoop(v, lb, lbpos, msg) {
		await msg.clearReactions();
		let embed = new Discord.RichEmbed() //
			.setColor(`0x${lbpos < 10 ? 'ffd700' : lbpos < 50 ? 'dcdcdc' : lbpos < 100 ? 'ff9f20' : lbpos < 200 ? 'a5f900' : lbpos < 500 ? '48e0ff' : lbpos < 1000 ? 'ff6cff' : 'ff7966'}`)
			.setAuthor(`Page ${Math.floor(lbpos / b) + 1} of the ${v[1].replace(/^\w/, c => c.toUpperCase())} Leaderboard`, `https://edoosh.github.io/Images/GD/Emojis/Levels/${v[1] === 'weekly' ? 'recent' : 'trending'}.png`)
			.setTitle(`__${v[0].name || '*Invalid Level*'}__⠀*(${v[0].id || v[0]})*⠀by ${v[0].author || '*Unknown*'}`);
		if (lb == 0 || !lb[lbpos]) embed.addField(`Error`, `An error occured while getting this page of the leaderboards.`);
		else {
			desc = [];
			for (i = lbpos; i < lbpos + b && i < lb.length; i++) {
				let a = lb[i];
				a.rank = parseInt(a.rank);
				let rankText = a.rank <= 10 ? e.S : a.rank <= 50 ? e.A : a.rank <= 100 ? e.B : a.rank <= 200 ? e.C : a.rank <= 500 ? e.D : a.rank <= 1000 ? e.E : e.F;
				let coinOut = '';
				for (j = 0; j < parseInt(a.coins); j++) coinOut += `${e.coin_verified} `;

				let text = [];
				text.push(`${rankText} \`${await tools.toLength(a.rank.toString(), 3)}\``);
				text.push(`\`${await tools.toLength(a.percent.toString(), 3, 'right')}%\``);
				text.push(coinOut);
				text.push(`**${a.username}**`);
				text.push(`${e.length} \`${await tools.toLength(`${a.time} ago`, 14)}\``);

				desc.push(text.join('⠀'));
			}
			embed.setDescription(desc.join('\n'));
		}
		msg.edit(embed.setFooter('◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Next Page ▶️'));

		let end = false;
		const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
		var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
		rc.on('collect', async resp => {
			end = true;
			const reaction = resp.emoji.name;
			if (reaction === '◀️') {
				leaderboardsLoop(v, lb, lbpos - b, msg);
				return;
			} else if (reaction === '▶️') {
				leaderboardsLoop(v, lb, lbpos + b, msg);
				return;
			} else if (resp.emoji.toString() === e.page) {
				await msg.clearReactions();
				const rQ = ['◀️', e.delete];
				let newQEmbed = new Discord.RichEmbed() //
					.setTitle(`${v[1] === 'top' ? e.trending : e.recent} Page ${Math.floor(lbpos / b) + 1}⠀${e.page}`)
					.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
				msg.edit(newQEmbed);
				const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
				const filterQM = fMsg => fMsg.author.id === message.author.id;
				var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
				var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
				var found = false;
				rcQ.on('collect', respQ => {
					msgQ.stop();
					if (rQ[1] === respQ.emoji.toString()) leaderboardsLoop(v, lb, 0, msg);
					else leaderboardsLoop(v, lb, lbpos, msg);
				});
				msgQ.on('collect', async respQ => {
					found = true;
					rcQ.stop();
					respQ.delete();
					leaderboardsLoop(v, lb, (parseInt(respQ.content) - 1) * b, msg);
				});
				rcQ.on('end', async collectedQ => {
					if (found || collectedQ.size != 0) return;
					let errorMsg = await message.channel.send(`Page selection timed out. Returning...`);
					errorMsg.delete(10000);
					leaderboardsLoop(v, lb, lbpos, msg);
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
			message.channel.send(`Display timed out.`);
			msg.clearReactions();
			return;
		});
		if (!end) if (lbpos > 0) await msg.react('◀️');
		if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
		if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
		if (!end) if (lbpos < 200 - b) await msg.react('▶️');
	}

	async function getScores(id, tp) {
		return new Promise(async (resolve, reject) => {
			let form = {
				gameVersion: '21',
				binaryVersion: '35',
				gdw: '0',
				accountID: loginData.accountId,
				gjp: loginData.password,
				levelID: id,
				secret: 'Wmfd2893gb7',
				type: tp === 'friends' ? '0' : tp === 'weekly' ? '2' : '1',
			};

			let resp = await rp({
				method: 'POST',
				uri: 'http://www.boomlings.com/database/getGJLevelScores211.php',
				form: form,
			});
			if (resp == '-1' || resp == '-01') return -1;
			let split = await resp.split(/\|/g);
			let scores = [];
			if (!resp) {
				scores = 0;
				split = [];
			}
			for (i = 0; i < split.length; i++) {
				let x = await gdtools.parseResponse(split[i]);
				let y = {};
				y.rank = x[6];
				y.username = x[1];
				y.percent = x[3];
				y.coins = x[13];
				y.playerId = x[2];
				y.accountId = x[16];
				y.time = x[42];
				y.icon = x[9]; // The icon of the chosen form
				y.form = x[14];
				y.col1 = x[10];
				y.col2 = x[11];
				scores.push(y);
			}
			return resolve(scores);
		});
	}
};

module.exports.config = {
	command: ['levelleaderboards', 'levelleaderboard', 'lvlleaderboard', 'lvllb', 'llb'],
	permlvl: 'All',
	help: ['Fun', "Display a Level's Leaderboard.", 'All', '(top | week)', "Display a Level's Leaderboard."],
	helpg: '',
};
