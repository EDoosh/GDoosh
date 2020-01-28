const fs = require('fs');
const rp = require('request-promise');
const jf = require('json-format');
const XOR = require('../../functions/XOR.js');
const gdtools = require('../../functions/gdFunctions.js');
const xor = new XOR();

// GDRepresentable - Password - LevelID - Rating (1 - Easy, 5 - Extreme)
rateDemon('EDoosh', 'password', '45319961', '3');

// 

async function rateDemon(un, ps, id, rate) {
	if (!rate) return console.log('reeeee');
	un = await gdtools.idAndUn(un);
	ps = xor.encrypt(ps, 37526);
	let form = {
		gameVersion: '21',
		binaryVersion: '35',
		gdw: '0',
		accountID: un[2],
		gjp: ps,
		levelID: id.toString(),
		rating: rate,
		secret: 'Wmfp3879gc3',
	};
	let resp = await rp({
		method: 'POST',
		uri: 'http://www.boomlings.com/database/rateGJDemon21.php',
		form: form,
	}).catch(() => console.log('Issue sending rate to servers.'));
	if (resp == '-1' || !resp) return console.log('error');
	console.log('Rated demon!');
}
