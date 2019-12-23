const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');

module.exports.run = async (bot, message, args) => {
	if (!/[0-9]/.test(args[1])) {
		if (!message.guild) return message.channel.send(`This sub-command may only be used in servers, due to Discord limitations.`);
		message.delete();
		const e = config.emojis;
		let search = await tools.getArgs(args, 1);
		if (search && search.length > 20) return message.channel.send(`Search can not be longer than 20 characters.`);
		let msg = await message.channel.send(`Creating embed...`);
		let data = {
			str: search || '*',
			diff: undefined,
			demonType: undefined,
			page: 0,
			gauntlet: 0,
			len: undefined,
			song: undefined,
			epic: false,
			featured: false,
			star: false,
			noStar: false,
			originalOnly: false,
			twoPlayer: false,
			coins: false,
			customSong: false,
			type: 0,
		};
		searchEmbed(data, msg);
		async function searchEmbed(data, msg) {
			let end = false;
			await msg.clearReactions();
			if (!data.difficulty) data.difficulty = ['-1', '-2', '-3', '1', '2', '3', '4', '5'];
			if (!data.demonType) data.demonType = ['1', '2', '3', '4', '5'];
			if (!data.len) data.len = ['0', '1', '2', '3', '4'];
			if (!data.page) data.page = 0;
			if (typeof data.difficulty === 'string') data.difficulty = data.difficulty.split(',');
			if (typeof data.demonType === 'string') data.demonType = data.demonType.split(',');
			if (typeof data.len === 'string') data.len = data.len.split(',');
			if (typeof data.page === 'string') data.page = 0;

			let type = await getType(data);
			let diff = await getDifficulty(data);
			let length = await getLength(data);
			let lvlA = await getAdvanced(data, true);
			let lvlI = [];
			lvlI.push(`${e.page} \`Page      \`⠀${data.page + 1}`);
			lvlI.push(`${e.length} \`Length    \`⠀${length}`);
			lvlI.push(`${e.music_note} \`Song ID   \`⠀${data.song ? `[${data.song}](https://www.newgrounds.com/audio/listen/${data.song})` : 'All'}`);
			lvlI.push(`${e.demons} \`Difficulty\`⠀${diff}`);

			let embed = new Discord.RichEmbed()
				.setTitle(`${e.search} ${data.str !== '*' ? `__${data.str}__` : '___Anything___'}`)
				.setDescription(`React with the appropriate emoji to change its value.\n${e.checkbox_ticked} to search the level.\n${e.delete} to cancel the search.`)
				.setColor(`0x${['f53131', 'f58331', 'f5e131', '89f531', '31f579', '31f5e1', '31aaf5', '4062f7', '6a42ed', 'ad52f7', 'e540f7', 'f531c4', 'f0325b'][Math.floor(Math.random() * 13)]}`)
				.addField(`${e.type} **Type**`, type, true)
				.addField(`${e.settings} **Advanced Search**`, lvlA.join('\n'), true)
				.addField(`${e.cp} **Level Info**`, lvlI.join('\n'), false)
				.setFooter(`${config.name} v${config.version} Level Search`);
			msg.edit(embed);
			// CHECKMARK | SEARCH | TYPE | ADVANCED | LEVEL INFO | CANCEL
			const rMain = [e.checkbox_ticked, e.search, e.type, e.settings, e.cp, e.delete];
			const filterMain = (reaction, user) => message.author.id === user.id && rMain.includes(reaction.emoji.toString());
			// `<:${reaction.emoji.name}:${reaction.emoji.id}>`
			var rcMain = msg.createReactionCollector(filterMain, { max: 1, time: 30000, errors: ['time'] });
			rcMain.on('end', collected => {
				if (collected.size != 0) return;
				message.channel.send(`Level search creation timed out. Cancelled selection.`);
			});
			rcMain.on('collect', async resp => {
				let end = true;
				let respMain = rMain.indexOf(resp.emoji.toString());
				await msg.clearReactions();
				// Search for the level
				if (respMain === 0) {
					searchLevel(data, msg);
					return;
				}
				// Cancel the selection
				else if (respMain === 5) {
					msg.delete();
					message.channel.send(`Cancelled level selection.`);
					return;
				}
				// Change the search terms
				else if (respMain === 1) {
					if (data.type !== 0) {
						let msgError = await message.channel.send(`Can't set a search string if you have a Type enabled!`);
						msgError.delete(10000);
						searchEmbed(data, msg);
						return;
					}
					editSearch(data, msg);
					return;
				}
				// Change the type they search for
				else if (respMain === 2) {
					editType(data, msg);
					return;
				}
				// Change the advanced settings
				else if (respMain === 3) {
					if ([6, 7, 16].includes(data.type)) {
						let msgError = await message.channel.send(`Can't set advanced values if you have the Epic, Featured, or Magic type enabled!`);
						msgError.delete(10000);
						searchEmbed(data, msg);
						return;
					}
					editAdv(data, msg);
					return;
				}
				// Change the level information they try search with
				else if (respMain === 4) {
					editInfo(data, msg);
					return;
				}
			});
			// React on the message
			for (const r of rMain) if (!end) await msg.react(r.replace(/[<>]/g, ''));
		}
		async function searchLevel(data, msg) {
			if (data.len.length === 5) data.len = undefined;
			else data.len = data.len.toString();
			if (data.difficulty.length === 8) data.difficulty = undefined;
			else data.difficulty = data.difficulty.toString();
			if (data.demonType.length === 5) data.demonType = undefined;
			else data.demonType = data.demonType.toString();
			chooseLevel(data, msg, 0);
			async function chooseLevel(data, msg, zf) {
				await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Retrieving level info...`));
				let lvlsF = await gdtools.searchLevel(data.str, data);
				await msg.clearReactions();
				let lvls = [];
				for (i = 0; i < 5; i++) lvls.push(lvlsF[i + zf]);
				if (lvlsF == '-1' && data.page === 0 && zf === 0) {
					msg.delete();
					message.channel.send(`No levels found matching your search terms.`);
					return;
				}
				if (lvlsF == '-1' || lvls[0] == undefined) {
					let errorMsg = await message.channel.send(`There was an error retrieving this page. Returning you to page 1.`);
					data.page = 0;
					errorMsg.delete(10000);
					chooseLevel(data, msg, 0);
					return;
				}
				await msg.edit(new Discord.RichEmbed(msg.embeds[0]).setFooter(`Constructing new embed...`));
				msg.edit(
					(await gdtools.createListEmbed(lvls)) //
						.setTitle(`${e.search} ${data.str === '*' ? 'Level Search' : data.str}⠀⠀⠀⠀⠀⠀Page ${data.page * 2 + (zf === 0 ? 1 : 2)}⠀${e.page}⠀*In-Game Page ${data.page + 1}*`)
						.setFooter(`◀️ Previous Page⠀⬥⠀Set Page⠀⬥⠀Cancel Search⠀⬥⠀Change Search⠀⬥⠀Next Page ▶️`),
				);
				const filter = (reaction, user) => (['◀️', '▶️'].includes(reaction.emoji.name) || [e.settings, e.page, e.delete].includes(reaction.emoji.toString())) && user.id === message.author.id;
				var rc = msg.createReactionCollector(filter, { max: 1, time: 60000, errors: ['time'] });
				rc.on('collect', async resp => {
					const reaction = resp.emoji.name;
					if (reaction === '◀️') {
						if (zf === 0) {
							data.page--;
							zf = 5;
						} else zf = 0;
						chooseLevel(data, msg, zf);
						return;
					} else if (reaction === '▶️') {
						if (zf === 5) {
							data.page++;
							zf = 0;
						} else zf = 5;
						chooseLevel(data, msg, zf);
						return;
					} else if (resp.emoji.toString() === e.page) {
						let pgS = await message.channel.send(`Which page would you like to be shown?`);
						const filterPg = fmsg => fmsg.author.id === message.author.id && /[0-9]/.test(fmsg.content);
						var pg = await msg.channel.createMessageCollector(filterPg, { maxMatches: 1, time: 10000, errors: ['time'] });
						pg.on('end', collectedSearched => {
							if (collectedSearched.size != 0) return;
							message.channel.send(`Page selection times out`);
							msg.clearReactions();
							return;
						});
						pg.on('collect', pgR => {
							zf = (parseInt(pgR.content) - 1) % 2;
							data.page = Math.floor((parseInt(pgR.content) - 1) / 2);
							chooseLevel(data, msg, zf);
							pgR.delete();
							pgS.delete();
							return;
						});
					} else if (resp.emoji.toString() === e.settings) {
						searchEmbed(data, msg);
						return;
					} else if (resp.emoji.toString() === e.delete) {
						msg.delete();
						return;
					}
				});
				rc.on('end', collected => {
					if (collected.size != 0) return;
					// Delete the message and say so
					message.channel.send(`Display timed out.`);
					msg.clearReactions();
					return;
				});
				if (data.page > 0 || zf === 5) await msg.react('◀️');
				await msg.react(e.page.replace(/[<>]/g, ''));
				await msg.react(e.delete.replace(/[<>]/g, ''));
				await msg.react(e.settings.replace(/[<>]/g, ''));
				if (lvls[lvls.length - 1] !== undefined) await msg.react('▶️');
			}
		}
		async function editSearch(data, msg) {
			let respSearch = await askQuestion(data, msg, 'Type a message to set it as the search string.');
			if (respSearch === 'back') {
				searchEmbed(data, msg);
				return;
			} else if (respSearch === 'delete') {
				data.str = '*';
				searchEmbed(data, msg);
				return;
			} else if (respSearch === 'end') {
				let msgSearchError = await message.channel.send('Search timed out. Returning to main.');
				msgSearchError.delete(5000);
				searchEmbed(data, msg);
				return;
			} else {
				if (respSearch.content.length > 20) {
					let msgSearchError = await message.channel.send(`Search can not be longer than 20 characters.`);
					msgSearchError.delete(5000);
					searchEmbed(data, msg);
					return;
				} else {
					data.str = respSearch.content;
					searchEmbed(data, msg);
					return;
				}
			}
		}
		async function editType(data, msg) {
			const rType = ['◀️', e.delete, e.download, e.like, e.trending, e.recent, e.featured, e.magic, e.rated, e.epic];
			var end = false;
			let typeEmbed = new Discord.RichEmbed() //
				.setTitle(`${e.search} __${data.str === '*' ? '*Anything*' : data.str}__`)
				.setDescription(`**CURRENT TYPE** - ${await getType(data)}\nReact with the corresponding reaction to set your type to that\nYou can only have one type active at a time, and it will delete your search term.\n**Deletes search filters** deletes all your current search filters except Difficulty.\nReact ${e.delete} to allow it to be anything.\nReact with ◀️ to return.`)
				.addField(`**Allows search filters**`, `${e.download} \`Most Downloaded\`\n${e.like} \`Most Liked\`\n${e.trending} \`Trending\`\n${e.recent} \`Recent\`\n${e.rated} \`Rated\``, true)
				.addField(`**Deletes search filters**`, `${e.featured} \`Featured\`\n${e.epic} \`Hall Of Fame\`\n${e.magic} \`Magic\``, true);
			msg.edit(typeEmbed);
			const filterTypeR = (reaction, user) => rType.includes(reaction.emoji.toString()) && user.id === message.author.id;
			var rcType = msg.createReactionCollector(filterTypeR, { max: 1, time: 30000, errors: ['time'] });
			rcType.on('collect', respType => {
				end = true;
				data.type = [data.type, 0, 1, 2, 3, 4, 6, 7, 11, 16][rType.indexOf(respType.emoji.toString())];
				if (data.type > 0) data.str = '*';
				if ([6, 7, 16].includes(data.type)) {
					if (data.difficulty.includes('-1')) data.difficulty.splice(data.difficulty.indexOf('-1'), 1);
					if (data.difficulty.includes('-2')) data.difficulty.splice(data.difficulty.indexOf('-2'), 1);
					if (data.difficulty.includes('-3')) data.difficulty.splice(data.difficulty.indexOf('-3'), 1);
					data = { str: '*', diff: data.difficulty, demonType: [], page: data.page, gauntlet: 0, len: ['0', '1', '2', '3', '4'], song: undefined, epic: false, featured: false, star: false, noStar: false, originalOnly: false, twoPlayer: false, coins: false, customSong: false, type: data.type };
				}
				searchEmbed(data, msg);
				return;
			});
			rcType.on('end', async collectedSearch => {
				if (collectedSearch.size != 0) return;
				let msgSearchError = await message.channel.send('Type change timed out. Returning to main.');
				msgSearchError.delete(5000);
				return searchEmbed(data, msg);
			});
			for (const r of rType) if (!end) await msg.react(r.replace(/[<>]/g, ''));
		}
		async function editAdv(data, msg) {
			const rAdv = ['◀️', e.delete, e.not_rated, e.gd_star, e.featured, e.epic, e.copied, e.two_player, e.coin_verified];
			var end = false;
			let advEmbed = new Discord.RichEmbed() //
				.setTitle(`${e.search} __${data.str === '*' ? '*Anything*' : data.str}__`)
				.setDescription(`**CURRENTLY ENABLED** - ${(await getAdvanced(data, false)).join('⠀')}\nReact with the corresponding reaction to enable/disable that setting.\nReact ${e.delete} to reset it to be anything.\nReact with ◀️ to return.`)
				.addField(`⠀`, `${e.not_rated} \`Not Rated\`\n${e.gd_star} \`Rated\`\n${e.featured} \`Featured\`\n${e.epic} \`Epic\``, true)
				.addField(`⠀`, `${e.copied} \`Original Only\`\n${e.two_player} \`2 Player\`\n${e.coin_verified} \`Has Coins\``, true);
			msg.edit(advEmbed);
			const filterAdvR = (reaction, user) => rAdv.includes(reaction.emoji.toString()) && user.id === message.author.id;
			var rcAdv = msg.createReactionCollector(filterAdvR, { max: 1, time: 30000, errors: ['time'] });
			rcAdv.on('collect', async respAdv => {
				advI = rAdv.indexOf(respAdv.emoji.toString());
				if (advI === 0) {
					end = true;
					searchEmbed(data, msg);
					return;
				}
				await msg.reactions.get(`${respAdv.emoji.name}:${respAdv.emoji.id}`).remove(message.author.id);
				if (advI === 1) {
					data.epic = false;
					data.featured = false;
					data.star = false;
					data.noStar = false;
					data.originalOnly = false;
					data.twoPlayer = false;
					data.coins = false;
				} else if (advI === 2) {
					if (data.noStar) data.noStar = false;
					else data.noStar = true;
				} else if (advI === 3) {
					if (data.star) data.star = false;
					else data.star = true;
				} else if (advI === 4) {
					if (data.featured) data.featured = false;
					else data.featured = true;
				} else if (advI === 5) {
					if (data.epic) data.epic = false;
					else data.epic = true;
				} else if (advI === 6) {
					if (data.originalOnly) data.originalOnly = false;
					else data.originalOnly = true;
				} else if (advI === 7) {
					if (data.twoPlayer) data.twoPlayer = false;
					else data.twoPlayer = true;
				} else if (advI === 8) {
					if (data.coins) data.coins = false;
					else data.coins = true;
				}
				editAdv(data, msg);
				return;
			});
			rcAdv.on('end', async collectedSearch => {
				if (collectedSearch.size != 0) return;
				let msgSearchError = await message.channel.send('Advanced settings change timed out. Returning to main.');
				msgSearchError.delete(5000);
				return searchEmbed(data, msg);
			});
			for (const r of rAdv) if (!end) await msg.react(r.replace(/[<>]/g, ''));
		}
		async function editInfo(data, msg) {
			await msg.clearReactions();
			const rInfo = ['◀️', e.delete, e.page, e.length, e.music_note, e.demons];
			var end = false;
			let InfoEmbed = new Discord.RichEmbed() //
				.setTitle(`${e.search} __${data.str === '*' ? '*Anything*' : data.str}__`)
				.setDescription(`${e.page} \`Set Page  \`⠀⬥⠀\`${data.page + 1}\`\n${e.length} \`Length    \`⠀⬥⠀${await getLength(data)}\n${e.music_note} \`Song ID   \`⠀⬥⠀\`${data.song ? `[${data.song}](https://www.newgrounds.com/audio/listen/${data.song})` : 'All'}\`\n${e.demons} \`Difficulty\`⠀⬥⠀${await getDifficulty(data)}`, true);
			msg.edit(InfoEmbed);
			const filterInfoR = (reaction, user) => rInfo.includes(reaction.emoji.toString()) && user.id === message.author.id;
			var rcInfo = msg.createReactionCollector(filterInfoR, { max: 1, time: 30000, errors: ['time'] });
			rcInfo.on('collect', async respInfo => {
				await msg.clearReactions();
				end = true;
				var infoI = rInfo.indexOf(respInfo.emoji.toString());
				if (infoI === 0) {
					searchEmbed(data, msg);
					return;
				} else if (infoI === 1) {
					data.page = 0;
					data.len = undefined;
					data.song = undefined;
					data.difficulty = undefined;
					data.demonType = undefined;
					editInfo(data, msg);
					return;
				} else if (infoI === 2) {
					// Page
					let respIP = await askQuestion(data, msg, `**CURRENTLY** - ${data.page + 1}\nType the number of the in-game page to start on.`);
					if (respIP === 'back') {
						editInfo(data, msg);
						return;
					} else if (respIP === 'delete') {
						data.page = 0;
						editInfo(data, msg);
						return;
					} else if (respIP === 'end') {
						let msgError = await message.channel.send('Page selection timed out. Returning to Info.');
						msgError.delete(5000);
						editInfo(data, msg);
						return;
					} else {
						data.page = parseInt(respIP) - 1;
						editInfo(data, msg);
						return;
					}
				} else if (infoI === 3) {
					// Length
					editLength(data, msg);
					return;
				} else if (infoI === 4) {
					// Song
					let respIP = await askQuestion(data, msg, `**CURRENTLY** - ${data.song ? `[${data.song}](https://www.newgrounds.com/audio/listen/${data.song})` : 'All'}\nType the Song ID to search for.\nOfficial song search is bugged in game and therefor can not be chosen.`);
					if (respIP === 'back') {
						editInfo(data, msg);
						return;
					} else if (respIP === 'delete') {
						data.song = undefined;
						data.customSong = false;
						editInfo(data, msg);
					} else if (respIP === 'end') {
						let msgError = await message.channel.send('Song ID timed out. Returning to Info.');
						msgError.delete(5000);
						editInfo(data, msg);
						return;
					} else {
						data.song = respIP;
						data.customSong = true;
					}
				} else if (infoI === 5) {
					// Difficulty
					editDifficulty(data, msg);
					return;
				}
			});
			rcInfo.on('end', async collectedSearch => {
				if (collectedSearch.size != 0) return;
				let msgSearchError = await message.channel.send('Info change timed out. Returning to main.');
				msgSearchError.delete(5000);
				return searchEmbed(data, msg);
			});
			for (const r of rInfo) if (!end) await msg.react(r.replace(/[<>]/g, ''));
		}
		async function editLength(data, msg) {
			const rLen = ['◀️', e.delete, '1⃣', '2⃣', '3⃣', '4⃣', '5⃣'];
			var end = false;
			let lenEmbed = new Discord.RichEmbed() //
				.setTitle(`${e.search} __${data.str === '*' ? '*Anything*' : data.str}__`)
				.setDescription(`**CURRENTLY ENABLED** - ${await getLength(data)}\nReact with the corresponding reaction to enable/disable that length.\nReact ${e.delete} to reset it to be anything.\nReact with ◀️ to return.`)
				.addField(`⠀`, `1⃣ \`Tiny\`\n2⃣ \`Short\`\n3⃣ \`Medium\`\n4⃣ \`Long\`\n5⃣ \`XL\``);
			msg.edit(lenEmbed);
			const filterLenR = (reaction, user) => rLen.includes(reaction.emoji.toString()) && user.id === message.author.id;
			var rcLen = msg.createReactionCollector(filterLenR, { max: 1, time: 30000, errors: ['time'] });
			rcLen.on('collect', async respLen => {
				lenI = rLen.indexOf(respLen.emoji.toString());
				if (lenI === 0) {
					end = true;
					editInfo(data, msg);
					return;
				}
				if (lenI === 1) {
					data.len = ['0', '1', '2', '3', '4'];
					await msg.reactions.get(`${respLen.emoji.name}:${respLen.emoji.id}`).remove(message.author.id);
				} else if (lenI >= 2) {
					if (data.len.includes(`${lenI - 2}`)) data.len.splice(data.len.indexOf(`${lenI - 2}`), 1);
					else data.len.push(`${lenI - 2}`);
					await msg.reactions.get(respLen.emoji.name).remove(message.author.id);
				}
				editLength(data, msg);
				return;
			});
			rcLen.on('end', async collectedSearch => {
				if (collectedSearch.size != 0) return;
				let msgSearchError = await message.channel.send('Length settings change timed out. Returning to Info.');
				msgSearchError.delete(5000);
				return searchEmbed(data, msg);
			});
			for (const r of rLen) if (!end) await msg.react(r.replace(/[<>]/g, ''));
		}
		async function editDifficulty(data, msg) {
			const rDiff = ['◀️', e.delete, e.na, e.auto, e.easy, e.normal, e.hard, e.harder, e.insane, e.easy_demon, e.medium_demon, e.hard_demon, e.insane_demon, e.extreme_demon];
			var end = false;
			let diffEmbed = new Discord.RichEmbed() //
				.setTitle(`${e.search} __${data.str === '*' ? '*Anything*' : data.str}__`)
				.setDescription(`**CURRENTLY ENABLED** - ${await getDifficulty(data)}\nOnly difficulties from one category in the embed can be selected at a time.\nReact ${e.delete} to reset it to be anything.\nReact with ◀️ to return.`)
				.addField(`N/A`, `${e.na} \`N/A\``, true)
				.addField(`Auto`, `${e.auto} \`N/A\``, true)
				.addBlankField(true)
				.addField(`Normal`, `${e.easy} \`Easy\`\n${e.normal} \`Normal\`\n${e.hard} \`Hard\`\n${e.harder} \`Harder\`\n${e.insane} \`Insane\``, true)
				.addField(`Demon`, `${e.easy_demon} \`Easy Demon\`\n${e.medium_demon} \`Medium Demon\`\n${e.hard_demon} \`Hard Demon\`\n${e.insane_demon} \`Insane Demon\`\n${e.extreme_demon} \`Extreme Demon\``, true)
				.addBlankField(true);
			msg.edit(diffEmbed);
			const filterDiffR = (reaction, user) => rDiff.includes(reaction.emoji.toString()) && user.id === message.author.id;
			var rcDiff = msg.createReactionCollector(filterDiffR, { max: 1, time: 30000, errors: ['time'] });
			rcDiff.on('collect', async respDiff => {
				diffI = rDiff.indexOf(respDiff.emoji.toString());
				if (diffI === 0) {
					end = true;
					editInfo(data, msg);
					return;
				}
				await msg.reactions.get(`${respDiff.emoji.name}:${respDiff.emoji.id}`).remove(message.author.id);
				if (diffI === 1) {
					data.difficulty = ['-1', '-2', '-3', '1', '2', '3', '4', '5'];
					data.demonType = ['1', '2', '3', '4', '5'];
				} else if (diffI === 2) {
					data.difficulty = ['-1'];
					data.demonType = [];
				} else if (diffI === 3) {
					data.difficulty = ['-3'];
					data.demonType = [];
				} else if (diffI >= 4 && diffI <= 8) {
					if (data.difficulty.includes('-1') || data.difficulty.includes('-2') || data.difficulty.includes('-3')) {
						data.difficulty = [`${diffI - 3}`];
						data.demonType = [];
					} else if (data.difficulty.includes(`${diffI - 3}`)) data.difficulty.splice(data.difficulty.indexOf(`${diffI - 3}`), 1);
					else data.difficulty.push(`${diffI - 3}`);
				} else if (diffI >= 9 && diffI <= 13) {
					if (data.difficulty !== ['-2']) {
						data.difficulty = [`-2`];
						data.demonType = [`${diffI - 8}`];
					} else {
						if (data.demonType.includes(`${diffI - 8}`)) data.demonType.splice(data.demonType.indexOf(`${diffI - 8}`), 1);
						else data.demonType.push(`${diffI - 8}`);
					}
				}
				editDifficulty(data, msg);
				return;
			});
			rcDiff.on('end', async collectedSearch => {
				if (collectedSearch.size != 0) return;
				let msgSearchError = await message.channel.send('Difficulty settings change timed out. Returning to Info.');
				msgSearchError.delete(5000);
				return searchEmbed(data, msg);
			});
			for (const r of rDiff) if (!end) await msg.react(r.replace(/[<>]/g, ''));
		}
		async function getType(data) {
			type = '';
			if (data.type === 1) type = `${e.download} **Most Downloaded**`;
			else if (data.type === 2) type = `${e.like} **Most Liked**`;
			else if (data.type === 3) type = `${e.trending} **Trending**`;
			else if (data.type === 4) type = `${e.recent} **Recent**`;
			else if (data.type === 6) type = `${e.featured} **Featured**`;
			else if (data.type === 7) type = `${e.magic} **Magic**`;
			else if (data.type === 11) type = `${e.rated} **Awarded**`;
			else if (data.type === 16) type = `${e.epic} **Hall Of Fame**`;
			else type = `${e.delete} *None specified*`;
			return type;
		}
		async function getDifficulty(data) {
			let diff = [];
			if (data.difficulty.includes('-1')) diff.push(e.na);
			if (data.difficulty.includes('-3')) diff.push(e.auto);
			if (data.difficulty.includes('1')) diff.push(e.easy);
			if (data.difficulty.includes('2')) diff.push(e.normal);
			if (data.difficulty.includes('3')) diff.push(e.hard);
			if (data.difficulty.includes('4')) diff.push(e.harder);
			if (data.difficulty.includes('5')) diff.push(e.insane);
			if (data.difficulty.includes('-2') && data.demonType.includes('1')) diff.push(e.easy_demon);
			if (data.difficulty.includes('-2') && data.demonType.includes('2')) diff.push(e.medium_demon);
			if (data.difficulty.includes('-2') && data.demonType.includes('3')) diff.push(e.hard_demon);
			if (data.difficulty.includes('-2') && data.demonType.includes('4')) diff.push(e.insane_demon);
			if (data.difficulty.includes('-2') && data.demonType.includes('5')) diff.push(e.extreme_demon);
			return diff.join(' ');
		}
		async function getLength(data) {
			let length = [];
			if (data.len.includes('0')) length.push('**Tiny**');
			if (data.len.includes('1')) length.push('**Short**');
			if (data.len.includes('2')) length.push('**Medium**');
			if (data.len.includes('3')) length.push('**Long**');
			if (data.len.includes('4')) length.push('**XL**');
			return length.join(' - ');
		}
		async function getAdvanced(data, text) {
			let adv = [];
			if (data.epic) adv.push(`${e.epic}${text ? ` **Epic**` : ''}`);
			if (data.featured) adv.push(`${e.featured}${text ? ` **Featured**` : ''}`);
			if (data.star) adv.push(`${e.gd_star}${text ? ` **Starred**` : ''}`);
			if (data.noStar) adv.push(`${e.not_rated}${text ? ` **Not Rated**` : ''}`);
			if (data.originalOnly) adv.push(`${e.copied}${text ? ` **Original**` : ''}`);
			if (data.twoPlayer) adv.push(`${e.two_player}${text ? ` **2 Player**` : ''}`);
			if (data.coins) adv.push(`${e.coin_verified}${text ? ` **Has Coins**` : ''}`);
			if (adv.length === 0) adv.push(`${e.delete} *No Advanced Filters*`);
			return adv;
		}
		async function askQuestion(data, msg, embed) {
			return new Promise(async (resolve, reject) => {
				const rQ = ['◀️', e.delete];
				let newQEmbed = new Discord.RichEmbed() //
					.setTitle(`${e.search} __${data.str === '*' ? '*Anything*' : data.str}__`)
					.setDescription(`${embed}\nReact ${e.delete} to allow it to be anything.\nReact with ◀️ to return.`);
				msg.edit(newQEmbed);
				const filterQR = (reaction, user) => rQ.includes(reaction.emoji.toString()) && user.id === message.author.id;
				const filterQM = fMsg => fMsg.author.id === message.author.id;
				var rcQ = msg.createReactionCollector(filterQR, { max: 1, time: 30000, errors: ['time'] });
				var msgQ = message.channel.createMessageCollector(filterQM, { max: 1, time: 30000, errors: ['time'] });
				var found = false;
				rcQ.on('collect', respQ => {
					msgQ.stop();
					if (rQ[1] === respQ.emoji.toString()) resolve('delete');
					else resolve('back');
				});
				msgQ.on('collect', async respQ => {
					found = true;
					rcQ.stop();
					respQ.delete();
					resolve(respQ);
				});
				rcQ.on('end', async collectedQ => {
					if (found || collectedQ.size != 0) return;
					resolve('end');
				});
				for (const r of rQ) await msg.react(r.replace(/[<>]/g, ''));
			});
		}
	} else {
		let msg = await message.channel.send(`Retrieving level...`);
		let lvl = await gdtools.getLevel(args[1], args[2] === 'd' || args[2] === 'download');
		if (!lvl || lvl === '-1') return msg.edit(`An error occured fetching this level.`);
		msg.edit(`${config.emojis.search} Here is the level!`, await gdtools.createEmbed(bot, lvl));
	}
};

module.exports.config = {
	command: ['level', 'lvl', 'search'],
	permlvl: 'All',
	help: ['Fun', 'Retrieves, or searches for, a level.', 'All', '(search)', 'Brings up the search screen. If (search) is specified, it automatically starts with that.', 'All', '[levelID]', 'Searches for a level ID.', 'All', '[levelID] d', 'Searches for a level ID and downloads it. Takes longer but has more info.'],
	helpg: '',
};
