const Discord = require('discord.js');
const db = require('quick.db');
const tools = require('../functions/generalFunctions.js');
const gdtools = require('../functions/gdFunctions.js');
const rp = require('request-promise');

module.exports.run = async (bot, message, args) => {
	if (isNaN(args[1]) || parseInt(args[1]) > 20) args[1] = 1;
	let fails = 0;
	for (i = 0; i < parseInt(args[1]); i++) {
		let resp = await rp({ method: 'POST', uri: 'http://boomlings.com/database/getGJUsers20.php', form: { str: 'EDoosh', secret: regData.secret } }).catch(() => {
			fails += 1;
			return '-2';
		});
		if (!resp || resp == '-1') fails += 1;
	}
	message.channel.send(`The Geometry Dash servers succeeded the database check ${parseInt(args[1]) - fails} / ${args[1]} times. It failed ${fails} times.`);
};

module.exports.config = {
	command: ['testservers', 'ts', 'tdb', 'testdatabase'],
	permlvl: 'Admin',
	help: ['Other', 'Check if the Geometry Dash servers are online.', 'Admin', '(number of requests)', 'Check if the Geometry Dash servers are online. Send a series of requests.'],
	helpg: '',
};
