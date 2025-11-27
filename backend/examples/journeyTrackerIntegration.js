/**
 * Backend Integration Example for Candidate Journey Tracker
 * 
 * This file shows how to update the backend to support the journey tracker component.
 * Add these fields to the candidate dashboard API response.
 */

// =============================================================================
// OPTION 1: Add to existing getDashboardData in candidateController.js
// =============================================================================

// In: /backend/src/controllers/candidateController.js
// Function: getDashboardData

exports.getDashboardData = async (req, res) => {
  try {
    const candidateId = req.user.userId;

    // ... existing code to fetch candidate, enrollments, etc.

    // NEW: Calculate journey stage data
    const journeyData = calculateCandidateJourney(candidate, enrollments, assessments);

    res.json({
      success: true,
      data: {
        profile: {
          // ... existing profile data
          completionRate: calculateProfileCompletion(candidate),
        },
        stats: {
          // ... existing stats
        },
        currentCourses: formattedEnrollments,
        upcomingEvents: events,

        // NEW: Journey tracker data
        journeyStage: journeyData.currentStage,
        completedStages: journeyData.completedStages,
        stageDates: journeyData.stageDates,
        stageProgress: journeyData.stageProgress,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// Helper Function: Calculate Journey Stage
// =============================================================================

function calculateCandidateJourney(candidate, enrollments, assessments) {
  const completedStages = [];
  const stageDates = {};
  const stageProgress = {};

  // 1. REGISTRATION STAGE
  const profileCompletion = calculateProfileCompletion(candidate);
  stageProgress.registration = profileCompletion;

  if (profileCompletion === 100) {
    completedStages.push('registration');
    stageDates.registration = candidate.createdAt; // or profile completion date
  }

  // 2. TRAINING STAGE
  const completedCourses = enrollments.filter(e => e.status === 'COMPLETED').length;
  const totalEnrolled = enrollments.length;

  if (totalEnrolled > 0) {
    stageProgress.training = Math.min((completedCourses / 3) * 100, 100); // Assume 3 courses required

    if (completedCourses >= 3) {
      completedStages.push('training');
      // Get date of last completed course
      const lastCompleted = enrollments
        .filter(e => e.status === 'COMPLETED')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
      stageDates.training = lastCompleted?.updatedAt;
    }
  } else {
    stageProgress.training = 0;
  }

  // 3. ASSESSMENT STAGE
  const passedAssessments = assessments?.filter(a => a.status === 'PASSED').length || 0;
  const totalAssessments = assessments?.length || 0;

  if (totalAssessments > 0) {
    stageProgress.assessment = (passedAssessments / totalAssessments) * 100;

    if (passedAssessments === totalAssessments && totalAssessments >= 2) {
      completedStages.push('assessment');
      const lastAssessment = assessments
        .filter(a => a.status === 'PASSED')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
      stageDates.assessment = lastAssessment?.updatedAt;
    }
  } else {
    stageProgress.assessment = 0;
  }

  // 4. VETTING STAGE
  const isDocumentsVerified = candidate.documentsVerified || false;
  const isBackgroundCheckDone = candidate.backgroundCheckStatus === 'APPROVED';

  if (isDocumentsVerified && isBackgroundCheckDone) {
    stageProgress.vetting = 100;
    completedStages.push('vetting');
    stageDates.vetting = candidate.vettingCompletedAt || candidate.updatedAt;
  } else if (isDocumentsVerified || isBackgroundCheckDone) {
    stageProgress.vetting = 50;
  } else {
    stageProgress.vetting = 0;
  }

  // 5. JOB MATCHING STAGE
  const jobApplications = candidate.jobApplications || 0;
  const jobOffers = candidate.jobOffers || 0;

  if (jobOffers > 0) {
    stageProgress.job_matching = 100;
    completedStages.push('job_matching');
    stageDates.job_matching = candidate.firstOfferDate;
  } else if (jobApplications > 0) {
    stageProgress.job_matching = Math.min((jobApplications / 5) * 100, 80);
  } else {
    stageProgress.job_matching = 0;
  }

  // 6. PLACED STAGE
  const isPlaced = candidate.placementStatus === 'PLACED' || candidate.isEmployed;

  if (isPlaced) {
    stageProgress.placed = 100;
    completedStages.push('placed');
    stageDates.placed = candidate.placementDate || candidate.employmentStartDate;
  } else {
    stageProgress.placed = 0;
  }

  // Determine current stage
  let currentStage = 'registration';

  if (!completedStages.includes('registration')) {
    currentStage = 'registration';
  } else if (!completedStages.includes('training')) {
    currentStage = 'training';
  } else if (!completedStages.includes('assessment')) {
    currentStage = 'assessment';
  } else if (!completedStages.includes('vetting')) {
    currentStage = 'vetting';
  } else if (!completedStages.includes('job_matching')) {
    currentStage = 'job_matching';
  } else if (!completedStages.includes('placed')) {
    currentStage = 'job_matching'; // Still in matching until placed
  } else {
    currentStage = 'placed';
  }

  return {
    currentStage,
    completedStages,
    stageDates,
    stageProgress,
  };
}

// =============================================================================
// Helper Function: Calculate Profile Completion
// =============================================================================

function calculateProfileCompletion(candidate) {
  const fields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'dateOfBirth',
    'gender',
    'nationality',
    'address',
    'city',
    'country',
    'postalCode',
    'passportNumber',
    'passportExpiry',
    'emergencyContactName',
    'emergencyContactPhone',
    'education',
    'workExperience',
    'skills',
    'languages',
    'profilePhoto',
  ];

  let completedFields = 0;

  fields.forEach(field => {
    if (candidate[field] && candidate[field] !== '') {
      completedFields++;
    }
  });

  return Math.round((completedFields / fields.length) * 100);
}

// =============================================================================
// OPTION 2: Database Schema Updates (if using Prisma)
// =============================================================================


This will:
1. Add new columns to candidates table
2. Set default values
3. Create migration file
*/

// =============================================================================
// OPTION 3: Direct SQL Updates (if not using Prisma)
// =============================================================================

/*
-- Add journey tracking columns
ALTER TABLE candidates 
ADD COLUMN journey_stage VARCHAR(50) DEFAULT 'registration',
ADD COLUMN completed_stages JSON DEFAULT '[]',
ADD COLUMN stage_dates JSON DEFAULT '{}',
ADD COLUMN stage_progress JSON DEFAULT '{}',
ADD COLUMN documents_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN background_check_status VARCHAR(50),
ADD COLUMN vetting_completed_at TIMESTAMP NULL,
ADD COLUMN job_applications INT DEFAULT 0,
ADD COLUMN job_offers INT DEFAULT 0,
ADD COLUMN first_offer_date TIMESTAMP NULL,
ADD COLUMN placement_status VARCHAR(50),
ADD COLUMN is_employed BOOLEAN DEFAULT FALSE,
ADD COLUMN placement_date TIMESTAMP NULL,
ADD COLUMN employment_start_date TIMESTAMP NULL;

-- Create index for performance
CREATE INDEX idx_candidates_journey_stage ON candidates(journey_stage);
CREATE INDEX idx_candidates_placement_status ON candidates(placement_status);
*/

// =============================================================================
// OPTION 4: Update Journey Automatically (Background Job or Trigger)
// =============================================================================

// Create a service to auto-update journey stage
// File: /backend/src/services/journeyTrackerService.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class JourneyTrackerService {
  async updateCandidateJourney(candidateId) {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          enrollments: true,
          assessments: true,
        },
      });

      if (!candidate) return;

      const journeyData = calculateCandidateJourney(
        candidate,
        candidate.enrollments,
        candidate.assessments
      );

      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          journeyStage: journeyData.currentStage,
          completedStages: journeyData.completedStages,
          stageDates: journeyData.stageDates,
          stageProgress: journeyData.stageProgress,
        },
      });

      console.log(`Updated journey for candidate ${candidateId}: ${journeyData.currentStage}`);
    } catch (error) {
      console.error('Error updating candidate journey:', error);
    }
  }

  // Bulk update all candidates (run periodically)
  async updateAllCandidates() {
    try {
      const candidates = await prisma.candidate.findMany({
        where: { isActive: true },
        include: {
          enrollments: true,
          assessments: true,
        },
      });

      console.log(`Updating journey for ${candidates.length} candidates...`);

      for (const candidate of candidates) {
        await this.updateCandidateJourney(candidate.id);
      }

      console.log('Journey update complete!');
    } catch (error) {
      console.error('Error in bulk journey update:', error);
    }
  }
}

