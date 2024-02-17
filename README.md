----Node.js Chat Application----

-This is a real-time chat application built with Node.js, Express.js, Socket.io, and SQLite. It allows users to join chat rooms, send messages, and view chat history.



----Features----

-Real-time Messaging: Utilizes WebSocket protocol with Socket.io for instant messaging between clients and the server.

-User Authentication: Implements user registration and login functionalities with bcrypt for password hashing and JWT for authentication tokens.

-Persistent Storage: Stores user information and chat messages persistently using SQLite database.

-Chat History: Users can retrieve chat history to view previous messages.

-Typing Indicator: Shows a "typing" indicator when a user is typing a message, without refreshing the browser.



----Installation----

-Clone the repository: git clone https://github.com/your-username/nodejs-chat-app.git
-Navigate to the project directory: cd nodejs-chat-app
-Install dependencies: npm install
-Start the server: npm start
-Access the application at http://localhost:5002 in your web browser.



----Usage----
-Register a new account by providing a username and password.
-Log in using your registered username and password.
-Join a chat room to start sending and receiving messages.
-Access chat history to view previous messages.
-Start typing a message to see the typing indicator in real-time.



----Technologies Used----
-Node.js: Backend JavaScript runtime environment.
-Express.js: Web application framework for Node.js.
-Socket.io: Library for real-time bidirectional event-based communication.
-SQLite: Embedded SQL database engine.
-bcrypt: Library for password hashing.
-JWT (JSON Web Tokens): Standard for creating access tokens.




----Contributing----
-Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request.

