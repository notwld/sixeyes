import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const getColor = (usage) => {
  const hue = ((1 - usage / 100) * 120).toString(10);
  return `hsl(${hue}, 100%, 50%)`;
};

const DialCard = ({ title, usage }) => {
  return (
    <Card sx={{ width: '250px', m: 1 }}>
      <CardContent>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ width: '150px', margin: 'auto' }}>
          <CircularProgressbar
            value={usage}
            text={`${usage}%`}
            styles={buildStyles({
              textColor: 'white',
              pathColor: getColor(usage),
              trailColor: '#d6d6d6',
              strokeWidth: 15, // Adjust the strokeWidth to increase the dial size
            })}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default DialCard;
