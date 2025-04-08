const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

// Connection string from MongoDB Atlas
const uri =
  "mongodb+srv://01fe22bcs065:iamamarvelfan@cluster0.5alh5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Database and collection
const dbName = "authDB"; // Change this to your database name in Atlas
const collectionName = "users";

async function createUser(username, password) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(collectionName);

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.insertOne({ username, password: hashedPassword });

    console.log("User created successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function authenticateUser(username, password) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(collectionName);

    const user = await users.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    await client.close();
  }
}

module.exports = { createUser, authenticateUser };
