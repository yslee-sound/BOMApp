import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack, Save as SaveIcon } from '@mui/icons-material';
import { getHouse, getDesign, getSurvey, updateDesign, getBOM, autoDesign, createOrUpdateSurvey } from '../services/api';
import { House, Design, Survey, BOM as BOMType } from '../types';
import FloorPlanEditor from './FloorPlanEditor';
import BOMTable from './BOMTable';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DesignView: React.FC = () => {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const [house, setHouse] = useState<House | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [bom, setBom] = useState<BOMType | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (houseId) {
      loadData();
    }
  }, [houseId]);

  const loadData = async () => {
    try {
      const [houseRes, designRes, surveyRes] = await Promise.all([
        getHouse(Number(houseId)),
        getDesign(Number(houseId)),
        getSurvey(Number(houseId)),
      ]);

      setHouse(houseRes.data);
      setDesign(designRes.data);
      setSurvey(surveyRes.data);

      // BOM 조회
      const bomRes = await getBOM(designRes.data.design_id);
      setBom(bomRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleUpdatePositions = (vsPositions: any[], spkPositions: any[]) => {
    if (design) {
      setDesign({
        ...design,
        vs_positions: vsPositions,
        spk_positions: spkPositions,
      });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!design) return;

    try {
      await updateDesign(Number(houseId), {
        vs_positions: design.vs_positions,
        spk_positions: design.spk_positions,
        controller_position: design.controller_position,
      });

      // BOM 재조회
      const bomRes = await getBOM(design.design_id);
      setBom(bomRes.data);

      setHasChanges(false);
      alert('설계가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleApplyChanges = async (params: {
    width: number;
    depth: number;
    ceilingWidth: number;
    ceilingDepth: number;
    minGap: number;
    maxGap: number;
    horizontalCount: number;
    verticalCount: number;
  }) => {
    if (!survey) return;

    try {
      // Survey 데이터 업데이트 (크기 정보 및 우물천장 정보)
      await createOrUpdateSurvey(Number(houseId), {
        ...survey,
        living_room_width: params.width,
        living_room_depth: params.depth,
        ceiling_width: params.ceilingWidth,
        ceiling_depth: params.ceilingDepth,
      });

      // 자동 설계 재실행
      const designRes = await autoDesign(Number(houseId), {
        min_gap: params.minGap,
        max_gap: params.maxGap,
        horizontal_count: params.horizontalCount,
        vertical_count: params.verticalCount,
      });

      setDesign(designRes.data);

      // BOM 재조회
      const bomRes = await getBOM(designRes.data.design_id);
      setBom(bomRes.data);

      // Survey 데이터 재조회
      const surveyRes = await getSurvey(Number(houseId));
      setSurvey(surveyRes.data);

      alert('변경사항이 적용되었습니다.');
    } catch (error) {
      console.error('Failed to apply changes:', error);
      alert('변경사항 적용에 실패했습니다.');
    }
  };

  if (!house || !design || !survey) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>로딩중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              설계 도면
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {house.house_number} | {survey.living_room_width}mm × {survey.living_room_depth}mm
            </Typography>
          </Box>
        </Box>
        {hasChanges && (
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            변경사항 저장
          </Button>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="도면 편집" />
          <Tab label="BOM" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="center" sx={{ bgcolor: '#fafafa', p: 2 }}>
            <FloorPlanEditor
              width={survey.living_room_width}
              depth={survey.living_room_depth}
              vsPositions={design.vs_positions}
              spkPositions={design.spk_positions}
              speakerLength={survey.speaker_length || 600}
              speakerWidth={survey.speaker_width || 130}
              ceilingWidth={survey.ceiling_width}
              ceilingDepth={survey.ceiling_depth}
              speakerGaps={design.speaker_gaps}
              onUpdatePositions={handleUpdatePositions}
              onApplyChanges={handleApplyChanges}
            />
          </Box>
          <Box sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              설계 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Vibration Sensors
                </Typography>
                <Typography variant="h6">{design.vs_positions.length}개</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Speakers
                </Typography>
                <Typography variant="h6">{design.spk_positions.length}개</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  설계 버전
                </Typography>
                <Typography variant="h6">v{design.design_version}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  승인 상태
                </Typography>
                <Typography variant="h6">{design.is_approved ? '승인됨' : '대기중'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {bom && <BOMTable bom={bom} />}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default DesignView;
