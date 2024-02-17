const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const databasePath = path.join(__dirname, "depo24chat.db");

let db = null;

const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: databasePath,
            driver: sqlite3.Database
        });

        // Create user and message tables in the SQLite3 database
        db.getDatabaseInstance().serialize(() => {
            db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)');
            db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
        });

        console.log('Database connected');

        // Middleware to parse JSON requests
        app.use(express.json());

        // Define routes and other middleware here...

    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit();
    }
}


initializeDbAndServer();

// Middleware to parse JSON requests
app.use(express.json());


// Validate username and password
function validateUsernameAndPassword(username, password) {
    if (!username || !password) {
        return { isValid: false, message: 'Username and password are required' };
    }
    if (username.length < 3 || username.length > 20) {
        return { isValid: false, message: 'Username must be between 3 and 20 characters long' };
    }
    if (password.length < 4 || password.length > 20) {
        return { isValid: false, message: 'Password must be between 4 and 20 characters long' };
    }
    return { isValid: true };
}

// Endpoint for user registration
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username or password is missing
        if (!username || !password) {
            res.status(400).send("Username or password is missing");
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        const selectUserQuery = `SELECT * FROM users WHERE username = '${username}';`;
        const databaseUser = await db.get(selectUserQuery);

        if (!databaseUser) {
            // User doesn't exist, proceed to create
            const createUserQuery = `
            INSERT INTO users(username, password)
            VALUES('${username}', '${hashedPassword}');`;
            
            if (validateUsernameAndPassword(username, password)) {
                db.run(createUserQuery);
                res.send("User created successfully");
            } else {
                res.status(400).send("Password or username is too short");
            }
        } else {
            res.status(400).send("User already exists");
        }
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Endpoint for fetching all users
app.get('/users', async (req, res) => {
    try {
        const users = await db.all('SELECT id, username FROM users');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Endpoint for user login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (!row) {
        return res.status(401).send('Invalid username or password');
      }
      const isPasswordValid = await bcrypt.compare(password, row.password);
      if (!isPasswordValid) {
        return res.status(401).send('Invalid username or password');
      }
      const token = jwt.sign({ username }, 'secret_key', { expiresIn: '2h' });
      res.json({ token });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging in');
  }
});

// Endpoint for joining the chat room
app.post('/join', authenticateToken, (req, res) => {
  try {
    // Get user information from request
    const { username } = req.user;

    // Broadcast a message to all clients that a new user has joined
    io.emit('userJoined', { username });

    res.status(200).send('Joined the chat room successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error joining the chat room');
  }
});

// Endpoint for sending messages
app.post('/send', authenticateToken, (req, res) => {
  try {
    // Get user information and message content from request
    const { username } = req.user;
    const { content } = req.body;

    // Save the message to the database
    db.run('INSERT INTO messages (sender, content) VALUES (?, ?)', [username, content], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error sending message');
      }

      // Broadcast the new message to all clients
      io.emit('newMessage', { sender: username, content });

      res.status(200).send('Message sent successfully');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending message');
  }
});

// Endpoint for retrieving chat history
app.get('/history', authenticateToken, (req, res) => {
  try {
    // Retrieve chat history from the database
    db.all('SELECT * FROM messages', (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error retrieving chat history');
      }
      res.json(rows);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving chat history');
  }
});

// Middleware to authenticate users
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.status(401).send('Unauthorized');
  }
  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      return res.status(403).send('Forbidden');
    }
    req.user = user;
    next();
  });
}

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get("/", (req,res) => {
    res.send("Hello World!!")
})

// Start the server
const PORT = 5002;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

