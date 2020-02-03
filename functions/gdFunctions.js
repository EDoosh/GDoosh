const rp = require('request-promise');
const regData = {
	gameVersion: '21',
	binaryVersion: '25',
	secret: 'Wmfd2893gb7',
};
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const levels = require('./levels.json').music;
const mapPacks = require('./mappacks.json');
const tools = require('./generalFunctions.js');
const Discord = require('discord.js');
const C = require('canvas');
const db = require('quick.db');
const crypto = require('crypto');

/**
 * Get a user's correct CP count.
 * @param {number} playerID The player's GDID.
 * @returns {number} The amount of CP they have.
 */
module.exports.requestCP = async playerID => {
	let levels = ['', '', '', '', '', '', '', '', '', ''];
	let page = -1;
	let cp = 0;
	return new Promise(async (resolve, reject) => {
		while (levels.length === 10) {
			page++;
			if (page === config.maxPagesCpSearch) return resolve(undefined);
			levels = await this.searchLevel(playerID, { user: true, page: page });
			if (!levels || levels == '-1') return resolve(cp);
			for (i = 0; i < levels.length; i++) {
				cp += levels[i].cp;
			}
			if (levels.length !== 10) return resolve(cp);
		}
	});
};

/**
 * Get the basic info about a user.
 * @param {string} search The string to search for.
 * @param {boolean} full Whether to return the whole thing. Default is false.
 * @returns {Array.<string>} An array with ['Username', 'playerID', 'accountID']
 */
module.exports.idAndUn = async (search, full = false) => {
	const rpoInitial = {
		method: 'POST',
		uri: 'http://boomlings.com/database/getGJUsers20.php',
		form: {
			str: search,
			secret: regData.secret,
		},
	};
	// Retrieve basic info, format it, and then get the account ID from it.
	const returnedInitial = await rp(rpoInitial).catch(() => console.log(cErrInfo(`Issue retrieving ID and username. GD Servers likely experiencing issues.`)));
	if (!returnedInitial || returnedInitial === '-1') return undefined;
	let info = await this.parseResponse(returnedInitial);
	return new Promise((resolve, reject) => {
		if (full === false) resolve([`${info[1]}`, `${info[2]}`, `${info[16]}`]);
		else resolve(info);
	});
};

/**
 * Parse Geometry Dash's stupid response system.
 * @param {string} responseBody The response that GD Servers give.
 * @param {string} splitter What to split at.
 * @returns {object} The formatted result.
 */
module.exports.parseResponse = async (responseBody, splitter) => {
	if (!responseBody || responseBody == '-1') return {};
	let response = responseBody.split('#')[0].split(splitter || ':');
	let res = {};
	for (let i = 0; i < response.length; i += 2) {
		res[response[i]] = response[i + 1];
	}
	return res;
};

/**
 * Retrieve information about a user
 * @param {string} search The username or accountID to search for
 * @returns {object} The fomatted result
 */
