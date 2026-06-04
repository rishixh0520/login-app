# LoginApp

A full-stack login application with user authentication, featuring a React frontend and Node.js/Express backend with PostgreSQL database.

## Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **Password Hashing**: Bcrypt-based password encryption for security
- **File Upload**: Support for user profile picture uploads
- **CORS Enabled**: Cross-origin resource sharing configured for frontend-backend communication
- **Modern UI**: Built with React and Vite for fast development and optimized builds
- **Database**: PostgreSQL integration for persistent data storage
- **Apply for leave**: admin approves or denies the request.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt
- **File Handling**: Multer
- **Development**: Nodemon for auto-reload

### Frontend
- **Library**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: CSS

## Project Structure

```
LoginApp/
├── backend/
│   ├── config/        # Database configuration
│   ├── middleware/    # Auth middleware
│   ├── routes/        # API endpoints
│   ├── uploads/       # User file uploads directory
│   ├── server.js      # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/           # React source files
│   ├── dist/          # Production build output
│   ├── index.html     # HTML entry point
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/rishixh0520/login-app.git
cd login-app
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loginapp_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

Initialize the database:
```bash
npm run dev
# The database will be initialized on first run
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### Running the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend server will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Building for Production

#### Build Frontend
```bash
cd frontend
npm run build
```
The optimized build will be in the `dist/` directory.

#### Start Production Server
```bash
cd backend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and get JWT token
- `POST /api/auth/logout` - Logout user

### User Profile
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile (requires auth)
- `POST /api/user/upload` - Upload profile picture (requires auth)

## Environment Variables

### Backend
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT signing
- `PORT` - Server port (default: 5000)

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt before storage
- **JWT Authentication**: Secure token-based authentication
- **CORS**: Configured to allow requests from frontend domain only
- **File Upload Validation**: Uploaded files are validated and stored securely

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

## Author

**Rishi Dhakad** - rishixh0520@gmail.com

---

For more information, visit the [GitHub repository](https://github.com/rishixh0520/login-app)
