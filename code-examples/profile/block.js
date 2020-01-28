const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// GDRepresentable - Password - GDRepresentable
// block('EDoosh', 'password', 'a2go');
unblock('EDoosh', 'password', 'a2go');

// GDRepresentable - Password
// blockedUsers('EDoosh', 'password');

async function block(un, ps, un2) {
	if (!un2) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	un2 = await gdtools.idAndUn(un2);
	ps = xor.encrypt(ps, 37526);

	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		targetAccountID: un2[2],
		gjp: ps,
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/blockGJUser20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log('Blocked user!');
}

async function unblock(un, ps, un2) {
	if (!un2) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	un2 = await gdtools.idAndUn(un2);
	ps = xor.encrypt(ps, 37526);

	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		targetAccountID: un2[2],
		gjp: ps,
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/unblockGJUser20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log('Unblocked user!');
}

async function blockedUsers(un, ps) {
	if (!ps) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);

	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		type: '1',
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJUserList20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	let split = resp.split(/\#/)[0].split(/\|/);
	let format = [
		{
			total: split.length,
		},
	];
	for (i = 0; i < split.length; i++) {
		let x = await gdtools.parseResponse(split[i], ':');
		let y = {};
		y.username = x[1];
		y.playerId = x[2];
		y.accountId = x[16];
		y.icon = x[9]; // The icon of the form chosen.
		y.col1 = x[10];
		y.col2 = x[11];
		y.form = x[14];
		y[15] = x[15]; // idk
		y[18] = x[18]; // same for this
		format.push(y);
	}
	fs.writeFileSync('./code-examples/profile/allBlocked.txt', jf(format));
}