module.exports.profile = async search => {
	// The following is just to get the account ID from a string. Does this even if search term is an ID
	try {
		var accId = (await this.idAndUn(search))[2];
	} catch {
		console.log('Error retrieving profile - accId failed.');
		return null;
	}

	// The following retrieves information about the user from the accountId we got before.
	// Create the object to pass through to request-promise
	const rpoInformation = {
		method: 'POST',
		uri: 'http://boomlings.com/database/getGJUserInfo20.php',
		form: {
			targetAccountID: accId,
			secret: regData.secret,
		},
	};
	// Retrieve and array-ify the user's information.
	const returned = await rp(rpoInformation).catch(() => console.log(cErrInfo(`Issue retrieving Profile Information. GD Servers likely experiencing issues.`)));
	let account = await this.parseResponse(returned);
	// Turn their data into an object
	let userData = {
		username: account[1],
		playerID: account[2],
		accountID: account[16],
		rank: account[30],
		stars: account[3],
		diamonds: account[46] == '65535' ? '65535+' : account[46],
		coins: account[13],
		userCoins: account[17],
		demons: account[4],
		cp: account[8],
		friendRequests: account[19] == '0',
		messages: account[18] == '0' ? 'all' : account[18] == '1' ? 'friends' : 'off',
		commentHistory: account[50] == '0' ? 'all' : account[50] == '1' ? 'friends' : 'off',
		moderator: account[49],
		youtube: account[20] || null,
		twitter: account[44] || null,
		twitch: account[45] || null,
		icon: account[21],
		ship: account[22],
		ball: account[23],
		ufo: account[24],
		wave: account[25],
		robot: account[26],
		spider: account[43],
		col1: account[10],
		col2: account[11],
		deathEffect: account[48],
		glow: account[28] == '1',
	};
	let l = new Discord.Collection((await db.fetch(`ml`)) || [[]]);
	if (l.has(userData.playerID) && userData.moderator == 0) {
		l.delete(userData.playerID);
		db.set(`ml`, await tools.arrayMap(l));
	} else if (l.has(userData.playerID) || (!l.has(userData.playerID) && userData.moderator != 0)) {
		l.set(userData.playerID, { username: userData.username, elder: userData.moderator });
		db.set(`ml`, await tools.arrayMap(l));
	}
	return new Promise((resolve, reject) => resolve(userData));
};

/**
 * Get a list of 10 levels from the GD servers
 * @param {string} search The string to search for.
 * @param {object} params The filters to search with. Look at code-examples/searchLevels.js for filters.
 * @returns {object} 10 level objects
 */
