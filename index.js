const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fuzpdm8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("bistroDb");
        const userCollection = database.collection("users");
        const menuCollection = database.collection("menu");
        const reviewCollection = database.collection("reviews");
        const cartCollection = database.collection("carts");

        // JWT related API
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = await jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: "1h",
                }
            );
            res.send({ token });
        });

        // middlewares
        // const verifyToken = (req, res, next) => {
        //     if (!req.headers.authorization) {
        //         return res.status(401).send({ message: "forbidden access" });
        //     }
        //     const token = req.headers.authorization.split(" ")[1];
        //     console.log("Backend: ", token);

        //     jwt.verify(
        //         token,
        //         process.env.ACCESS_TOKEN_SECRET,
        //         (error, decoded) => {
        //             if (error) {
        //                 return res
        //                     .status(401)
        //                     .send({ message: "unauthorized" });
        //             }

        //             req.decoded = decoded;
        //             next();
        //         }
        //     );
        // };

        // User related API
        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });
        app.post("/users", async (req, res) => {
            const user = req.body;

            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({
                    message: "user already exists",
                    insertedId: null,
                });
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get("/users/admin/:id", async (req, res) => {
            const email = req.params.id;
            // if (email !== req.decoded.email) {
            //     return res.status(401).send({ message: "unauthorized access" });
            // }

            const query = { email: email };
            const user = await userCollection.findOne(query);

            let admin = false;

            if (user) {
                admin = user?.role === "admin";
            }

            res.send({ admin });
        });

        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: "admin",
                },
            };
            const result = userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        // Menu
        app.get("/menu", async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        });

        app.post("/menu", async (req, res) => {
            const item = req.body;
            const result = await menuCollection.insertOne(item);
            res.send(result);
        });

        app.delete("/menu/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            console.log(query);
            const result = await menuCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        });

        // Reviews
        app.get("/reviews", async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });

        // Carts collection
        app.get("/carts", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };

            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });

        app.post("/carts", async (req, res) => {
            const cartItem = req.body;
            const result = await cartCollection.insertOne(cartItem);
            res.send(result);
        });

        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };

            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Bistro Boss is running!");
});

app.listen(port, () => {
    console.log("Bistro Boss is running on PORT:", port);
});
