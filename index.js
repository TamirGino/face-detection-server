const {MongoClient} = require('mongodb');

const express = require('express');
 const bodyParser = require('body-parser')
 const cors = require('cors');
 require('dotenv').config();

const app = express();
 app.use(bodyParser.json());
 app.use(cors());


    const uri = process.env.MONGODB_URI; 
    const client = new MongoClient(uri);
    client.connect((err) => {
        if (err) {
          console.error('Error connecting to MongoDB:', err);
        } else {
          console.log('Connected to MongoDB');
            }
      });
 

async function createUser(client, newUser) {
    const existingUser = await client.db("sbDatabase").collection("users").findOne({ email: newUser.email });

    if (existingUser) {
        // If a user with the same email already exists, return an appropriate response.
        throw new Error("User with this email already exists");
    }

    const result = await client.db("sbDatabase").collection("users").insertOne(newUser);
}

app.post('/register', async  (req,res) => {
    const { email, name, password } = req.body;

    try {
        await createUser(client, {
            name: name,
            email: email,
            password: password,
            entries: 0,
            joined: new Date(),
        });
        res.json({
            name: name,
            email: email,
            entries: 0,
            joined: new Date(),
        });
    } catch (error) {
        res.status(400).json( "error: unable to register" ); // Return an error response
    }
});


async function getUser(client, userDetails) {
    const projection = { password: 0 }; // Exclude the password field
    const result = await client.db("sbDatabase").collection("users").findOne(userDetails, { projection });
    return result; // Returns user data without the password
}

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await getUser(client, {
            email: email,
            password: password,
        });

        if (user) {
            res.status(200).json({ message: 'Sign-in successful', user });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

async function updateEntries(client, userDetails, updatedCount) {
    const result = await client.db("sbDatabase").collection("users").updateOne({email:userDetails}, {$set:{entries:updatedCount}});
    return result; 
    // Returns user data or null
}

app.put('/update_entries', async (req, res) => {
    const { email, entries } = req.body;
    try {
        const user = await updateEntries(client, 
            email,
            entries,
        );
        res.status(200).json({ message: 'updated successfuly'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/', function (req, res) {
    res.send('Server is Running');
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`app is running on port ${PORT}`);
})