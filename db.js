const sqlite3 = require("sqlite3");
const Promise = require("bluebird");
const { some, resolve } = require("bluebird");

class db {
	constructor() {
		this.run = (query, params = []) =>
			new Promise((resolve, reject) => {
				this.db.run(query, params, (err) => {
					if (err) {
						console.log("Error running sql: " + query);
						reject(err);
					} else {
						resolve();
					}
				});
			});
		this.all = (query, params = []) =>
			new Promise((resolve, reject) => {
				this.db.all(query, params, (err, rows) => {
					if (err) {
						console.log("Error running sql: " + query);
						reject(err);
					} else {
						resolve(rows);
					}
				});
			});

		//connect to DB
		this.connectDB = (dbPath) => {
			this.db = new sqlite3.Database(dbPath, (err) => {
				if (err) {
					console.log("Could not connect to DB");
					console.log(err.message);
				} else {
					console.log("DB connection successful");
				}
			});
		};

		//create Tables in empty DB file
		this.createTables = (db) => {
			console.log("Creating Tables");
			const queryGroups = `
				CREATE TABLE IF NOT EXISTS groups (
				group_id varchar(255) PRIMARY KEY,
				warning_msg varchar(1000) NOT NULL
			);`;
			const queryWords = `
				CREATE TABLE IF NOT EXISTS words (
				word varchar(255) NOT NULL,
				group_id varchar(255) NOT NULL,
				action char(1) NOT NULL,
				PRIMARY KEY (word, group_id),
				FOREIGN KEY (group_id) REFERENCES groups(group_id)
				);
			);`;
			return this.run(queryGroups)
				.then(() => {
					this.run(queryWords).then(() =>
						console.log("Created Tables Successfully")
					);
				})
				.catch((err) => {
					throw err;
				});
		};
	}

	initDB(dbPath) {
		console.log("Initializing DB");
		this.connectDB(dbPath);
		return new Promise((resolve, reject) => {
			if (this.db) {
				this.createTables(this.db).then(() => {
					resolve(this);
				});
			}
		});
	}
	addGroup(groupId, warningMsg) {
		const addGroupQuery = `
			INSERT INTO groups (group_id, warning_msg) 
			VALUES ('${groupId}', '${warningMsg}');
		`;
		return this.run(addGroupQuery);
	}
	deleteGroup(groupId) {
		const deleteGroupQuery = `
			DELETE FROM groups WHERE group_id = '${groupId}';
		`;
		return this.run(deleteGroupQuery);
	}
	addWord(word, groupId, action) {
		const addWordQuery = `
            INSERT OR IGNORE INTO words ( word, group_id, action)
			VALUES ('${word}', '${groupId}', '${action}');
        `;
		return this.run(addWordQuery);
	}
	addWords(words, groupId, action) {
		const addWordsQuery = `
		INSERT OR IGNORE INTO words (word, group_id, action)
		VALUES 
		${words.map((word) => `('${word}', '${groupId}', '${action}')`).join(", ")}
		`;
		return this.run(addWordsQuery);
	}

	deleteWord(word, groupId) {
		const removeWordQuery = `DELETE FROM words WHERE word ='${word}' AND group_id = '${groupId}';`;
		return this.run(removeWordQuery);
	}

	getGroupWords(groupId) {
		return new Promise((resolve, reject) => {
			const getGroupWordsQueryW = `SELECT word FROM words WHERE group_id = '${groupId}' AND action = 'W'`;
			const getGroupWordsQueryD = `SELECT word FROM words WHERE group_id = '${groupId}' AND action = 'D'`;
			const getGroupWordsQueryR = `SELECT word FROM words WHERE group_id = '${groupId}' AND action = 'R'`;
			const getGroupWordsQueryB = `SELECT word FROM words WHERE group_id = '${groupId}' AND action = 'B'`;

			Promise.all([
				this.all(getGroupWordsQueryW),
				this.all(getGroupWordsQueryD),
				this.all(getGroupWordsQueryR),
				this.all(getGroupWordsQueryB),
			]).then((arr) => {
				resolve({
					W: arr[0].map((obj) => obj.word),
					D: arr[1].map((obj) => obj.word),
					R: arr[2].map((obj) => obj.word),
					B: arr[3].map((obj) => obj.word),
				});
			});
		});
	}

	updateWarningMsg(groupId, newMsg) {
		const query = `
			UPDATE groups
			SET warning_msg = '${newMsg}' 
			WHERE group_id = '${groupId}';
		`;
		return this.run(query);
	}

	getWarningMsg(groupId) {
		const query = `SELECT warning_msg FROM groups WHERE group_id = '${groupId}'`;
		return new Promise((resolve, reject) => {
			this.all(query).then((rows) => {
				resolve(rows[0].warning_msg);
			});
		});
	}
}

module.exports = db;
