require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/app');

const prisma = new PrismaClient();

const PIPELINE_ALLOWED_TRANSITIONS = {
  APPLIED: ['UNDER_REVIEW', 'WAITLISTED', 'CANCELLED'],
  UNDER_REVIEW: ['ENROLLED', 'WAITLISTED', 'CANCELLED'],
  ENROLLED: ['PLACED', 'WAITLISTED', 'CANCELLED'],
  WAITLISTED: ['UNDER_REVIEW', 'CANCELLED'],
  PLACED: [],
  CANCELLED: [],
};

const pickTransitionTarget = (current) => {
  const options = PIPELINE_ALLOWED_TRANSITIONS[current] || [];
  if (!options.length) {
    return current;
  }

  return options[0];
};

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@labourmobility.com' },
      select: { id: true, email: true },
    });

    if (!admin) {
      throw new Error('Admin user not found; cannot mint auth token.');
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    const agent = request(app);

    const candidatesRes = await agent
      .get('/api/recruiter/pipeline/candidates')
      .set('Authorization', `Bearer ${token}`);

    console.log('GET /api/recruiter/pipeline/candidates ->', candidatesRes.status);

    if (!candidatesRes.body?.success) {
      console.error('Failed response body:', candidatesRes.body);
      return;
    }

    const candidates = candidatesRes.body.data || [];
    console.log(`Retrieved ${candidates.length} pipeline candidates.`);

    if (!candidates.length) {
      console.warn('No pipeline candidates available to continue validation.');
      return;
    }

    const candidate = candidates[0];
    console.log('Using candidate', candidate.id, candidate.name, 'current stage:', candidate.status);

    const eventsRes = await agent
      .get(`/api/recruiter/pipeline/${candidate.id}/events`)
      .set('Authorization', `Bearer ${token}`);

    console.log(`GET /api/recruiter/pipeline/${candidate.id}/events ->`, eventsRes.status, 'events:', eventsRes.body?.data?.length ?? 0);

    const nextStage = pickTransitionTarget(candidate.status);

    if (nextStage === candidate.status) {
      console.warn('Candidate is in a terminal stage; skipping transition validation.');
      return;
    }

    const transitionPayload = {
      nextStage,
      comment: `Automated pipeline check -> ${candidate.status} to ${nextStage}`,
    };

    const transitionRes = await agent
      .post(`/api/recruiter/pipeline/${candidate.id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send(transitionPayload);

    console.log(`POST /api/recruiter/pipeline/${candidate.id}/transition ->`, transitionRes.status);
    console.log('Response body:', transitionRes.body);
  } catch (error) {
    console.error('Pipeline endpoint smoke test failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();