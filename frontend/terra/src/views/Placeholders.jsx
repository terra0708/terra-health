import { Box, Typography } from '@mui/material';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

export const Statistics = () => {
  usePerformance('Statistics');
  return (
    <ModulePageWrapper moduleName="Statistics" aria-label="Statistics Page">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">Statistics</Typography>
        <Typography variant="body1" color="text.secondary">
          This page is under development.
        </Typography>
      </Box>
    </ModulePageWrapper>
  );
};
