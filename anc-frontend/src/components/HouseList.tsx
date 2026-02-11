import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack } from '@mui/icons-material';
import { getProject, getHouses, createHouse, deleteHouse } from '../services/api';
import { Project, House } from '../types';

const HouseList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newHouse, setNewHouse] = useState({ house_number: '', floor_plan_type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadHouses();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await getProject(Number(projectId));
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadHouses = async () => {
    try {
      const response = await getHouses(Number(projectId));
      setHouses(response.data);
    } catch (error) {
      console.error('Failed to load houses:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await createHouse(Number(projectId), newHouse);
      setOpenDialog(false);
      setNewHouse({ house_number: '', floor_plan_type: '' });
      loadHouses();
      loadProject();
    } catch (error) {
      console.error('Failed to create house:', error);
    }
  };

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('이 세대를 삭제하시겠습니까?')) {
      try {
        await deleteHouse(id);
        loadHouses();
        loadProject();
      } catch (error) {
        console.error('Failed to delete house:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" component="h1">
            {project?.project_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {project?.location}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          세대 추가
        </Button>
      </Box>

      <Paper>
        <List>
          {houses.map((house) => (
            <ListItem
              key={house.house_id}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => handleDelete(house.house_id, e)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => navigate(`/houses/${house.house_id}`)}>
                <ListItemText
                  primary={house.house_number}
                  secondary={house.floor_plan_type || '평형 미지정'}
                />
                <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                  {house.survey_date && <Chip label="실사완료" color="primary" size="small" />}
                  {house.design_date && <Chip label="설계완료" color="success" size="small" />}
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
          {houses.length === 0 && (
            <ListItem>
              <ListItemText
                primary="세대가 없습니다"
                secondary="세대를 추가해주세요"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>세대 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="세대 번호 (예: 101동 1001호)"
            fullWidth
            value={newHouse.house_number}
            onChange={(e) => setNewHouse({ ...newHouse, house_number: e.target.value })}
          />
          <TextField
            margin="dense"
            label="평형 (예: 84㎡)"
            fullWidth
            value={newHouse.floor_plan_type}
            onChange={(e) => setNewHouse({ ...newHouse, floor_plan_type: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleCreate} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HouseList;
