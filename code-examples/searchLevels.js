const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const config = JSON.parse(fs.readFileSync('./config.json'));
const loginData = JSON.parse(fs.readFileSync('./login.txt'));

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//            ******** **********   *******   **       ******** ****     **             //
//           **////// /////**///   **/////** /**      /**///// /**/**   /**             //
//          /**           /**     **     //**/**      /**      /**//**  /**             //
//          /*********    /**    /**      /**/**      /******* /** //** /**             //
//          ////////**    /**    /**      /**/**      /**////  /**  //**/**             //
//                 /**    /**    //**     ** /**      /**      /**   //****             //
//           ********     /**     //*******  /********/********/**    //***             //
//          ////////      //       ///////   //////// //////// //      ///              //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// Stolen from Colon again lmao. https://github.com/GDColon/GDBrowser/blob/master/api/search.js

// params

// difficulty       1-5: Easy to insane, multiple can be selected (separate with commas)
//                  -2: Demon (use demonFilter for a specific difficulty)
//                  -3: Auto
//                  -1: N/A
// demonType        The difficulty of demon to return. Must have -2 for difficulty
//                  1 - Easy ... 5 - Extreme
// page             The page to search on.
//                  DEFAULT = 0
// gauntlet         Will return all 5 levels info.
//                  Fire - 0, Ice - 1, ...
// length           Only return levels which have this length.
//                  0 - Tiny ... 4 - XL
// songID           The songID to have.
//                  2-21 for official levels
//                  songID + customSong parameter for custom songs.

// type             All of these will ignore search queries
//                  Filters allowed - mostdownloaded, mostliked, trending, recent, awarded
//                  Fillter ignored - featured, magic, halloffame

// The following need to just be in there. They do not need a specific value after them.
// epic             Whether the level must be epic
// featured         Whether the level must be featured
// starred          Whether the level must be rated
// noStar           Whether the level must not be rated
// originalOnly     Whether the level must be original
// twoPlayer        Whether the level must have 2 player mode enabled (Each side of the screen controls different players)
// coins            Whether the level must have coins
// customSong       Whether the level must have a custom song, as defined in songID
// user             Whether it must return the users level. Search must be a playerID
// mappack          Whether it must return the levels in the mappack. Search must be a mappackName

const levels = require('../functions/levels.json').music;
const mapPacks = require('../functions/mappacks.json');

const regData = {
	gameVersion: '21',
	binaryVersion: '25',
	secret: 'Wmfd2893gb7',
};

a('Stereo Madness');

async function a(search) {
	fs.writeFileSync('./h.txt', util.inspect(await getLevel(search), true, null, false));
}

async function getLevel(search, params = {}) {
	// Create the initial filter
	let filters = {
		str: search,
		diff: params.difficulty,
		demonFilter: params.demonType,
		page: params.page || 0,
		gauntlet: params.gauntlet || 0,
		len: params.length,
		song: params.songID,

		epic: params.hasOwnProperty('epic') ? 1 : 0,
		featured: params.hasOwnProperty('featured') ? 1 : 0,
		star: params.hasOwnProperty('starred') ? 1 : 0,
		noStar: params.hasOwnProperty('noStar') ? 1 : 0,
		originalOnly: params.hasOwnProperty('original') ? 1 : 0,
		twoPlayer: params.hasOwnProperty('twoPlayer') ? 1 : 0,
		coins: params.hasOwnProperty('coins') ? 1 : 0,
		customSong: params.hasOwnProperty('customSong') ? 1 : 0,

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
	if (params.type) {
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
		if (!search.match(/^[0-9]*$/)) return this.getLevel(await gdtools.idAndUn(search)[2], filters);
	}
	// If you're searching for anything, just delete the search string from filters.
	if (search === '*') delete filters.str;

	// Request the contents
	const body = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJLevels21.php', form: filters });
	if (!body || body == '-1') return res.send('-1');
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

		x = Object.assign(x, await gdtools.formatLevel(x));
		x.author = authorList[x[6]] ? authorList[x[6]][0] : '-';
		x.accountID = authorList[x[6]] ? authorList[x[6]][1] : '0';

		let songSearch = songs.find(y => y['~1'] == x[35]);
		if (songSearch) {
			x.songName = songSearch[2] || 'Unknown';
			x.songAuthor = songSearch[4] || 'Unknown';
			x.songSize = (songSearch[5] || '0') + 'MB';
			x.songID = songSearch[1] || x.customSong;
		} else {
			let foundSong = require('../functions/levels.json').music[parseInt(x[12]) + 1] || { null: true };
			x.songName = foundSong[0] || 'Unknown';
			x.songAuthor = foundSong[1] || 'Unknown';
			x.songSize = '0MB';
			x.songID = 'Level ' + [parseInt(x[12]) + 1];
		}

		keys.forEach(k => delete x[k]);
	});

	return levelArray;
}
