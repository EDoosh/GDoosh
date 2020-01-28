const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// GDRepresentable - Password - LevelID - Type (friends | weekly | top)
levelLeaderboard('EDoosh', 'password', '59208971', 'top');

async function levelLeaderboard(un, ps, id, tp = 'top') {
	if (!id) return console.log('a');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);

	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		levelID: id,
		secret: 'Wmfd2893gb7',
		type: tp === 'friends' ? '0' : tp === 'weekly' ? '2' : '1',
	};

	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJLevelScores211.php',
		form: form,
	});
	if (resp == '-1' || resp == '-01') return console.log('error');
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
	fs.writeFileSync('./code-examples/levels/levelLeaderboard.txt', jf(scores));
}
