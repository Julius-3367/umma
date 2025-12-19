import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBriefcase,
  FaGraduationCap,
  FaChartLine,
  FaUserTie,
  FaGlobe,
  FaArrowRight,
  FaCheck,
  FaUsers,
  FaHandshake,
  FaGlobeAmericas,
  FaMobileAlt,
  FaBuilding,
  FaUserCheck,
  FaSearchDollar,
  FaShieldAlt,
  FaComments
} from 'react-icons/fa';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Box, Button, Container, Typography, Grid, Paper, useTheme, Stack, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authThunks';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  LocationOn,
  Phone,
  Email
} from '@mui/icons-material';

// Styled Components
const HeroSection = styled('section')(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  padding: '8rem 0',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100px',
    background: `linear-gradient(to bottom right, transparent 49%, ${theme.palette.background.default} 50%)`,
  },
  [theme.breakpoints.down('md')]: {
    padding: '6rem 0',
  },
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatCard = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  '& .stat-number': {
    fontSize: '3rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  '& .stat-label': {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '0.875rem',
  },
}));

const Footer = styled('footer')(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  padding: theme.spacing(8, 0, 4),
  marginTop: 'auto',
  '& a': {
    color: theme.palette.grey[300],
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  '& .footer-section': {
    marginBottom: theme.spacing(4),
  },
  '& .footer-title': {
    color: theme.palette.common.white,
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    fontSize: '1.1rem',
    position: 'relative',
    paddingBottom: theme.spacing(1),
    '&:after': {
      content: '""',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '50px',
      height: '2px',
      backgroundColor: theme.palette.primary.main,
    },
  },
  '& .footer-logo': {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
    display: 'block',
  },
  '& .footer-about': {
    color: theme.palette.grey[400],
    marginBottom: theme.spacing(3),
    lineHeight: 1.7,
  },
  '& .footer-links': {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    '& li': {
      marginBottom: theme.spacing(1),
    },
  },
  '& .contact-info': {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
    '& svg': {
      marginRight: theme.spacing(1.5),
      color: theme.palette.primary.main,
      marginTop: '4px',
    },
  },
  '& .social-links': {
    display: 'flex',
    marginTop: theme.spacing(3),
    '& a': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      marginRight: theme.spacing(1.5),
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        transform: 'translateY(-2px)',
      },
    },
  },
  '& .copyright': {
    borderTop: `1px solid ${theme.palette.grey[800]}`,
    paddingTop: theme.spacing(4),
    marginTop: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.grey[500],
    fontSize: '0.9rem',
  },
}));

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const LandingPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Box sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '900px',
            mx: 'auto',
            py: { xs: 6, md: 8 }
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <Box
                  component="img"
                  src="/logo.jpg"
                  alt="UMSL Logo"
                  onError={(e) => {
                    console.error('Failed to load logo');
                    e.target.style.display = 'none';
                  }}
                  sx={{
                    height: { xs: '80px', sm: '100px' },
                    width: 'auto',
                    mb: 2,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    color: 'common.white',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  UMSL
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 3,
                    fontSize: { xs: '0.9rem', sm: '1.1rem' }
                  }}
                >
                  United Manpower Service Limited
                </Typography>
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
                    fontWeight: 800,
                    lineHeight: 1.2,
                    mb: 3,
                    color: 'common.white',
                    mt: 3,
                    borderTop: '2px solid rgba(255, 255, 255, 0.2)',
                    pt: 3,
                    maxWidth: '800px',
                    mx: 'auto'
                  }}
                >
                  Empowering Global Talent Mobility
                </Typography>
              </Box>
              <Typography
                variant="h5"
                component="p"
                sx={{
                  mb: 5,
                  color: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: '700px',
                  mx: 'auto',
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Connect with international opportunities and take your career to new heights with our comprehensive labor mobility platform.
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                justifyContent: 'center',
                mt: 4,
                '& .MuiButton-root': {
                  minWidth: '220px',
                  py: 1.8,
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                  }
                }
              }}>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="secondary"
                  size="large"
                  endIcon={<FaArrowRight />}
                  sx={{
                    bgcolor: 'common.white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Create Account
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'common.white',
                    border: '2px solid white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderColor: 'common.white',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </motion.div>
          </Box>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box component="section" sx={{ 
        py: { xs: 6, md: 10 }, 
        bgcolor: 'grey.50'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                fontWeight: 700,
                mb: 2,
                color: 'text.primary'
              }}
            >
              Why Choose Our Platform?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Comprehensive solutions for your global career journey
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: <FaGlobe style={{ fontSize: '3rem' }} />,
                title: "Global Opportunities",
                description: "Access thousands of international jobs across 50+ countries"
              },
              {
                icon: <FaGraduationCap style={{ fontSize: '3rem' }} />,
                title: "Skills Development",
                description: "Industry-recognized training and certification programs"
              },
              {
                icon: <FaHandshake style={{ fontSize: '3rem' }} />,
                title: "Professional Network",
                description: "Connect with industry leaders and expand your reach"
              },
              {
                icon: <FaShieldAlt style={{ fontSize: '3rem' }} />,
                title: "Secure & Supported",
                description: "Advanced security with 24/7 expert assistance"
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box sx={{
                    bgcolor: 'white',
                    p: 4,
                    borderRadius: 3,
                    height: '100%',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: `1px solid ${theme.palette.grey[200]}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: theme.palette.primary.main
                    }
                  }}>
                    <Box sx={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: 'text.primary'
                    }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box component="section" sx={{
        py: { xs: 6, md: 8 },
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {[
              { number: '50,000+', label: 'Active Users', icon: <FaUsers /> },
              { number: '10,000+', label: 'Job Openings', icon: <FaBriefcase /> },
              { number: '500+', label: 'Partner Companies', icon: <FaBuilding /> },
              { number: '95%', label: 'Success Rate', icon: <FaChartLine /> },
            ].map((stat, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.9 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2rem', md: '2.8rem' } }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box component="section" sx={{ 
        py: { xs: 8, md: 10 }, 
        bgcolor: 'grey.50'
      }}>
        <Container maxWidth="md">
          <Box sx={{
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  fontWeight: 700,
                  mb: 3
                }}
              >
                Ready to Transform Your Career?
              </Typography>
              <Typography
                variant="h6"
                component="p"
                sx={{
                  mb: 4,
                  opacity: 0.95,
                  maxWidth: '600px',
                  mx: 'auto'
                }}
              >
                Join thousands of professionals who have found their dream jobs through our platform
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    }
                  }}
                  endIcon={<FaArrowRight />}
                >
                  Get Started Free
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Footer>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Company Info */}
            <Grid item xs={12} md={4} className="footer-section">
              <Typography variant="h3" className="footer-logo">UMSL</Typography>
              <Typography variant="body2" className="footer-about">
                United Manpower Service Limited is a leading global workforce solutions provider,
                connecting talent with opportunity across borders.
              </Typography>
              <Box className="social-links">
                <a href="#" aria-label="Facebook"><Facebook /></a>
                <a href="#" aria-label="Twitter"><Twitter /></a>
                <a href="#" aria-label="LinkedIn"><LinkedIn /></a>
                <a href="#" aria-label="Instagram"><Instagram /></a>
              </Box>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} sm={6} md={2} className="footer-section">
              <Typography variant="h6" className="footer-title">Quick Links</Typography>
              <ul className="footer-links">
                <li><a href="#">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </Grid>

            {/* Services */}
            <Grid item xs={12} sm={6} md={2} className="footer-section">
              <Typography variant="h6" className="footer-title">Services</Typography>
              <ul className="footer-links">
                <li><a href="#">Overseas Employment</a></li>
                <li><a href="#">Recruitment</a></li>
                <li><a href="#">Training</a></li>
                <li><a href="#">Visa Processing</a></li>
                <li><a href="#">Consultation</a></li>
              </ul>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} md={4} className="footer-section">
              <Typography variant="h6" className="footer-title">Contact Us</Typography>
              <Box className="contact-info">
                <LocationOn />
                <Box>
                  <Typography variant="body2">1234 Business Avenue</Typography>
                  <Typography variant="body2">Nairobi, Kenya</Typography>
                </Box>
              </Box>
              <Box className="contact-info">
                <Phone />
                <Box>
                  <Typography variant="body2">+254 700 000000</Typography>
                  <Typography variant="body2">Mon - Fri, 8:00am - 5:00pm</Typography>
                </Box>
              </Box>
              <Box className="contact-info">
                <Email />
                <Box>
                  <Typography variant="body2">info@umsl.co.ke</Typography>
                  <Typography variant="body2">support@umsl.co.ke</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Copyright */}
          <Box className="copyright" sx={{
            mt: 4,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            width: '100%'
          }}>
            <Container maxWidth="lg">
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="body2" sx={{
                  color: 'primary.light',
                  fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  &copy; {new Date().getFullYear()} UMSL - United Manpower Service Limited. All rights reserved.
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Link to="/privacy-policy" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'primary.main' } }}>
                      Privacy Policy
                    </Typography>
                  </Link>
                  <Link to="/terms" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'primary.main' } }}>
                      Terms of Service
                    </Typography>
                  </Link>
                  <a href="#" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'primary.main' } }}>
                      Sitemap
                    </Typography>
                  </a>
                </Box>
              </Box>
            </Container>
          </Box>
        </Container>
      </Footer>
    </Box>
  );
};

export default LandingPage;