module.exports.searchLevel = async (search, params = {}) => {
	// Create the initial filter
	let filters = {
		str: search,
		diff: params.difficulty,
		demonFilter: params.demonType,
		page: params.page || 0,
		gauntlet: params.gauntlet || 0,
		len: params.length,
		song: params.songID,

		epic: params.hasOwnProperty('epic') && params.epic === true ? 1 : 0,
		featured: params.hasOwnProperty('featured') && params.featured === true ? 1 : 0,
		star: params.hasOwnProperty('starred') && params.starred === true ? 1 : 0,
		noStar: params.hasOwnProperty('noStar') && params.noStar === true ? 1 : 0,
		originalOnly: params.hasOwnProperty('original') && params.original === true ? 1 : 0,
		twoPlayer: params.hasOwnProperty('twoPlayer') && params.twoPlayer === true ? 1 : 0,
		coins: params.hasOwnProperty('coins') && params.coins === true ? 1 : 0,
		customSong: params.hasOwnProperty('customSong') && params.customSong === true ? 1 : 0,

		type: params.type || 0,
		secret: regData.secret,
	};

	// Find a mappack with the search query. If one is found, set the search string to their IDs instead.
	let foundPack = mapPacks[search.toLowerCase()];
	if (foundPack) filters.str = `${foundPack[0]},${foundPack[1]},${foundPack[2]}`;
	// If searching for a gauntlet, mappack, or saved, set filter's type to 10
	if (params.gauntlet || params.hasOwnProperty('mappack') || params.type == 'saved') filters.type = 10;
	// If a song ID is specified & you aren't looking for custom songs & songID === name of one of the official songs
	if (params.songID && filters.customSong == 0 && levels.find(x => params.songID.toLowerCase() == x[0].toLowerCase())) {
		// Set songID in filters to the index of the name
		filters.song = levels.findIndex(x => params.songID.toLowerCase() == x[0].toLowerCase());
	}
	// If there is a type specified, set the filter's type to that.
	if (params.type && typeof params.type === 'string') {
		let filterCheck = params.type.toLowerCase();
		if (filterCheck == 'mostdownloaded') filters.type = 1;
		if (filterCheck == 'mostliked') filters.type = 2;
		if (filterCheck == 'trending') filters.type = 3;
		if (filterCheck == 'recent') filters.type = 4;
		if (filterCheck == 'featured') filters.type = 6;
		if (filterCheck == 'magic') filters.type = 7;
		if (filterCheck == 'awarded' || filterCheck == 'starred') filters.type = 11;
		if (filterCheck == 'halloffame' || filterCheck == 'hof') filters.type = 16;
	}
	// If searching for user levels, set filter's type to 5 (looks for user levels)
	if (params.hasOwnProperty('user')) {
		filters.type = 5;
		// If the search string isnt a playerID it wont work, so re-run this code but with the found playerID
		if (!search.match(/^[0-9]*$/)) return this.searchLevel(await this.idAndUn(search)[2], filters);
	}
	// If you're searching for anything, just delete the search string from filters.
	if (search === '*') delete filters.str;

	// Request the contents
	const body = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJLevels21.php', form: filters }).catch(() => console.log(cErrInfo(`Issue retrieving Search. GD Servers likely experiencing issues.`)));
	if (!body || body == '-1') return '-1';
	let preRes = body.split('#')[0].split('|', 10);
	let authorList = {};
	let songList = {};
	let authors = body.split('#')[1].split('|');
	let songs = '~' + body.split('#')[2];
	songs = songs.split('|~1~:').map(x => {
		let string = x + '|~1~';
		let response = string.split('#')[0].split('~|~');
		let res = {};
		for (let i = 0; i < response.length; i += 2) {
			res[response[i]] = response[i + 1];
		}
		return res;
	});
	songs.forEach(x => {
		songList[x['~1']] = x['2'];
	});

	authors.splice(10, 999);
	authors.forEach(x => {
		if (x.startsWith('~')) return;
		let arr = x.split(':');
		authorList[arr[0]] = [arr[1], arr[2]];
	});

	let levelArray = await preRes.map(x => {
		let response = x.split('#')[0].split(':');
		let res = {};
		for (let i = 0; i < response.length; i += 2) {
			res[response[i]] = response[i + 1];
		}
		return res;
	});

	await levelArray.forEach(async (x, y) => {
		let keys = Object.keys(x);

		x = Object.assign(x, await this.formatLevel(x));
		x.author = authorList[x[6]] ? authorList[x[6]][0] : '-';
		x.accountID = authorList[x[6]] ? authorList[x[6]][1] : '0';

		let songSearch = songs.find(y => y['~1'] == x[35]);
		if (songSearch) {
			x.songName = songSearch[2] || 'Unknown';
			x.songAuthor = songSearch[4] || 'Unknown';
			x.songSize = (songSearch[5] || '0') + 'MB';
			x.songID = songSearch[1] || x.customSong;
		} else {
			let foundSong = await this.getSongOfficial(parseInt(x[12]) + 1);
			x.songName = foundSong.name;
			x.songAuthor = foundSong.author;
			x.songSize = foundSong.size;
			x.songID = foundSong.id;
		}

		keys.forEach(k => delete x[k]);
	});

	return levelArray;
};

/**
 * Get a level by it's level ID.
 * @param {string} id The ID of the level, or 'daily'/'weekly'
 * @param {boolean} download Whether to download the level or not.
 * @param {boolean} data Whether to return the level data.
 * @returns {object} Returns an object containing information about the level.
 */
module.exports.getLevel = async (id, download = false, data = false) => {
	if (download || id === 'daily' || id === 'weekly') return await this.downloadLevel(id, data);
	else return await this.retrieveLevel(id);
};

/**
 * Download a level by it's level ID.
 * @param {string} id The ID of the level, or 'daily'/'weekly'
 * @param {boolean} data Whether to return the entire data of the level
 * @returns {object} Returns an object containing information about the level.
 */
