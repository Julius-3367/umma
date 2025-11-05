import React from 'react';
import { Box, Container } from '@mui/material';
import CourseCreationWizard from '../../components/forms/CourseCreationWizard';

const CreateCourse = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <CourseCreationWizard mode="create" />
      </Box>
    </Container>
  );
};

export default CreateCourse;
