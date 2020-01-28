const fs = require('fs');
const rp = require('request-promise');
const tools = require('../../functions/generalFunctions.js');
const gdtools = require('../../functions/gdFunctions.js');
const XOR = require('../../functions/XOR.js');
const xor = new XOR();
const crypto = require('crypto');
const config = JSON.parse(fs.readFileSync('./config.json'));
const loginData = JSON.parse(fs.readFileSync('./login.txt'));
const jf = require('json-format');

// ID   |   liked : recent   |   page #   |   count
// read('-5', 'liked', 0, 40);

// ID   |   username : accountID : playerID   |   password   |   text   |   percent
// write('59177988', 'EDoosh', 'password', 'Test.', 16);

// ID   |   username : accountID : playerID   |   password   |   commentID
// deleteC('59177988', 'EDoosh', 'password', '17141893');

async function read(id, m = 'liked', pg = 0, cnt = 40) {
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJComments21.php',
		form: {
			gameVersion: '21',
			binaryVersion: '35',
			page: pg.toString(),
			secret: 'Wmfd2893gb7',
			mode: m === 'liked' ? 1 : 0,
			levelID: id.toString(),
			count: parseInt(cnt),
		},
	});
	if (!resp || resp == '-1') return;
	let respInfo = resp.split(/\#/g)[1].split(/\:/g);
	comments = [
		{
			totalComments: parseInt(respInfo[0]),
			lowestCommentNumber: parseInt(respInfo[1]),
			perPage: parseInt(respInfo[2]),
			page: Math.ceil(parseInt(respInfo[1]) / parseInt(respInfo[2])) + 1,
			sortedBy: m === 'liked' ? 'like' : 'recent',
			id: id,
		},
	];
	let level = await gdtools.getLevel(id);
	let respSplit = resp.split(/\#/g)[0].split(/\|/g);
	if (!respSplit || !respSplit[0]) return;
	for (const r of respSplit) {
		let x = await gdtools.parseResponse(r.split(/\:/g)[0], '~'); // Comment data
		let z = await gdtools.parseResponse(r.split(/\:/g)[1], '~'); // Player data
		let content = xor.b64from(x[2]);
		let y = {
			author: z[1],
			playerId: x[3],
			accountId: z[16],
			contents: content.replace(/[★☆⍟]/g, ''),
			likes: parseInt(x[4]),
			time: x[9],
			percent: parseInt(x[10]),
			commentId: x[6],
			icon: parseInt(z[9]),
			form: parseInt(z[14]),
			col1: parseInt(z[10]),
			col2: parseInt(z[11]),
			// 1 for GDoosh, 2 for GDBrowser, 3 for owns level, 4 for rob, 5 for elder mod, 0 for loser regular GD user.
			special: content.endsWith('★') ? 1 : content.endsWith('⍟') || content.endsWith('☆') ? 2 : x[3] == level.authorID ? 3 : x[3] == 16 ? 4 : x[12] ? 5 : 0,
		};
		comments.push(y);
	}
	fs.writeFileSync('./code-examples/comments/commentsGet.txt', jf(comments));
}

async function write(id, un, ps, text, percent = 0) {
	if (!un || !ps || !text) return console.log(`You're missing some field here buster.`);
	if (text.length > 149) return console.log(`I wish you could post comments longer than 150 characters, but this is in-built to GD.`);
	percent = percent.toString();
	text = xor.b64to(text + '★');
	let pi = await gdtools.idAndUn(un);
	let chk = xor.encrypt(await gdtools.sha1(pi[0] + text + id + percent + '0xPT6iUrtws0J'), 29481);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		accountID: pi[2],
		gjp: xor.encrypt(ps, 37526),
		userName: pi[0],
		comment: text,
		secret: 'Wmfd2893gb7',
		levelID: id,
		percent: percent.toString(),
		chk: chk,
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/uploadGJComment21.php',
		form: form,
		headers: {
			'x-forwarded-for': '255.255.255.255',
		},
	});

	if (!resp) return console.log("The Geometry Dash servers returned an error! Perhaps they're down for maintenance");
	if (resp == '-1') return console.log('The Geometry Dash servers rejected your comment! Try again later, or make sure your username and password are entered correctly.');
	if (resp.startsWith('temp')) {
		let banStuff = resp.split('_');
		return console.log(`You have been banned from commenting for ${(parseInt(banStuff[1]) / 86400).toFixed(0)} days. Reason: ${banStuff[2] || 'None'}`);
	}
	console.log(resp);
	console.log('Posted comment successfully!');
}

async function deleteC(id, un, ps, cId) {
	if (!un || !ps || !cId) return console.log(`You're missing some field here buster.`);
	let pi = await gdtools.idAndUn(un);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: pi[2],
		gjp: xor.encrypt(ps, 37526),
		commentID: cId.toString(),
		secret: 'Wmfd2893gb7',
		levelID: id.toString(),
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/deleteGJComment20.php',
		form: form,
	});

	if (!resp) return console.log("The Geometry Dash servers returned an error! Perhaps they're down for maintenance");
	if (resp == '-1') return console.log('The Geometry Dash servers rejected your delete request! Try again later, or make sure your username and password are entered correctly.');
	console.log('Deleted comment successfully!');
	console.log(resp);
}
