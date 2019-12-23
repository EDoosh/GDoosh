const canvas = require('canvas');
const fs = require('fs');

aa();

async function aa() {
	for (i = 0; i < 2; i++) {
		for (j = 0; j < 3; j++) {
			for (k = 0; k < 14; k++) {
				await af(['Daily', 'Weekly'][i], ['Rated', 'Featured', 'Epic'][j], k);
			}
		}
	}
}

async function af(dw, type, id) {
	return new Promise((resolve, reject) => {
		const canv = canvas.createCanvas(194, 304);
		const ctx = canv.getContext('2d');
		canvas.loadImage(`./Images/Rated/${type}/${id}.png`).then(image => {
			ctx.drawImage(image, 0, 0);
			canvas.loadImage(`./Images/Other/${dw} Slant.png`).then(img2 => {
				ctx.drawImage(img2, 44, 5, 126, 92);
				let writeAs = fs.createWriteStream(`./Images/${dw}/${type}/${id}.png`);
				canv.createPNGStream().pipe(writeAs);
				writeAs.on('finish', () => {
					console.log(`Finished creating ${dw} ${type} ${id}.`);
					resolve();
				});
			});
		});
	});
}
