const prisma = require('../config/database');

const ACTIVE_PLACEMENT_STATUSES = [
  'INITIATED',
  'INTERVIEW_SCHEDULED',
  'OFFER_LETTER_SENT',
  'VISA_PROCESSING',
  'TRAVEL_READY',
];

const PIPELINE_STATUSES = ['APPLIED', 'UNDER_REVIEW', 'ENROLLED', 'WAITLISTED', 'PLACED', 'CANCELLED'];

const PIPELINE_ALLOWED_TRANSITIONS = {
  APPLIED: ['UNDER_REVIEW', 'WAITLISTED', 'CANCELLED'],
  UNDER_REVIEW: ['ENROLLED', 'WAITLISTED', 'CANCELLED'],
  ENROLLED: ['PLACED', 'WAITLISTED', 'CANCELLED'],
  WAITLISTED: ['UNDER_REVIEW', 'CANCELLED'],
  PLACED: [],
  CANCELLED: [],
};

const isMissingField = (field) => ({
  OR: [
    { [field]: null },
    { [field]: '' },
  ],
});

const buildTenantFilter = (tenantId) => (tenantId ? { tenantId } : {});

const resolveTenantId = async (user) => {
  if (user?.tenantId) {
    return user.tenantId;
  }

  if (!user?.id) {
    return null;
  }

  const membership = await prisma.userTenant.findFirst({
    where: { userId: user.id },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'asc' },
    ],
    select: { tenantId: true },
  });

  if (membership?.tenantId) {
    return membership.tenantId;
  }

  const fallbackTenant = await prisma.tenant.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  return fallbackTenant?.id || null;
};

