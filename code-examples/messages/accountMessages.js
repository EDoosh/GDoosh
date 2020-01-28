// Post message
// Read message
// Delete message

const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// post('EDoosh', 'password', "This is a test of GDoosh's Account Message system.");
// read('EDoosh', 0);
del('EDoosh', 'password', '16894277');

async function post(un, ps, content) {
	if (!content) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		userName: un[0],
		secret: 'Wmfd2893gb7',
		cType: '1',
	};
	form.comment = xor
		.b64to(content.slice(0, 189) + '★')
		.replace(/\//g, '_')
		.replace(/\+/g, '-');
	let chk = form.userName + form.comment + '1xPT6iUrtws0J';
	chk = gdtools.sha1(chk);
	chk = xor.encrypt(chk, 29481);
	form.chk = chk;
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/uploadGJAccComment20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log(resp);
	console.log('Successfully posted comment.');
}

async function read(un, page = 0) {
	if (!un) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		page: page,
		secret: 'Wmfd2893gb7',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/getGJAccountComments20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	let split = resp.split(/\#/)[0].split(/\|/);
	let pgInfo = resp.split(/\#/)[1].split(/\:/);
	let format = [
		{
			total: pgInfo[0],
			page: pgInfo[1] / 10,
		},
	];
	for (i = 0; i < split.length; i++) {
		let x = await gdtools.parseResponse(split[i], '~');
		let y = {};
		y.commentId = x[6];
		y.content = xor.b64from(x[2]);
		y.likes = x[4];
		y.time = x[9];
		format.push(y);
	}
	fs.writeFileSync('./code-examples/messages/accountMessagesRead.txt', jf(format));
}

async function del(un, ps, id) {
	if (!id) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		commentID: id,
		secret: 'Wmfd2893gb7',
		cType: '1',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/deleteGJAccComment20.php',
		form: form,
	});
	if (resp == '-1') return console.log('error');
	console.log(resp);
	console.log('Successfully deleted comment.');
}
