import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

const CourseAssessments = () => {
  const { courseId } = useParams();
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Course Assessments</Typography>
      <Typography variant="body1">Assessments for course ID: {courseId}</Typography>
      {/* TODO: Implement assessments details */}
    </Box>
  );
};

export default CourseAssessments;
