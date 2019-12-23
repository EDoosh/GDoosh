const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const config = JSON.parse(fs.readFileSync('./config.json'));
const loginData = JSON.parse(fs.readFileSync('./login.txt'));

const regData = {
	gameVersion: '21',
	binaryVersion: '35',
	secret: 'Wmfd2893gb7',
};

c();
async function c() {
	console.log(await a(0));
	console.log(await b());
}

async function a(page = 0) {
	let resp = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJMapPacks21.php', form: { page: page, /*gameVersion: regData.gameVersion, binaryVersion: regData.binaryVersion, gdw: "0", */ secret: regData.secret } });
	let mpU = resp.split('#')[0].split('|');
	let mappacks = await mpU.map(x => {
		let response = x.split('#')[0].split(':');
		let res = {};
		for (let i = 0; i < response.length; i += 2) {
			res[response[i]] = response[i + 1];
		}
		return res;
	});
	await mappacks.forEach(async (x, y) => {
		let keys = Object.keys(x);

		x.id = x[1];
		x.name = x[2];
		x.lvls = x[3];
		x.stars = x[4];
		x.coins = x[5];
		x.diff = x[6];
		x.colour = x[7];

		// https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
		var rgbToHex = rgb => {
			var hex = Number(rgb).toString(16);
			if (hex.length < 2) hex = '0' + hex;
			return hex;
		};
		var fullColorHex = (r, g, b) => {
			var red = rgbToHex(r);
			var green = rgbToHex(g);
			var blue = rgbToHex(b);
			return red + green + blue;
		};
		let xColSplit = x.colour.split(',');
		x.hex = fullColorHex(xColSplit[0], xColSplit[1], xColSplit[2]);

		keys.forEach(k => delete x[k]);
	});
	return mappacks;
}

async function b() {
	let resp = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJGauntlets21.php', form: { gameVersion: regData.gameVersion, binaryVersion: regData.binaryVersion, gdw: '0', secret: regData.secret } });
	let gauntletU = resp.split('#')[0].split('|');
	let gauntlets = await gauntletU.map(x => {
		let response = x.split('#')[0].split(':');
		let res = {};
		for (let i = 0; i < response.length; i += 2) {
			res[response[i]] = response[i + 1];
		}
		return res;
	});
	await gauntlets.forEach(async (x, y) => {
		let keys = Object.keys(x);

		x.id = x[1];
		x.lvls = x[3];

		keys.forEach(k => delete x[k]);
	});
	return gauntlets;
}