module.exports = new JourneyTrackerService();

// =============================================================================
// Usage in Routes/Controllers
// =============================================================================

// Update journey after significant events:

// 1. After profile update
const journeyTrackerService = require('../services/journeyTrackerService');

exports.updateProfile = async (req, res) => {
  // ... update profile code

  // Update journey stage
  await journeyTrackerService.updateCandidateJourney(candidateId);

  res.json({ success: true });
};

// 2. After course completion
exports.completeCourse = async (req, res) => {
  // ... mark course as complete

  // Update journey stage
  await journeyTrackerService.updateCandidateJourney(candidateId);

  res.json({ success: true });
};

// 3. After assessment completion
exports.submitAssessment = async (req, res) => {
  // ... submit assessment

  // Update journey stage
  await journeyTrackerService.updateCandidateJourney(candidateId);

  res.json({ success: true });
};

// =============================================================================
// Example API Response (Final)
// =============================================================================

/*
GET /api/candidate/dashboard

Response:
{
  "success": true,
  "data": {
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "completionRate": 85
    },
    "stats": {
      "activeCourses": 2,
      "completedCourses": 1,
      "certificates": 1,
      "attendanceRate": 92,
      "assessmentsPassed": 2
    },
    "currentCourses": [...],
    "upcomingEvents": [...],
    
    "journeyStage": "training",
    "completedStages": ["registration"],
    "stageDates": {
      "registration": "2025-11-01T10:00:00.000Z"
    },
    "stageProgress": {
      "registration": 100,
      "training": 60,
      "assessment": 0,
      "vetting": 0,
      "job_matching": 0,
      "placed": 0
    }
  }
}
*/

// =============================================================================
// Testing the Integration
// =============================================================================

// 1. Test with curl:
/*
curl -X GET http://localhost:5000/api/candidate/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
*/

// 2. Test with Postman:
/*
GET http://localhost:5000/api/candidate/dashboard
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
*/

// 3. Check in browser console:
/*
const response = await fetch('/api/candidate/dashboard', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
});
const data = await response.json();
console.log('Journey Data:', {
  currentStage: data.data.journeyStage,
  completedStages: data.data.completedStages,
  stageProgress: data.data.stageProgress
});
*/

module.exports = {
  calculateCandidateJourney,
  calculateProfileCompletion,
};
