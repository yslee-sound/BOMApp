import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { BOM } from '../types';

interface BOMTableProps {
  bom: BOM;
}

const BOMTable: React.FC<BOMTableProps> = ({ bom }) => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          자재 명세서 (BOM)
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip label={`총 케이블 길이: ${bom.total_cable_length.toFixed(2)}m`} color="primary" />
          <Chip
            label={`총 비용: ${bom.total_cost.toLocaleString()}원`}
            color="secondary"
          />
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>자재코드</strong></TableCell>
              <TableCell><strong>자재명</strong></TableCell>
              <TableCell align="right"><strong>수량</strong></TableCell>
              <TableCell><strong>단위</strong></TableCell>
              <TableCell align="right"><strong>단가(원)</strong></TableCell>
              <TableCell align="right"><strong>금액(원)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bom.materials?.map((item) => (
              <TableRow key={item.code} hover>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">{item.qty}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell align="right">{item.unit_price.toLocaleString()}</TableCell>
                <TableCell align="right"><strong>{item.total.toLocaleString()}</strong></TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell colSpan={5} align="right">
                <Typography variant="h6">합계</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6" color="primary">
                  {bom.total_cost.toLocaleString()}원
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          * 케이블 길이는 맨해튼 거리(Manhattan distance) 기준으로 계산되었습니다.
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          * 실제 시공 시 10-15% 여유를 두고 자재를 준비하시기 바랍니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default BOMTable;
