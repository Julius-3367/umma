# i18n Translation Implementation Guide

## How to Use Translations in Your Components

### 1. Import the useTranslation hook
```jsx
import { useTranslation } from 'react-i18next';
```

### 2. Use the hook in your component
```jsx
const MyComponent = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('dashboard.overview')}</p>
    </div>
  );
};
```

### 3. Example: Login Page with Translations
```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Typography } from '@mui/material';

const Login = () => {
  const { t } = useTranslation();
  
  return (
    <Box>
      <Typography variant="h4">{t('auth.signInTitle')}</Typography>
      <TextField label={t('common.email')} />
      <TextField label={t('common.password')} type="password" />
      <Button variant="contained">{t('auth.signIn')}</Button>
    </Box>
  );
};
```

### 4. Example: Dashboard with Translations
```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  
  return (
    <Box>
      <Typography variant="h4">{t('dashboard.title')}</Typography>
      <Card>
        <CardContent>
          <Typography>{t('dashboard.totalStudents')}: 150</Typography>
          <Typography>{t('dashboard.totalCourses')}: 25</Typography>
          <Typography>{t('dashboard.activeCohorts')}: 10</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
```

### 5. Example: Table with Translations
```jsx
const EnrollmentsTable = () => {
  const { t } = useTranslation();
  
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{t('enrollments.candidateName')}</TableCell>
          <TableCell>{t('enrollments.courseName')}</TableCell>
          <TableCell>{t('enrollments.enrollmentDate')}</TableCell>
          <TableCell>{t('enrollments.enrollmentStatus')}</TableCell>
          <TableCell>{t('common.actions')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {/* Table rows */}
      </TableBody>
    </Table>
  );
};
```

### 6. Example: Buttons with Translations
```jsx
const ActionButtons = () => {
  const { t } = useTranslation();
  
  return (
    <Box>
      <Button>{t('common.save')}</Button>
      <Button>{t('common.cancel')}</Button>
      <Button>{t('enrollments.approve')}</Button>
      <Button>{t('enrollments.reject')}</Button>
    </Box>
  );
};
```

### 7. Example: Form Validation Messages
```jsx
const validateForm = (data, t) => {
  const errors = {};
  
  if (!data.email) {
    errors.email = t('validation.required');
  } else if (!isValidEmail(data.email)) {
    errors.email = t('validation.invalidEmail');
  }
  
  if (!data.password) {
    errors.password = t('validation.required');
  } else if (data.password.length < 6) {
    errors.password = t('validation.passwordMin');
  }
  
  return errors;
};
```

### 8. Example: Success/Error Messages
```jsx
const handleSave = async () => {
  const { t } = useTranslation();
  
  try {
    await saveData();
    showNotification(t('messages.successSave'));
  } catch (error) {
    showNotification(t('messages.errorSave'));
  }
};
```

## Translation Keys Available

### Common
- `common.welcome` - "Welcome" / "Karibu"
- `common.login` - "Login" / "Ingia"
- `common.logout` - "Logout" / "Toka"
- `common.save` - "Save" / "Hifadhi"
- `common.cancel` - "Cancel" / "Ghairi"
- `common.search` - "Search" / "Tafuta"
- `common.filter` - "Filter" / "Chuja"
- `common.actions` - "Actions" / "Vitendo"

### Dashboard
- `dashboard.title` - "Dashboard" / "Dashibodi"
- `dashboard.totalStudents` - "Total Students" / "Jumla ya Wanafunzi"
- `dashboard.totalCourses` - "Total Courses" / "Jumla ya Kozi"
- `dashboard.activeCohorts` - "Active Cohorts" / "Vikundi Hai"

### Enrollments
- `enrollments.title` - "Enrollments" / "Usajili"
- `enrollments.approve` - "Approve" / "Kubali"
- `enrollments.reject` - "Reject" / "Kataa"
- `enrollments.viewDetails` - "View Details" / "Angalia Maelezo"

### Courses
- `courses.title` - "Courses" / "Kozi"
- `courses.courseCode` - "Course Code" / "Nambari ya Kozi"
- `courses.duration` - "Duration" / "Muda"

### Users Roles
- `users.admin` - "Admin" / "Msimamizi"
- `users.trainer` - "Trainer" / "Mkufunzi"
- `users.candidate` - "Candidate" / "Mwanafunzi"

## Language Switcher Component

The Language Switcher is already added to the AppLayout header. Users can:
1. Click the language icon (🌍) in the top navigation bar
2. Select either English (🇬🇧) or Kiswahili (🇹🇿)
3. The entire application will switch languages instantly
4. The language preference is saved in localStorage

## Adding New Translations

To add new translations:

1. Open `/frontend/src/i18n/locales/en.json`
2. Add your English text under the appropriate section
3. Open `/frontend/src/i18n/locales/sw.json`
4. Add the corresponding Kiswahili translation

Example:
```json
// en.json
{
  "mySection": {
    "myKey": "My English Text"
  }
}

// sw.json
{
  "mySection": {
    "myKey": "Maandishi Yangu ya Kiswahili"
  }
}
```

Then use it in your component:
```jsx
const { t } = useTranslation();
<Typography>{t('mySection.myKey')}</Typography>
```

## Best Practices

1. **Always use translation keys** instead of hardcoded text
2. **Group related translations** under logical sections
3. **Use descriptive key names** that make sense in both languages
4. **Test both languages** to ensure translations fit in your UI
5. **Keep translations consistent** across similar components
6. **Use professional translators** for production applications

## Professional Translation Services

For production, consider using professional Swahili translators to ensure:
- Grammatically correct translations
- Culturally appropriate language
- Consistent terminology
- Natural-sounding phrases

Some options:
- Local Kenyan/Tanzanian translation agencies
- Online platforms like Gengo, One Hour Translation
- University language departments
- Community translators
