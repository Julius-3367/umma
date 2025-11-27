const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const authGoogleRoutes = require('./routes/authGoogle');
const candidateRoutes = require('./routes/candidateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const messageRoutes = require('./routes/messageRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import database and services
const prisma = require('./config/database');
const { createActivityLog } = require('./services/activityLogService');
const { generateTokenPair } = require('./config/jwt');

const app = express();

// Security middleware
// app.use(helmet());

// CORS configuration
if (process.env.NODE_ENV === 'production') {
  // In production lock to the configured frontend URL
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://your-production-frontend.example.com',
    credentials: true,
  }));
} else {
  // In development reflect the request origin so local dev servers on different ports work without changing env vars.
  app.use(cors({
    origin: (origin, callback) => {
      // allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  }));
}

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   }
// });

// app.use('/api/', limiter);

// Logging middleware
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Cookie parser middleware
app.use(cookieParser());

// Configure Google OAuth Strategy (only if credentials are provided)
if (false && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
          include: { role: true }
        });

        if (!user) {
          // Auto-create user with CANDIDATE role
          const candidateRole = await prisma.role.findUnique({
            where: { name: 'Candidate' }
          });

          if (!candidateRole) {
            return done(new Error('Candidate role not found'), null);
          }

          user = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              roleId: candidateRole.id,
              isActive: true
            },
            include: { role: true }
          });

          // Log activity
          await createActivityLog({
            userId: user.id,
            action: 'USER_REGISTERED_GOOGLE',
            resource: 'User',
            details: { email, provider: 'google' }
          });
        } else {
          // Log login activity
          await createActivityLog({
            userId: user.id,
            action: 'USER_LOGIN_GOOGLE',
            resource: 'Auth',
            details: { email, provider: 'google' }
          });
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
} else {
  console.log('⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not provided');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Passport middleware
// app.use(passport.initialize());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Labour Mobility Management System API',
      version: '1.0.0',
      description: 'API documentation for the Labour Mobility Management System',
      contact: {
        name: 'Labour Mobility Team',
        email: 'support@labourmobility.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://api.labourmobility.com'
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Labour Mobility API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Labour Mobility API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', authGoogleRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/support-tickets', supportTicketRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Labour Mobility Management System API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
