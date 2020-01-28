const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');

module.exports.run = async (bot, message, args) => {
	if (!message.guild) return message.channel.send(`This command may only be used in servers, due to Discord limitations.`);
	const e = config.emojis;
	if (!args[1] || args[1] === 'a' || args[1] === 'acc') args[1] = 'accurate';
	else if (args[1] === 'c' || args[1] === 'creators' || args[1] === 'b' || args[1] === 'builder' || args[1] === 'builders') args[1] = 'creator';
	else if (args[1] === 'p' || args[1] === 'players' || args[1] === 'star' || args[1] === 'stars' || args[1] === 'top') args[1] = 'player';
	else return message.channel.send(`Valid leaderboard types are \`accurate\`, \`creator\`, or \`player\``);

	let msg = await message.channel.send(new Discord.RichEmbed().setFooter(`Retrieving leaderboards...`));
	let lb = await getScores(args[1], 10000);
	leaderboardsLoop(args[1], lb, 0, msg);

	async function leaderboardsLoop(type, lb, lbpos, msg) {
		await msg.clearReactions();
		let embed = new Discord.RichEmbed() //
			.setColor(`0x${lbpos < 10 ? 'ffd700' : lbpos < 50 ? 'dcdcdc' : lbpos < 100 ? 'ff9f20' : lbpos < 200 ? 'a5f900' : lbpos < 500 ? '48e0ff' : lbpos < 1000 ? 'ff6cff' : 'ff7966'}`)
			.setAuthor(`Page ${Math.floor(lbpos / 5) + 1} of ${type.replace(/^\w/, c => c.toUpperCase())} Leaderboards`, `https://edoosh.github.io/Images/GD/Emojis/${type === 'accurate' ? 'star' : type === 'player' ? 'Levels/not_rated' : 'Profiles/cp'}.png`);
		if (!lb[lbpos]) embed.addField(`Error`, `An error occured while getting this page of the leaderboards.`);
		else {
			for (i = lbpos; i < lbpos + 5 && i < lb.length; i++) {
				let a = lb[i];
				a.rank = parseInt(a.rank);
				let rankText = a.rank <= 10 ? e.S : a.rank <= 50 ? e.A : a.rank <= 100 ? e.B : a.rank <= 200 ? e.C : a.rank <= 500 ? e.D : a.rank <= 1000 ? e.E : e.F;
				let text = [];
				text.push(`${rankText} \`${await tools.toLength(a.rank.toString(), 6)}\``);
				text.push(`${type === 'creator' ? `${e.cp} \`${await tools.toLength(a.cp, 6)}\`` : `${e.gd_star} \`${await tools.toLength(a.stars, 6)}\``}`);
				text.push(`**${a.username}**`);
				text.push(`\n${type === 'creator' ? `${e.gd_star} \`${await tools.toLength(a.stars, 6)}\`` : `${e.cp} \`${await tools.toLength(a.cp, 6)}\``}`);
				text.push(`${e.demons} \`${await tools.toLength(a.demons, 6)}\``);
				text.push(`${e.diamond} \`${await tools.toLength(a.diamonds, 6)}\``);
				text.push(`${e.coin_secret} \`${await tools.toLength(a.coins, 3)}\``);
				text.push(`${e.coin_verified} \`${await tools.toLength(a.usercoins, 6)}\``);
				text.push(`\n${e.info} PID: \`${await tools.toLength(a.playerID, 9)}\`⠀⠀⠀AID: \`${await tools.toLength(a.accountID, 10)}\``);
				embed.addField(`⠀`, text.join('⠀⠀⠀'));
			}
		}
		msg.edit(embed.setFooter('◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Next Page ▶️'));

		let end = false;
		const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
		var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
		rc.on('collect', async resp => {
			end = true;
			const reaction = resp.emoji.name;
			if (reaction === '◀️') {
				leaderboardsLoop(type, lb, lbpos - 5, msg);
				return;
			} else if (reaction === '▶️') {
				leaderboardsLoop(type, lb, lbpos + 5, msg);
				return;
			} else if (resp.emoji.toString() === e.page) {
				await msg.clearReactions();
				const rQ = ['◀️', e.delete];
				let newQEmbed = new Discord.RichEmbed() //
					.setTitle(`${type === 'accurate' ? e.gd_star : type === 'player' ? e.not_rated : e.cp} Page ${Math.floor(lbpos / 5) + 1}⠀${e.page}`)
					.setDescription(`Enter the page number you want to be shown.\nReact ${e.delete} to go to first page.\nReact with ◀️ to return.`);
				msg.edit(newQEmbed);
				const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
				const filterQM = fMsg => fMsg.author.id === message.author.id;
				var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
				var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
				var found = false;
				rcQ.on('collect', respQ => {
					msgQ.stop();
					if (rQ[1] === respQ.emoji.toString()) leaderboardsLoop(type, lb, 0, msg);
					else leaderboardsLoop(type, lb, lbpos, msg);
				});
				msgQ.on('collect', async respQ => {
					found = true;
					rcQ.stop();
					respQ.delete();
					leaderboardsLoop(type, lb, (parseInt(respQ.content) - 1) * 5, msg);
				});
				rcQ.on('end', async collectedQ => {
					if (found || collectedQ.size != 0) return;
					await msg.edit(new Discord.RichEmbed().setFooter(`Page selection timed out. Returning...`));
					leaderboardsLoop(type, lb, lbpos, msg);
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
			msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Display timed out.`));
			msg.clearReactions();
			return;
		});
		if (!end) if (lbpos > 0) await msg.react('◀️');
		if (!end) await msg.react(e.page.replace(/[<>]/g, ''));
		if (!end) await msg.react(e.delete.replace(/[<>]/g, ''));
		if (!end) if (lbpos < (type === 'accurate' ? 100 : 10000) - 5) await msg.react('▶️');
	}

	async function getScores(type, amount = 10) {
		return new Promise(async (resolve, reject) => {
			if (type === 'accurate') {
				let resp = await rp(`https://gdleaderboards.com/incl/lbxml.php`);
				if (!resp) resp = '';
				let idArray = resp.split(',');

				let leaderboard = [];
				let total = idArray.length;

				idArray.forEach(async (x, y) => {
					let body = await rp({
						method: 'POST',
						uri: 'http://www.boomlings.com/database/getGJUserInfo20.php',
						form: { targetAccountID: x, secret: 'Wmfd2893gb7' },
					});
					if (body == '-1') return console.log('a');

					let account = await gdtools.parseResponse(body);
					let accObj = {
						rank: '0',
						username: account[1],
						playerID: account[2],
						accountID: account[16],
						stars: account[3],
						demons: account[4],
						cp: account[8],
						coins: account[13],
						usercoins: account[17],
						diamonds: account[46] == '65535' ? '65535+' : account[46],
					};
					leaderboard.push(accObj);
					if (leaderboard.length == total) {
						leaderboard = leaderboard
							.filter(x => x.stars)
							.sort(function(a, b) {
								return parseInt(b.stars) - parseInt(a.stars);
							});
						leaderboard.forEach((a, b) => (a.rank = b + 1));
						return resolve(leaderboard);
					}
				});
			} else {
				let params = {
					count: amount,
					gameVersion: '21',
					binaryVersion: '35',
					secret: 'Wmfd2893gb7',
					type: type === 'creator' || type === 'creators' ? 'creators' : 'top',
				};

				let body = await rp({
					method: 'POST',
					uri: 'http://www.boomlings.com/database/getGJScores20.php',
					form: params,
				});
				if (body == '-1' || !body) return console.log('-1');

				let split = await body.split(/\|/g);
				let scores = [];
				for (i = 0; i < split.length; i++) {
					let x = await gdtools.parseResponse(split[i]);
					let y = {};
					y.rank = x[6];
					y.username = x[1];
					y.playerID = x[2];
					y.accountID = x[16];
					y.stars = x[3];
					y.demons = x[4];
					y.cp = x[8];
					y.coins = x[13];
					y.usercoins = x[17];
					y.diamonds = x[46] == '65535' ? '65535+' : x[46];
					scores.push(y);
				}
				return resolve(scores);
			}
		});
	}
};

module.exports.config = {
	command: ['gdleaderboards', 'gdleaderboard', 'gdlb'],
	permlvl: 'All',
	help: ['Fun', 'Display the Geometry Dash Leaderboards', 'All', '(accurate | creator | player)', 'Display the Geometry Dash Leaderboards.'],
	helpg: '',
};
