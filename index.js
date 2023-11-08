const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin : [
        // 'http://localhost:5173'
        'https://library-management-syste-e5864.web.app',
        'https://library-management-syste-e5864.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1bw0ez.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



// middlewares
const logger =(req,res,next)=>{
    console.log('log : info', req.method, req.url);
    next();
  }
  const verifyToken  = (req,res,next)=>{
    const token = req?.cookies?.token;
    // console.log('token in the middleware',token);
    if(!token){
      return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
      if(err){
        return res.status(401).send({message : 'unauthorize access'});
      }
      req.user = decoded;
      next();
    })   
}





async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // 4 category related api collection
    const categoriesCollection = client.db('libraryManagementSystem').collection('categories');
    const booksCollection = client.db('libraryManagementSystem').collection('allBooks');
    const bookBorrowerCollection = client.db('libraryManagementSystem').collection('bookBorrower');






    // JWT related api
    app.post('/jwt', logger , async(req,res)=>{
        const user = req.body;
        console.log('user for token', user);
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
        res
        .cookie('token',token,{
          httpOnly:true,
          secure:process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none':'strict'
        })
        .send({success : true});  
      });
      app.post('/logout',async(req,res)=>{
        const user = req.body;
        console.log('logging out user',user)
        res.clearCookie('token',{maxAge:0}).send({success: true})
      })







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

    // bookBorrower related API
    app.post('/bookBorrower',async(req,res)=>{
        const borrower = req.body;
        const result = await bookBorrowerCollection.insertOne(borrower);
        res.send(result);
    });
    app.get('/bookBorrower', logger , verifyToken, async (req,res)=>{
        console.log(req.query.email)
        console.log('token owner info',req.user);
        if(req.user.email !== req.query.email){
          return res.status(403).send({message :'forbidden access'})
        }
          let query = {}
          if(req.query?.email){
              query = {email : req.query.email}
          }
          const result = await bookBorrowerCollection.find(query).toArray();
          res.send(result);
      });
      app.delete('/bookBorrower/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await bookBorrowerCollection.deleteOne(query)
        res.send(result)
    })




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