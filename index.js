const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://@cluster0.5alh5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function connectToAtlas() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const db = client.db("testDB");
    const collection = db.collection("users");

    // Example CRUD operation
    await collection.insertOne({ name: "Alice", age: 25 });
    const users = await collection.find().toArray();
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

connectToAtlas();
