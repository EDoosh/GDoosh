const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const tools = require('../../functions/generalFunctions.js');
const gdtools = require('../../functions/gdFunctions.js');
const XOR = require('../../functions/XOR.js');
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

// Stolen from Colon again lmao. https://github.com/GDColon/GDBrowser/blob/master/api/download.js
//                               https://github.com/GDColon/GDBrowser/blob/master/api/level.js

const regData = {
	gameVersion: '21',
	binaryVersion: '25',
	secret: 'Wmfd2893gb7',
};

a('2376703', true, false);
a('31645500', true, false);
a('1244147', true, false);
a('58722297', true, false);

async function a(id, download = false, data = false) {
	fs.writeFileSync('./h.txt', util.inspect(await getLevel(id, download, data), true, null, false));
	console.log('Finished');
}

async function getLevel(id, download = false, data = false) {
	if (download || id === 'daily' || id === 'weekly') return await downloadLevel(id, data);
	else return await retrieveLevel(id);
}

async function downloadLevel(id, data) {
	let levelID = id;
	if (levelID == 'daily') levelID = -1;
	else if (levelID == 'weekly') levelID = -2;
	else levelID = levelID.replace(/[^0-9]/g, '');

	let body = await rp({ method: 'POST', uri: 'http://boomlings.com/database/downloadGJLevel22.php', form: { levelID, secret: regData.secret } });
	if (!body || body == '-1') return console.log('Issue retrieving level data.');

	let levelInfo = await gdtools.parseResponse(body);
	let level = await formatData(levelInfo);

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

	let b2 = await gdtools.idAndUn(level.authorID);
	if (b2) {
		level.author = b2[0];
		level.accountID = b2[2];
	} else {
		level.author = '-';
		level.accountID = '0';
	}

	let songData = await gdtools.getSong(level);
	level.songName = songData.name;
	level.songAuthor = songData.author;
	level.songSize = songData.size;
	level.songID = songData.id;
	level.invalidSong = songData.invalid;

	if (data === true) level.data = levelInfo[4];

	return level;
}

async function retrieveLevel(id) {
	let levelID = id.replace(/[^0-9]/g, '');

	let body = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJLevels21.php', form: { str: levelID, secret: regData.secret, type: 0 } });
	if (!body || body == '-1') return '-1';

	let preRes = body.split('#')[0].split('|', 10);
	let author = body
		.split('#')[1]
		.split('|')[0]
		.split(':');
	let song = '~' + body.split('#')[2];
	song = await gdtools.parseResponse(song, '~|~');

	let levelInfo = await gdtools.parseResponse(preRes[0]);
	let level = await formatData(levelInfo);
	if (author[1]) level.author = author[1];
	if (author[2]) level.accountID = author[2];

	if (song[2]) {
		level.songName = song[2] || 'Unknown';
		level.songAuthor = song[4] || 'Unknown';
		level.songSize = (song[5] || '0') + 'MB';
		level.songID = song[1] || level.customSong;
	} else {
		let foundSong = require('../functions/level.json').music[parseInt(levelInfo[12]) + 1] || { null: true };
		level.songName = foundSong[0] || 'Unknown';
		level.songAuthor = foundSong[1] || 'Unknown';
		level.songSize = '0MB';
		level.songID = 'Level ' + [parseInt(levelInfo[12]) + 1];
	}

	return level;
}

async function formatData(levelInfo) {
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
}
