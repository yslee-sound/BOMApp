import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { getHouse, getSurvey, createOrUpdateSurvey, autoDesign } from '../services/api';
import { House } from '../types';

const SurveyForm: React.FC = () => {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const [house, setHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({
    living_room_width: '',
    living_room_depth: '',
    ceiling_height: '',
    has_molding: false,
    molding_width: '',
    has_air_conditioner: false,
    notes: '',
    surveyor_name: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (houseId) {
      loadHouse();
      loadSurvey();
    }
  }, [houseId]);

  const loadHouse = async () => {
    try {
      const response = await getHouse(Number(houseId));
      setHouse(response.data);
    } catch (error) {
      console.error('Failed to load house:', error);
    }
  };

  const loadSurvey = async () => {
    try {
      const response = await getSurvey(Number(houseId));
      const survey = response.data;
      setFormData({
        living_room_width: survey.living_room_width.toString(),
        living_room_depth: survey.living_room_depth.toString(),
        ceiling_height: survey.ceiling_height?.toString() || '',
        has_molding: survey.has_molding,
        molding_width: survey.molding_width?.toString() || '',
        has_air_conditioner: survey.has_air_conditioner,
        notes: survey.notes || '',
        surveyor_name: survey.surveyor_name || '',
      });
    } catch (error) {
      // 실사 데이터가 없는 경우 (404)
      console.log('No existing survey data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 실사 데이터 저장
      const surveyData = {
        living_room_width: parseFloat(formData.living_room_width),
        living_room_depth: parseFloat(formData.living_room_depth),
        ceiling_height: formData.ceiling_height ? parseFloat(formData.ceiling_height) : undefined,
        has_molding: formData.has_molding,
        molding_width: formData.molding_width ? parseFloat(formData.molding_width) : undefined,
        has_air_conditioner: formData.has_air_conditioner,
        notes: formData.notes,
        surveyor_name: formData.surveyor_name,
      };

      await createOrUpdateSurvey(Number(houseId), surveyData);

      // 자동 설계 생성
      await autoDesign(Number(houseId), {
        obstacles: [],
        offset: 300,
      });

      alert('실사 데이터가 저장되고 설계가 생성되었습니다.');
      navigate(`/houses/${houseId}/design`);
    } catch (error) {
      console.error('Failed to save survey:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            실사 데이터 입력
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {house?.house_number}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="거실 가로 (mm)"
                type="number"
                value={formData.living_room_width}
                onChange={(e) => setFormData({ ...formData, living_room_width: e.target.value })}
                helperText="예: 4500"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="거실 세로 (mm)"
                type="number"
                value={formData.living_room_depth}
                onChange={(e) => setFormData({ ...formData, living_room_depth: e.target.value })}
                helperText="예: 3600"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="천장 높이 (mm)"
                type="number"
                value={formData.ceiling_height}
                onChange={(e) => setFormData({ ...formData, ceiling_height: e.target.value })}
                helperText="선택사항"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_molding}
                    onChange={(e) => setFormData({ ...formData, has_molding: e.target.checked })}
                  />
                }
                label="몰딩 있음"
              />
              {formData.has_molding && (
                <TextField
                  fullWidth
                  label="몰딩 너비 (mm)"
                  type="number"
                  value={formData.molding_width}
                  onChange={(e) => setFormData({ ...formData, molding_width: e.target.value })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_air_conditioner}
                    onChange={(e) => setFormData({ ...formData, has_air_conditioner: e.target.checked })}
                  />
                }
                label="에어컨 있음"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="실사자 이름"
                value={formData.surveyor_name}
                onChange={(e) => setFormData({ ...formData, surveyor_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button onClick={() => navigate(-1)}>취소</Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? '처리중...' : '저장 및 설계 생성'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default SurveyForm;