const getRecruiterDashboard = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req.user);
    const placementFilter = buildTenantFilter(tenantId);
    const candidateFilter = buildTenantFilter(tenantId);

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const sevenDaysAhead = new Date(startToday);
    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalPlacements,
      openRoles,
      hiresLast30Days,
      interviewsScheduled,
      pipelineBreakdownRaw,
      priorityCandidatesRaw,
      upcomingInterviewsRaw,
      recentPlacementsRaw,
      jobOpeningsRaw,
      activityFeedRaw,
      [missingMedical, missingPolice, missingPassport],
    ] = await Promise.all([
      prisma.placement.count({ where: placementFilter }),
      prisma.placement.count({
        where: {
          ...placementFilter,
          placementStatus: { in: ACTIVE_PLACEMENT_STATUSES },
        },
      }),
      prisma.placement.count({
        where: {
          ...placementFilter,
          placementStatus: 'COMPLETED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.placement.count({
        where: {
          ...placementFilter,
          interviewDate: { gte: startToday },
        },
      }),
      prisma.candidate.groupBy({
        by: ['status'],
        where: {
          ...candidateFilter,
          status: { in: PIPELINE_STATUSES },
        },
        _count: { status: true },
      }),
      prisma.candidate.findMany({
        where: {
          ...candidateFilter,
          status: { in: ['UNDER_REVIEW', 'ENROLLED', 'PLACED'] },
        },
        select: {
          id: true,
          fullName: true,
          status: true,
          preferredCountry: true,
          jobTypePreference: true,
          languages: true,
          relevantSkills: true,
          updatedAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.placement.findMany({
        where: {
          ...placementFilter,
          interviewDate: {
            gte: startToday,
            lte: sevenDaysAhead,
          },
        },
        include: {
          candidate: {
            select: {
              fullName: true,
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { interviewDate: 'asc' },
        take: 6,
      }),
      prisma.placement.findMany({
        where: placementFilter,
        include: {
          candidate: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.jobOpening.findMany({
        where: placementFilter,
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.activityLog.findMany({
        where: buildTenantFilter(tenantId),
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      Promise.all([
        prisma.candidate.count({ where: { ...candidateFilter, ...isMissingField('medicalClearanceUrl') } }),
        prisma.candidate.count({ where: { ...candidateFilter, ...isMissingField('policeClearanceUrl') } }),
        prisma.candidate.count({ where: { ...candidateFilter, ...isMissingField('passportCopyUrl') } }),
      ]),
    ]);

    const pipelineBreakdown = PIPELINE_STATUSES.map((status) => {
      const match = pipelineBreakdownRaw.find((item) => item.status === status);
      return {
        status,
        count: match?._count?.status || 0,
      };
    });

    const pipelineTotal = pipelineBreakdown.reduce((sum, item) => sum + item.count, 0);

    const priorityCandidates = priorityCandidatesRaw.map((candidate) => ({
      id: candidate.id,
      name: candidate.fullName,
      status: candidate.status,
      region: candidate.preferredCountry,
      jobType: candidate.jobTypePreference,
      languages: Array.isArray(candidate.languages) ? candidate.languages : [],
      skills: candidate.relevantSkills,
      email: candidate.user?.email,
      updatedAt: candidate.updatedAt,
    }));

    const upcomingInterviews = upcomingInterviewsRaw.map((placement) => ({
      id: placement.id,
      candidate: placement.candidate?.fullName,
      email: placement.candidate?.user?.email,
      employer: placement.employerName,
      jobRole: placement.jobRoleOffered,
      location: placement.country,
      interviewDate: placement.interviewDate,
      status: placement.placementStatus,
    }));

    const recentPlacements = recentPlacementsRaw.map((placement) => ({
      id: placement.id,
      candidate: placement.candidate?.fullName,
      employer: placement.employerName,
      jobRole: placement.jobRoleOffered,
      status: placement.placementStatus,
      updatedAt: placement.updatedAt,
    }));

    const jobOpenings = jobOpeningsRaw.map((opening) => ({
      id: opening.id,
      employer: opening.employerName,
      jobRole: opening.jobTitle,
      location: opening.location,
      jobType: opening.jobType,
      status: opening.status,
      interviewDate: opening.interviewDate,
      openings: opening.openings,
      priority: opening.priority,
      createdAt: opening.createdAt,
      updatedAt: opening.updatedAt,
    }));

    const activityFeed = activityFeedRaw.map((log) => ({
      id: log.id,
      action: log.action,
      module: log.module || 'General',
      createdAt: log.createdAt,
      actor: log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email : null,
      details: log.details,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalPlacements,
          openRoles,
          hiresLast30Days,
          interviewsScheduled,
          pipelineTotal,
        },
        pipeline: {
          breakdown: pipelineBreakdown,
          total: pipelineTotal,
        },
        priorityCandidates,
        upcomingInterviews,
        recentPlacements,
        jobOpenings,
        documents: {
          missingMedical,
          missingPolice,
          missingPassport,
        },
        activityFeed,
      },
    });
  } catch (error) {
    console.error('Recruiter dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load recruiter dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const createJobOpening = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const tenantId = await resolveTenantId(req.user);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter is not linked to a tenant. Please contact your administrator.',
      });
    }

    const payload = {
      tenantId,
      recruiterId,
      jobTitle: req.body.jobTitle,
      employerName: req.body.employerName,
      location: req.body.location || null,
      jobType: req.body.jobType || null,
      priority: req.body.priority || 'Medium',
      openings: typeof req.body.openings === 'number' ? req.body.openings : 1,
      salaryRange: req.body.salaryRange || null,
      status: req.body.status || 'OPEN',
      interviewDate: req.body.interviewDate ? new Date(req.body.interviewDate) : null,
      description: req.body.description || null,
      requirements: req.body.requirements || null,
      metadata: req.body.metadata || null,
    };

    const jobOpening = await prisma.jobOpening.create({
      data: payload,
    });

    await prisma.activityLog.create({
      data: {
        tenantId,
        userId: recruiterId,
        action: 'Created job opening',
        module: 'Recruiter',
        details: {
          jobOpeningId: jobOpening.id,
          jobTitle: jobOpening.jobTitle,
          employerName: jobOpening.employerName,
        },
      },
    }).catch(() => null);

    res.status(201).json({
      success: true,
      data: jobOpening,
    });
  } catch (error) {
    console.error('Create job opening error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job opening',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const formatPipelineCandidate = (candidate) => ({
  id: candidate.id,
  name: candidate.fullName,
  status: candidate.status,
  region: candidate.preferredCountry,
  jobType: candidate.jobTypePreference,
  email: candidate.user?.email,
  updatedAt: candidate.updatedAt,
  lastEvent: candidate.pipelineEvents?.[0]
    ? {
        id: candidate.pipelineEvents[0].id,
        fromStage: candidate.pipelineEvents[0].fromStage,
        toStage: candidate.pipelineEvents[0].toStage,
        comment: candidate.pipelineEvents[0].comment,
        isBlocked: candidate.pipelineEvents[0].isBlocked,
        blockerReason: candidate.pipelineEvents[0].blockerReason,
        createdAt: candidate.pipelineEvents[0].createdAt,
        author: candidate.pipelineEvents[0].author
          ? `${candidate.pipelineEvents[0].author.firstName || ''} ${candidate.pipelineEvents[0].author.lastName || ''}`.trim() || candidate.pipelineEvents[0].author.email
          : null,
      }
    : null,
});

const getPipelineCandidates = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req.user);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Missing tenant context' });
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        tenantId,
        status: { in: PIPELINE_STATUSES },
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        preferredCountry: true,
        jobTypePreference: true,
        updatedAt: true,
        user: { select: { email: true } },
        pipelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            comment: true,
            isBlocked: true,
            blockerReason: true,
            createdAt: true,
            author: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });

    res.json({
      success: true,
      data: candidates.map(formatPipelineCandidate),
    });
  } catch (error) {
    console.error('Get pipeline candidates error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pipeline candidates' });
  }
};

const getCandidatePipelineEvents = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req.user);
    const candidateId = Number(req.params.candidateId);
    if (!tenantId || Number.isNaN(candidateId)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate reference' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
      select: { id: true },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const events = await prisma.candidatePipelineEvent.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fromStage: true,
        toStage: true,
        comment: true,
        isBlocked: true,
        blockerReason: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get candidate pipeline events error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pipeline history' });
  }
};

const transitionCandidateStage = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req.user);
    const userId = req.user?.id;
    const candidateId = Number(req.params.candidateId);
    const { nextStage, comment, isBlocked = false, blockerReason } = req.body;

    if (!tenantId || Number.isNaN(candidateId)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate reference' });
    }

    if (!PIPELINE_STATUSES.includes(nextStage)) {
      return res.status(400).json({ success: false, message: 'Unsupported pipeline stage' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
      select: { id: true, status: true },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const fromStage = candidate.status;
    if (fromStage !== nextStage) {
      const allowedNext = PIPELINE_ALLOWED_TRANSITIONS[fromStage] || [];
      if (!allowedNext.includes(nextStage)) {
        return res.status(400).json({
          success: false,
          message: `Cannot move from ${fromStage} to ${nextStage}`,
        });
      }
    }

    if (isBlocked && !blockerReason) {
      return res.status(400).json({ success: false, message: 'Provide a blocker reason when flagging blockers.' });
    }

    const event = await prisma.$transaction(async (tx) => {
      const pipelineEvent = await tx.candidatePipelineEvent.create({
        data: {
          tenantId,
          candidateId,
          fromStage,
          toStage: nextStage,
          comment: comment || null,
          isBlocked,
          blockerReason: blockerReason || null,
          createdBy: userId,
        },
      });

      await tx.candidate.update({
        where: { id: candidateId },
        data: {
          status: nextStage,
          updatedBy: userId,
        },
      });

      await tx.activityLog
        .create({
          data: {
            tenantId,
            userId,
            action: 'Pipeline transition',
            module: 'Recruiter',
            resource: 'Candidate',
            details: {
              candidateId,
              fromStage,
              toStage: nextStage,
              isBlocked,
              blockerReason,
            },
          },
        })
        .catch(() => null);

      return pipelineEvent;
    });

    const refreshedCandidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        fullName: true,
        status: true,
        preferredCountry: true,
        jobTypePreference: true,
        updatedAt: true,
        user: { select: { email: true } },
        pipelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            comment: true,
            isBlocked: true,
            blockerReason: true,
            createdAt: true,
            author: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    res.json({ success: true, data: formatPipelineCandidate(refreshedCandidate), eventId: event.id });
  } catch (error) {
    console.error('Transition candidate stage error:', error);
    res.status(500).json({ success: false, message: 'Failed to update pipeline stage' });
  }
};

module.exports = {
  getDashboard: getRecruiterDashboard,
  createJobOpening,
  getPipelineCandidates,
  getCandidatePipelineEvents,
  transitionCandidateStage,
};