module.exports.downloadLevel = async (id, data = false) => {
	let levelID = id;
	if (levelID == 'daily') levelID = -1;
	else if (levelID == 'weekly') levelID = -2;
	else levelID = levelID.replace(/[^0-9]/g, '');

	let body = await rp({ method: 'POST', uri: 'http://boomlings.com/database/downloadGJLevel22.php', form: { levelID, secret: regData.secret } }).catch(() => console.log(cErrMsg(`Issue downloading level. GD Servers likely experiencing issues.`)));
	if (!body || body == '-1') return console.log(cErr(`${levelID < 0 ? `IGNORE` : `ERROR!`} - Issue retrieving level data. ID: ${id}`));

	let levelInfo = await this.parseResponse(body);
	let level = await this.formatLevel(levelInfo);

	level.uploaded = levelInfo[28] + ' ago'; //not given in search
	level.updated = levelInfo[29] + ' ago'; //not given in search
	level.password = levelInfo[27];
	level.ldm = levelInfo[40] == 1; //not given in search
	if (level.password != '0') {
		let pass = level.password;
		pass = xor.decrypt(pass, 26364);
		if (pass.length > 1) level.password = pass.slice(1);
		else level.password = pass;
	}

	if (levelID === -1) level.number = Math.round((new Date() - new Date(1482231600000)) / (24 * 60 * 60 * 1000));
	if (levelID === -2) level.number = Math.round((new Date() - new Date(1510484400000)) / (7 * 24 * 60 * 60 * 1000));

	let b2 = await this.idAndUn(level.authorID);
	if (b2) {
		level.author = b2[0];
		level.accountID = b2[2];
	} else {
		level.author = '-';
		level.accountID = '0';
	}

	let songData = await this.getSong(level);
	level.songName = songData.name;
	level.songAuthor = songData.author;
	level.songSize = songData.size;
	level.songID = songData.id;
	level.invalidSong = songData.invalid;

	if (data === true) level.data = levelInfo[4];

	return level;
};

/**
 * Retrieve a level by it's level ID. Must download to get password, uploaded, updated, ldm, and level data.
 * @param {string} id The ID of the level.
 * @returns {object} Returns an object containing information about the level.
 */
module.exports.retrieveLevel = async id => {
	let levelID = id.replace(/[^0-9]/g, '');

	let body = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJLevels21.php', form: { str: levelID, secret: regData.secret, type: 0 } }).catch(() => console.log(cErrInfo(`Issue retrieving level data. GD Servers likely experiencing issues.`)));
	if (!body || body == '-1') return '-1';

	let preRes = body.split('#')[0].split('|', 10);
	let author = body
		.split('#')[1]
		.split('|')[0]
		.split(':');
	let song = '~' + body.split('#')[2];
	song = await this.parseResponse(song, '~|~');

	let levelInfo = await this.parseResponse(preRes[0]);
	let level = await this.formatLevel(levelInfo);
	if (author[1]) level.author = author[1];
	if (author[2]) level.accountID = author[2];

	if (song[2]) {
		level.songName = song[2] || 'Unknown';
		level.songAuthor = song[4] || 'Unknown';
		level.songSize = (song[5] || '0') + 'MB';
		level.songID = song[1] || level.customSong;
	} else {
		let foundSong = await this.getSongOfficial(level.officialSong);
		level.songName = foundSong.name;
		level.songAuthor = foundSong.author;
		level.songSize = foundSong.size;
		level.songID = foundSong.id;
	}
	return level;
};

/**
 * Formats a level's data properly
 * @param {object} levelInfo The level object.
 * @returns {object} Returns formatted level data
 */
