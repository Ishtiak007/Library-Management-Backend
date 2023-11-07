const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


//libraryManagementSystem
//categories

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1bw0ez.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // 4 category related api collection
    const categoriesCollection = client.db('libraryManagementSystem').collection('categories');
    const booksCollection = client.db('libraryManagementSystem').collection('allBooks');


    //4 category related api
    app.get('/categories', async(req,res)=>{
        const cursor = categoriesCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });


    // all books related API
    app.post('/allBooks',async(req,res)=>{
        const newBooks = req.body;
        const result = await booksCollection.insertOne(newBooks);
        res.send(result);
    });
    app.get('/allBooks', async(req,res)=>{
        const cursor = booksCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });
    app.get('/allBooks/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await booksCollection.findOne(query);
        res.send(result);
    });
    app.put('/allBooks/:id',async(req,res)=>{
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)}
        const options = {upsert : true};
        const updatedBook = req.body;
        const newBook ={
            $set:{
                image : updatedBook.image,
                bookName : updatedBook.bookName,
                author : updatedBook.author,
                category : updatedBook.category,
                rating : updatedBook.rating,
            }
        }
        const result = await booksCollection.updateOne(filter,newBook, options)
        res.send(result);
    });




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB! Alhumdulilah!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/',(req,res)=>{
    res.send('Library management system server is running');
});
app.listen(port,()=>{
    console.log(`Library management system server is running on port ${port}`);
})