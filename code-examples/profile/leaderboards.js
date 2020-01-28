const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

accurate();

// gd('star', 10000);

async function accurate() {
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
			fs.writeFileSync('./code-examples/profile/leaderboardAccurate.txt', jf(leaderboard));
		}
	});
}

async function gd(type, amount = 100) {
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
	fs.writeFileSync('./code-examples/profile/leaderboardGD.txt', jf(scores));
}