module.exports.formatLevel = async levelInfo => {
	let orbs = [0, 0, 50, 75, 125, 175, 225, 275, 350, 425, 500];
	let length = ['Tiny', 'Short', 'Medium', 'Long', 'XL'];
	let difficulty = { 0: 'Unrated', 10: 'Easy', 20: 'Normal', 30: 'Hard', 40: 'Harder', 50: 'Insane' };

	let level = {
		name: levelInfo[2],
		id: levelInfo[1],
		description: xor.b64from(levelInfo[3]) || '(No description provided)',
		author: '-',
		authorID: levelInfo[6],
		accountID: 0,
		difficulty: difficulty[levelInfo[9]],
		downloads: levelInfo[10],
		likes: levelInfo[14],
		disliked: levelInfo[14] < 0,
		length: length[levelInfo[15]],
		stars: levelInfo[18],
		orbs: orbs[levelInfo[18]],
		diamonds: levelInfo[18] < 2 ? 0 : parseInt(levelInfo[18]) + 2,
		featured: levelInfo[19] > 0,
		epic: levelInfo[42] == 1,
		version: levelInfo[5],
		copiedID: levelInfo[30],
		officialSong: levelInfo[35] == 0 ? parseInt(levelInfo[12]) + 1 : 0,
		customSong: levelInfo[35],
		coins: levelInfo[37],
		verifiedCoins: levelInfo[38] == 1,
		starsRequested: levelInfo[39],
		objects: levelInfo[45] == '65535' ? '65000+' : levelInfo[45],
		large: levelInfo[45] > 40000,
	};

	level.cp = (level.stars > 0) + level.featured + level.epic;

	if (levelInfo[17] == 1) level.difficulty += ' Demon';
	if (level.difficulty == 'Insane Demon') level.difficulty = 'Extreme Demon';
	else if (level.difficulty == 'Harder Demon') level.difficulty = 'Insane Demon';
	else if (level.difficulty == 'Normal Demon') level.difficulty = 'Medium Demon';
	else if (levelInfo[25] == 1) level.difficulty = 'Auto';
	level.difficultyFace = `${levelInfo[17] != 1 ? level.difficulty.toLowerCase() : `demon-${level.difficulty.toLowerCase().split(' ')[0]}`}${level.epic ? '-epic' : `${level.featured ? '-featured' : ''}`}`;

	return level;
};

/**
 * Gets a songs information from its songID.
 * @param {object} level The level object. All that is needed is [.customSong] and [.officialSong]. Set officialSong to 0 to return undefined if customSong isn't found.
 * @returns {object} Returns information about the song.
 */
module.exports.getSong = async level => {
	let song = {};
	let songRes = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJSongInfo.php', form: { songID: level.customSong, secret: regData.secret } }).catch(() => console.log(cErrInfo(`Issue retrieving song data. GD Servers likely experiencing issues.`)));
	if (songRes != '-1') {
		let songData = await this.parseResponse(songRes, '~|~');
		if (songData[10]) {
			var l = songData[10].replace(/%3A/g, ':').replace(/%2F/g, '/');
			l = l.slice(0, l.indexOf('.mp3') + 4);
		}
		song.name = songData[2] || 'Unknown';
		song.author = songData[4] || 'Unknown';
		song.size = (songData[5] || '0') + 'MB';
		song.id = songData[1] || level.customSong;
		song.link = l || null;
		song.invalid = false;
		if (!songData[2]) song.invalid = true;
	} else if (level.hasOwnProperty('officialSong') && (level.officialSong != 0 || (level.officialSong == 0 && level.customSong == 0))) song = await this.getSongOfficial(level.officialSong);
	else return undefined;
	return song;
};

/**
 * Gets a songs information when it is with an Official Song
 * @param {number} officialSong The ID of the official song.
 * @returns {object} The song object.
 */
module.exports.getSongOfficial = async officialSong => {
	let foundSong = levels[officialSong] || { null: true };
	let song = {};
	song.name = foundSong[0] || 'Unknown';
	song.author = foundSong[1] || 'Unknown';
	song.size = (foundSong[2] || '0') + 'MB';
	song.id = foundSong[3] || 'Level ' + [officialSong];
	song.link = foundSong[4] || null;
	song.invalid = false;
	if (song.link) song.link = `http://audio.ngfiles.com/${Math.floor(song.id / 1000) * 1000}/${song.id}_${song.link}`;
	return song;
};

