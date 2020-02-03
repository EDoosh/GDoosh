const fs = require('fs');
const rp = require('request-promise');
const util = require('util');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const XOR = require('../functions/XOR.js');
const xor = new XOR();
const crypto = require('crypto');
const config = JSON.parse(fs.readFileSync('./config.json'));
const loginData = JSON.parse(fs.readFileSync('./login.txt'));

a('a');
async function a(b) {
	console.log(xor.encrypt(b));
}

// {
// 	'1': 'EDoosh',			Username
// 	'2': '17615967',		playerID
// 	'3': '2402',			Stars at last refresh
// 	'4': '55',				Demons at last refresh
// 	'6': '',				Always blank
// 	'8': '0',				CP at last refresh
// 	'9': '62',				Icon at last refresh
// 	'10': '12',				Colour at last refresh
// 	'11': '12',				Colour at last refresh
// 	'13': '91',				SecretCoins at last refresh
// 	'14': '0',				Icon, ship, ball...
// 	'15': '0',						Rob, Vip, Hyperflame, prism, codex, fault
// 	'16': '5250844',		AccountID
// 	'17': '508'				UserCoins at last refresh
// }
