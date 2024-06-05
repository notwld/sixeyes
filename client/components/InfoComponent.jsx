import React from 'react';
import { Card, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';

const highlightedSpecs = ['BootTime', 'System'];

const InfoComponent = ({ systemInfo }) => {
  const renderInfoRows = () => {
    const rows = [];

    for (const [key, value] of Object.entries(systemInfo)) {
      const isHighlighted = highlightedSpecs.includes(key);

      rows.push(
        <TableRow key={key}>
          <TableCell>{key}</TableCell>
          <TableCell className={isHighlighted ? 'highlighted-value' : ''}>
            <Typography>{typeof value === 'object' ? JSON.stringify(value) : value}</Typography>
          </TableCell>
        </TableRow>
      );
    }

    return rows;
  };

  return (
    <Card sx={{ mt: 4, p: 2 }}>
      <Typography variant="h6">System Information</Typography>
      <Table sx={{ mt: 2 }}>
        <TableBody>
          {renderInfoRows()}
        </TableBody>
      </Table>
    </Card>
  );
};

export default InfoComponent;