/**
 * Returns the playerId of a user
 * @param {collection} message The message it originates from
 * @param {string} search The string to search for
 * @param {boolean} returnSearch Returns the search string. DEFAULT: TRUE
 * @returns {string} The playerID of the user
 */
module.exports.getPlayerID = async (message, search, bot, returnSearch = true) => {
	let user = await tools.getMember(message, search, bot);
	if (!user) return returnSearch ? search : undefined;
	let pID = await playersByUID.get(user.id);
	return pID ? pID : returnSearch ? search : undefined;
};

/**
 * Creates an embed of the level data
 * @param {collection} bot The current client instance
 * @param {object} level The level object
 * @param {object} g Whether it is a guild or not.
 * @returns {Discord.RichEmbed} The formatted level Rich Embed.
 */
module.exports.createEmbed = async (bot, level) => {
	let dl = level.hasOwnProperty('ldm');
	if (!level.type) level.type = level.cp != 0 ? 'Rated' : 'not_rated';
	// Set values
	let typeSimplified = level.type === 'daily' ? 'Daily' : level.type === 'weekly' ? 'Weekly' : level.cp != 0 ? 'Rated' : 'not_rated';
	let rfe = ['NotRated', 'Rated', 'Featured', 'Epic'][level.cp];
	let col = typeSimplified === 'Daily' ? 'f27b63' : typeSimplified === 'Weekly' ? '63adf2' : rfe === 'NotRated' ? 'ae9cb8' : rfe === 'Rated' ? 'e6e34e' : rfe === 'Featured' ? '65e64e' : 'eb52b8';
	// lvlImg to the required value
	if (level.cp != 0) var lvlImg = level.stars == 10 ? (level.difficulty === 'Easy Demon' ? 9 : level.difficulty === 'Medium Demon' ? 10 : level.difficulty === 'Hard Demon' ? 11 : level.difficulty === 'Insane Demon' ? 12 : 13) : level.stars - 1;
	else var lvlImg = level.difficulty === 'Unrated' ? 0 : level.difficulty === 'Auto' ? 1 : level.difficulty === 'Easy' ? 2 : level.difficulty === 'Normal' ? 3 : level.difficulty === 'Hard' ? 4 : level.difficulty === 'Harder' ? 5 : 6;
	// The amount of coins and if they are verified or not
	let coinOut = '';
	for (i = 0; i < parseInt(level.coins); i++) coinOut += `${level.verifiedCoins ? config.emojis.coin_verified : config.emojis.coin_unverified} `;
	// Set the title of the first field
	if (level.cp != 0) var rfeTitle = `${rfe} for ${level.difficulty} ${level.stars}\\*`;
	else if (level.starsRequested != 0) var rfeTitle = `Not Rated, requested for ${level.starsRequested}\\*`;
	else var rfeTitle = `Not Rated`;

	// Find the level authors ID in PLAYERS
	if (playersByPID.has(level.authorID)) {
		// If there is one with a match
		// find them in the bot.
		var user = await bot.users.get(await playersByPID.get(level.authorID));
	}

	// Level Information
	let info1 = '';
	let info2 = '';
	info1 += `${config.emojis.download} \`${level.downloads}\``;
	info1 += `\n${level.disliked ? config.emojis.dislike : config.emojis.like} \`${level.likes}\``;
	info1 += `\n${config.emojis.length} \`${level.length}\``;
	if (dl) info1 += `\n${config.emojis.pass} ${level.password == 0 ? `No Copy` : level.password == 1 ? `Free Copy` : `||\`${level.password}\`||`}`;
	if (level.copiedID != 0) info2 += `\n${config.emojis.copied} \`${level.copiedID}\``;
	if (level.objects != 0) info2 += `\n${level.large ? config.emojis.large_level : config.emojis.small_level} \`${level.objects} Obj\``;
	if (dl) info2 += `\n${level.ldm ? config.emojis.checkbox_ticked : config.emojis.checkbox} \`${level.ldm ? 'Has' : 'No'} LDM\``;
	info2 += `\n${config.emojis.gdlb} [GD Level Browser](https://gdbrowser.com/${level.id})`;

	return new Discord.RichEmbed()
		.setAuthor(level.number ? `${typeSimplified} #${level.number}` : level.author, `https://edoosh.github.io/Images/GD/Emojis/Levels/${typeSimplified}.png`)
		.setTitle(`${level.number ? `**__${level.name}__**\n*${level.author}*` : `**${level.name}**`} ${level.copiedID !== '0' ? config.emojis.copied : ``} ${level.large === true ? config.emojis.large_level : ''}${coinOut.length > 0 ? `\n${coinOut}` : ''}`)
		.setDescription(
			(await tools.cleanR(level.description))
				.replace(/\\/g, '\\\\')
				.replace(/\*/g, '\\*')
				.replace(/_/g, '\\_'),
		)
		.addField(`${config.emojis.info} **${rfeTitle}**`, info1, true)
		.addField(`⠀`, info2, true)
		.addField(`${config.emojis.music_note} **__${await tools.cleanR(level.songName)}__** by **${level.songAuthor}**`, `:id: ${level.songID}\n${config.emojis.newgrounds} [Newgrounds Audio](https://www.newgrounds.com/audio/listen/${level.songID})\n${':floppy_disk:'} ${level.songSize}`, false)
		.setThumbnail(`https://edoosh.github.io/Images/GD/${typeSimplified === 'not_rated' ? 'Rated' : typeSimplified}/${rfe}/${lvlImg}.png`)
		.setColor(`0x${col}`)
		.setFooter(`Level ID: ${level.id}⠀⬥⠀${level.version != 1 ? `Level Version ${level.version}⠀⬥⠀` : ''}${user ? `Discord: ${user.tag}` : `AccountID: ${level.accountID}⠀⬥⠀PlayerID: ${level.authorID}`}`);
};

