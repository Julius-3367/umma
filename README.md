<div align="center">
  <h1 style="font-weight: 500; color: #1976d2; margin-bottom: 0.5em">Labour Mobility Management System</h1>
  <p style="font-size: 1.2em; color: #555; max-width: 800px; margin: 0 auto 2em;">
    A comprehensive full-stack web application for managing labour mobility processes including candidate registration, training, vetting, and placement.
  </p>
  
  <div style="display: flex; justify-content: center; gap: 1em; margin: 2em 0;">
    <a href="#getting-started" style="text-decoration: none;">
      <button style="background-color: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;">
        Get Started
      </button>
    </a>
    <a href="#features" style="text-decoration: none;">
      <button style="background-color: white; color: #1976d2; border: 1px solid #1976d2; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;">
        View Features
      </button>
    </a>
  </div>
</div>

## ✨ Features

### Core Functionality
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5em; margin: 1.5em 0;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="color: #1976d2; margin-top: 0;">Authentication & Authorization</h3>
    <p>Secure JWT-based authentication with role-based access control (RBAC)</p>
  </div>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="color: #1976d2; margin-top: 0;">User Management</h3>
    <p>Multi-role system with fine-grained permissions</p>
  </div>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="color: #1976d2; margin-top: 0;">Candidate Management</h3>
    <p>End-to-end candidate registration and tracking</p>
  </div>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="color: #1976d2; margin-top: 0;">Training System</h3>
    <p>Course management and progress tracking</p>
  </div>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="color: #1976d2; margin-top: 0;">Vetting Process</h3>
    <p>Compliance and qualification verification</p>
  </div>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5em; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h3 style="color: #1976d2; margin-top: 0;">Placement System</h3>
    <p>Efficient job matching and interview scheduling</p>
  </div>
</div>

## 🛠 Tech Stack

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5em; margin: 2em 0;">
  <div>
    <h3 style="color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.5em;">Frontend</h3>
    <ul style="list-style-type: none; padding: 0;">
      <li>• React.js with Vite</li>
      <li>• Material-UI (MUI) v5</li>
      <li>• React Router v6</li>
      <li>• Context API for state management</li>
      <li>• Axios for API requests</li>
    </ul>
  </div>
  <div>
    <h3 style="color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.5em;">Backend</h3>
    <ul style="list-style-type: none; padding: 0;">
      <li>• Node.js with Express</li>
      <li>• Prisma ORM</li>
      <li>• MariaDB Database</li>
      <li>• JWT Authentication</li>
      <li>• Swagger/OpenAPI Documentation</li>
    </ul>
  </div>
</div>

## 🏗 Project Structure

```
labour-mobility/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── prisma/             # Database schema & migrations
│   └── uploads/            # File storage
└── frontend/               # React.js SPA
    ├── src/
    │   ├── api/           # API client setup
    │   ├── assets/        # Static assets
    │   ├── components/    # Reusable UI components
    │   ├── context/       # React Context providers
    │   ├── pages/         # Page components
    │   └── theme/         # MUI theme configuration
    └── public/            # Public assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MariaDB (v10.3+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kemboi14/UMSL.git
   cd UMSL
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   npx prisma migrate dev
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:5000/api-docs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## 📧 Contact

For any questions or feedback, please contact us at [your-email@example.com](mailto:your-email@example.com).

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MariaDB with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Validation**: Joi
- **File Uploads**: Multer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React.js 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: Context API
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios
- **Icons**: Heroicons
- **Charts**: Recharts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MariaDB 10.6+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Backend will be available at `http://localhost:5000`
   API Documentation at `http://localhost:5000/api-docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

## 👥 User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- All reports and analytics

### Trainer
- Course management
- Candidate enrollment
- Attendance tracking
- Assessment management

### Candidate
- Profile management
- Document uploads
- Progress tracking
- Application status

### Agent
- Candidate registration
- Document verification
- Placement coordination

### Broker
- Candidate referrals
- Commission tracking
- Referral management

### Recruiter (Employer)
- Candidate shortlisting
- Job posting
- Interview scheduling
- Placement management

## 🔐 Default Credentials

After running the seed script, you can login with:

- **Admin**: `admin@labourmobility.com` / `admin123`
- **Trainer**: `trainer@labourmobility.com` / `trainer123`

## 📊 Database Schema

### Core Tables
- **Users**: User accounts with role-based access
- **Roles**: Permission definitions
- **Sessions**: JWT refresh token management
- **ActivityLogs**: System audit trail

### Future Tables (Phase 3+)
- **Candidates**: Candidate profiles and documents
- **Courses**: Training programs and schedules
- **Enrollments**: Course registrations
- **Placements**: Job placements and tracking
- **Vetting**: Medical, police, and interview records

## 🚀 Development Workflow

### Phase 1: Backend Foundation ✅
- [x] Node.js + Express setup
- [x] Prisma ORM with MariaDB
- [x] JWT authentication system
- [x] Role-based access control
- [x] Swagger API documentation

### Phase 2: Frontend Foundation ✅
- [x] React + Vite setup
- [x] TailwindCSS styling
- [x] React Router navigation
- [x] Zustand state management
- [x] Protected routes

### Phase 3: Core Modules (Next)
- [ ] Candidate Management
- [ ] Course & Training System
- [ ] Vetting Process
- [ ] Placement System
- [ ] Agent/Broker Management

### Phase 4: Advanced Features
- [ ] Dashboard Analytics
- [ ] Report Generation
- [ ] File Management
- [ ] Notification System

### Phase 5: Deployment
- [ ] Docker Configuration
- [ ] Nginx Setup
- [ ] SSL Certificates
- [ ] Production Deployment

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Health Check
- `GET /health` - System health status

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL="mysql://username:password@localhost:3306/labour_mobility_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
PORT=5000
NODE_ENV="development"
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Labour Mobility Management System
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Production Deployment

### Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Start backend: `npm start`
3. Configure reverse proxy (Nginx)
4. Setup SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api-docs`

---

**Built with ❤️ for Labour Mobility Management**
