const Discord = require('discord.js');
const db = require('quick.db');
const request = require('request-promise');
const tools = require('./generalFunctions.js');
const gdtools = require('./gdFunctions.js');

// https://edoosh.github.io/Images/GD/Emojis/Levels/daily.png
// https://edoosh.github.io/Images/GD/Emojis/Levels/weekly.png
// https://edoosh.github.io/Images/GD/Emojis/Levels/rated.png

// https://edoosh.github.io/Images/GD/Daily|Weekly|Rated/Epic|Featured|Rated/0-13.png

module.exports.run = async bot => {
	const testMode = false;
	// Fetch the most recent known rated level array
	let mostRecent = await db.get(`gdgetrated`);
	if (!mostRecent || !mostRecent.weekly || testMode) {
		mostRecent = {
			rated: [],
			weekly: null,
			daily: null,
		};
	}
	// If there isn't one, set it to the 6, 7, and 8th most recent rated levels
	if (mostRecent.rated.length === 0) {
		let newRated = await gdtools.searchLevel('*', { type: 'awarded' });
		mostRecent.rated = [newRated[5].id, newRated[6].id, newRated[7].id];
	}

	// This is just to get the most recent levels to add into the DB later
	let threecent = await gdtools.searchLevel('*', { type: 'awarded' });

	// Go through the most recent rated pages and check their IDs to see if one matches something in the 3 most recent rated.
	let gotPage = false;
	let pages = [];
	let loop = 0;
	while (gotPage === false) {
		loop++;
		if (loop > 15) return console.log(cErrMsg('Error getting rated levels'));
		var retrieved = await gdtools.searchLevel('*', { page: pages.length, type: 'awarded' });
		if (!retrieved) return console.log(cErrMsg(`Issue retrieving Rated Levels. GD Servers likely experiencing issues.`));
		pages.push(retrieved);
		for (i = 0; i < pages[pages.length - 1].length && i < 15; i++) {
			if (mostRecent.rated.includes(pages[pages.length - 1][i].id)) {
				gotPage = true;
				pages[pages.length - 1].splice(i);
				if (pages[pages.length - 1].length === 0) pages.splice(pages.length - 2);
				break;
			}
		}
	}

	// Get the daily and weekly. See if their IDs match, and if so, set them to null.
	let daily = await gdtools.getLevel('daily');
	let weekly = await gdtools.getLevel('weekly');
	if (!daily || (mostRecent.daily && mostRecent.daily == daily.id)) daily = false;
	else findAuthor(daily, 'daily');
	if (!weekly || (mostRecent.weekly && mostRecent.weekly == weekly.id)) weekly = false;
	else findAuthor(weekly, 'weekly');

	// For each level && daily && weekly
	for (const lvlPg of pages) for (const lvl of lvlPg) findAuthor(lvl, ['??? error ???', 'rated', 'featured', 'epic'][lvl.cp]);

	async function findAuthor(lvl, type) {
		lvl.type = type;
		// Find the level authors ID in PLAYERS
		if (playersByPID.has(lvl.authorID)) {
			// If there is one with a match
			// find them in the bot.
			let userId = playersByPID.get(lvl.authorID);
			let user = await bot.users.find(x => x.id === userId);
			if (!user) {
				// Cant be found -> Set isConnected to false
				lvl.isConnected = false;
				return;
			} else {
				// Can be found ->
				// DM them their level got rated.
				if (!testMode) {
					user.send(`Congratulations! Your level \`${lvl.name}\` got **${lvl.type}**!`);
					user.send(await gdtools.createEmbed(bot, lvl));
				}
				// Set isConnected to their ID
				lvl.isConnected = userId;
				lvl.isConnectedTag = user.tag;
				lvl.correctCp = await gdtools.requestCP(lvl.authorID);
				return;
			}
		} else {
			// Is noone with a match
			// Set isConnected to false.
			lvl.isConnected = false;
			return;
		}
	}

	// For each guild (channelId is [RATED, TIMED, SPECIAL])
	announceChannels.forEach(async (channelId, guildId) => {
		if (testMode && guildId !== '619704310615506955') return console.log('free me');
		// Find guild and announce channels
		let guild = await bot.guilds.get(guildId);
		if (!guild) return;
		let r = guild.channels.get(channelId[0]) || false;
		let t = guild.channels.get(channelId[1]) || false;
		let s = guild.channels.get(channelId[2]) || false;

		let roles = await pingRole.get(guild.id);

		if (pages.length !== 0 && roles) {
			if (roles[0] !== null) var rated = await guild.roles.get(roles[0]);
			if (roles[1] !== null) var timed = await guild.roles.get(roles[1]);
		}

		if (rated)
			await rated.setMentionable(true, 'Pinging times').catch(() => {
				if (r) r.send(`Please enable 'Manage Role' permission for the bot.`);
			});
		// For each level && daily && weekly
		for (const lvlPg of pages) {
			for (const lvl of lvlPg) {
				// If isConnected has an ID && they are in the server && they have a special channel
				if (lvl.isConnected && s) var user = guild.members.get(lvl.isConnected);
				if (user) s.send(`${user} *(${lvl.author})*  has got **${lvl.name}** ${lvl.type} at ${lvl.stars}! Check it out with the ID \`${lvl.id}\`${lvl.correctCp !== undefined ? `\n*They now have ${lvl.correctCp}*` : ''}`);
				if (r) {
					if (rated) await r.send(`${rated}`, await gdtools.createEmbed(bot, lvl));
					else await r.send(await gdtools.createEmbed(bot, lvl));
				}
			}
		}
		if (rated)
			await rated.setMentionable(false, 'Pinging times over :(').catch(() => {
				if (r) r.send(`Please enable 'Manage Role' permission for the bot.`);
			});
		if (timed)
			await timed.setMentionable(true, 'Pinging times round 2').catch(() => {
				if (t) t.send(`Please enable 'Manage Role' permission for the bot.`);
			});
		if (daily) {
			// If isConnected has an ID && they are in the server && they have a special channel
			if (daily.isConnected && s) var user = guild.users.find(x => x.id === daily.isConnected);
			if (user) s.send(`${user} *(${daily.author})*  has got **${daily.name}** *(${daily.type} ${daily.stars})* chosen for Daily! Check it out with the ID \`${daily.id}\`\n`);
			if (t) {
				if (timed) await t.send(`${timed}`, await gdtools.createEmbed(bot, daily));
				else await t.send(await gdtools.createEmbed(bot, daily));
			}
		}
		if (weekly) {
			// If isConnected has an ID && they are in the server && they have a special channel
			if (weekly.isConnected && s) var user = guild.users.find(x => x.id === weekly.isConnected);
			if (user) s.send(`${user} *(${weekly.author})*  has got **${weekly.name}** *(${weekly.type} ${weekly.stars})* chosen for Weekly! Check it out with the ID \`${weekly.id}\`\n`);
			if (t) {
				if (timed) await t.send(`${timed}`, await gdtools.createEmbed(bot, weekly));
				else await t.send(await gdtools.createEmbed(bot, weekly));
			}
		}
		if (timed)
			await timed.setMentionable(false, 'Pinging times over again ;(').catch(() => {
				if (t) t.send(`Please enable 'Manage Role' permission for the bot.`);
			});
	});

	// Three most recent because if the most recently rated gets unrated, it has 2 to fall back onto before it breaks.
	if (!testMode)
		db.set(`gdgetrated`, {
			rated: [threecent[0].id, threecent[1].id, threecent[2].id],
			daily: daily.id || mostRecent.daily,
			weekly: weekly.id || mostRecent.weekly,
		});
};