/**
 * Creates an embed of a list of levels
 * @param {object} lvls The list of levels
 * @param {object} g Whether it is a guild or not.
 * @returns {Discord.RichEmbed} The formatted list Rich Embed
 */
module.exports.createListEmbed = async lvls => {
	let embed = new Discord.RichEmbed().setTitle(`${config.emojis.search} Level Search`).setColor(`0x${['f53131', 'f58331', 'f5e131', '89f531', '31f579', '31f5e1', '31aaf5', '4062f7', '6a42ed', 'ad52f7', 'e540f7', 'f531c4', 'f0325b'][Math.floor(Math.random() * 13)]}`);
	for (const lvl of lvls) {
		if (!lvl) continue;
		let rfe = ['No Rate', `Rate`, `Feat`, `Epic`][lvl.cp];
		if (lvl.difficulty === 'Unrated') var lvlImg = config.emojis.na;
		else if (lvl.difficulty === 'Easy') var lvlImg = config.emojis.easy;
		else if (lvl.difficulty === 'Normal') var lvlImg = config.emojis.normal;
		else if (lvl.difficulty === 'Hard') var lvlImg = config.emojis.hard;
		else if (lvl.difficulty === 'Harder') var lvlImg = config.emojis.harder;
		else if (lvl.difficulty === 'Insane') var lvlImg = config.emojis.insane;
		else if (lvl.difficulty === 'Easy Demon') var lvlImg = config.emojis.easy_demon;
		else if (lvl.difficulty === 'Medium Demon') var lvlImg = config.emojis.medium_demon;
		else if (lvl.difficulty === 'Hard Demon') var lvlImg = config.emojis.hard_demon;
		else if (lvl.difficulty === 'Insane Demon') var lvlImg = config.emojis.insane_demon;
		else if (lvl.difficulty === 'Extreme Demon') var lvlImg = config.emojis.extreme_demon;
		let coinOut = '';
		for (i = 0; i < parseInt(lvl.coins); i++) coinOut += `${lvl.verifiedCoins ? config.emojis.coin_verified : config.emojis.coin_unverified} `;
		let title = [];
		let desc1 = [];
		let desc2 = [];
		let desc3 = [];
		if (lvl.songID.includes(' ')) var link = `\`${await tools.toLength(lvl.songID, 8)}\``;
		else var link = `[\`${await tools.toLength(lvl.songID, 8)}\`](https://www.newgrounds.com/audio/listen/${lvl.songID})`;
		title.push(`:id: \`${await tools.toLength(lvl.id, 8)}\``);
		title.push(`**__${lvl.name}__** by **${lvl.author === '-' ? '*Unregistered user*' : lvl.author}**`);
		desc1.push(`${config.emojis.length} \`${await tools.toLength(lvl.length, 8)}\``);
		desc1.push(`${lvl.disliked ? config.emojis.dislike : config.emojis.like} \`${await tools.toLength(lvl.likes, 8)}\``);
		desc1.push(`${config.emojis.download} \`${await tools.toLength(lvl.downloads, 8)}\``);
		desc2.push(`${config.emojis.newgrounds} ${link}`);
		desc2.push(`${config.emojis.music_note} __${await tools.cleanR(lvl.songName)}__ by ${lvl.songAuthor}`);
		desc3.push(`${lvlImg} \`${rfe} ${lvl.stars != 0 ? `${await tools.toLength(`${lvl.stars}*`, 3, 'right')}` : ''}\``);
		desc3.push(`${coinOut}`);
		embed.addField(`⠀`, `${title.join('⠀⠀')}\n${desc1.join('⠀⠀')}\n${desc2.join('⠀⠀')}\n${desc3.join('⠀⠀')}`);
	}
	return embed;
};

