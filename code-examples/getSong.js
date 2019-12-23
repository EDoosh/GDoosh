const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const gdtools = require('../functions/gdFunctions.js');

const regData = {
	gameVersion: '21',
	binaryVersion: '25',
	secret: 'Wmfd2893gb7',
};

a('1');

async function a(id) {
	fs.writeFileSync('./h.txt', util.inspect(await getSong(id), true, null, false));
	console.log('Finished');
}

async function getSong(level) {
	let song = {};
	let songRes = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJSongInfo.php', form: { songID: level.customSong, secret: regData.secret } });
	if (songRes != '-1') {
		let songData = await gdtools.parseResponse(songRes, '~|~');
		song.songName = songData[2] || 'Unknown';
		song.songAuthor = songData[4] || 'Unknown';
		song.songSize = (songData[5] || '0') + 'MB';
		song.songID = songData[1] || level.customSong;
		if (!songData[2]) song.invalidSong = true;
	} else {
		let foundSong = require('../functions/levels.json').music[level.officialSong] || { null: true };
		song.songName = foundSong[0] || 'Unknown';
		song.songAuthor = foundSong[1] || 'Unknown';
		song.songSize = '0MB';
		song.songID = 'Level ' + [level.officialSong];
	}
	return song;
}
