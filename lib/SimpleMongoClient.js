const MongoClient = require("mongodb").MongoClient;

class SimpleMongoClient {
	constructor(url, db, collection) {
		this.url = url;
		this.db = db;
		this.collection = collection;
	}
	
	async forDB(callback, forCollection = false) {
		let client = null;
		let result = null;
		
		try {
			client = new MongoClient(this.url, { useUnifiedTopology: true });
			await client.connect();
			
			if(typeof callback == "function") {
				const db = client.db(this.db);
				
				if(forCollection) {
					result = await callback(db.collection(this.collection));
					
					if(result != null && typeof result.toArray === "function") {
						result = await result.toArray();
					}
				} else {
					result = await callback(db);
				}
			}
		} catch(err) {
			console.error(err);
		} finally {
			if(client != null && typeof client.close === "function") {
				await client.close();
			}
		}
		
		return result;
	}
	
	forCollection(callback) {
		return this.forDB(callback, true);
	}

	doNothing() {
		return this.forDB();
	}
	
	find(search, projection, sort) {
		return this.forCollection(collection => {
			return collection.find(search, projection).sort(sort);
		});
	}
	
	findOne(search, projection) {
		return this.forCollection(collection => {
			return collection.findOne(search, projection);
		});
	}
	
	insert(what, options) {
		return this.forCollection(collection => {
			if(Array.isArray(what)) {
				return collection.insertMany(what, options);
			}
			return collection.insertOne(what, options);
		});
	}
	
	update(what, how, options = {}) {
		options.upsert = false;
		
		return this.forCollection(collection => {
			if(options && options.multi) {
				return collection.updateMany(what, how, options);
			} else {
				return collection.updateOne(what, how, options);
			}
		});
	}
}

module.exports = SimpleMongoClient;