/**
 * Creates the icon set of a user
 * @param {object} profile The profile object
 * @returns {Discord.Attachment} The attachment containing their icons
 */
module.exports.createIcons = async profile => {
	return new Promise(async (resolve, reject) => {
		let gamemodes = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
		let canvas = C.createCanvas(gamemodes.length * 200, 200);
		let ctx = canvas.getContext('2d');
		for (i = 0; i < gamemodes.length; i++) {
			let img = await C.loadImage(`https://gdbrowser.com/icon/*?noUser&form=${gamemodes[i]}&icon=${profile[gamemodes[i]]}&col1=${profile.col1}&col2=${profile.col2}&glow=${profile.glow ? 1 : 0}`).catch(() => {
				resolve('error');
			});
			if (!img) return resolve('error');
			ctx.drawImage(img, i * 200 + (100 - img.width / 2), 100 - img.height / 2);
		}

		resolve(new Discord.Attachment(canvas.toBuffer(), `${profile.username.replace(' ', '-')}-Icon-Set.png`));
	});
};

/**
 * Creates one icon of a user
 * @param {object} profile The profile object
 * @param {string} type The type to create
 * @returns {Discord.Attachment} The attachment containing that icon
 */

// owo

module.exports.createIcon = async (profile, type) => {
	return new Promise(async (resolve, reject) => {
		if (type === 'icon') type = 'cube';
		if (type === 'bird') type = 'ufo';
		if (type === 'dart') type = 'wave';
		profile.cube = profile.icon;
		let icon = await C.loadImage(`https://gdbrowser.com/icon/*?noUser&form=${type}&icon=${profile[type]}&col1=${profile.col1}&col2=${profile.col2}&glow=${profile.glow ? 1 : 0}`).catch(() => {
			resolve('error');
		});
		if (!icon) return resolve('error');
		let canvas = C.createCanvas(icon.width, icon.height);
		let ctx = canvas.getContext('2d');
		ctx.drawImage(icon, 0, 0);

		resolve(new Discord.Attachment(canvas.toBuffer(), `${profile.username.replace(' ', '-')}-Icon.png`));
	});
};

module.exports.sha1 = async data => {
	return crypto
		.createHash('sha1')
		.update(data, 'binary')
		.digest('hex');
};
