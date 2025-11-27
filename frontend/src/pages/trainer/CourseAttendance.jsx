import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

const CourseAttendance = () => {
  const { courseId } = useParams();
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Course Attendance</Typography>
      <Typography variant="body1">Attendance for course ID: {courseId}</Typography>
      {/* TODO: Implement attendance details */}
    </Box>
  );
};

export default CourseAttendance;
