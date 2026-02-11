import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../services/api';
import { Project } from '../types';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProject, setNewProject] = useState({ project_name: '', location: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await createProject(newProject);
      setOpenDialog(false);
      setNewProject({ project_name: '', location: '' });
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('이 프로젝트를 삭제하시겠습니까?')) {
      try {
        await deleteProject(id);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          프로젝트 목록
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          새 프로젝트
        </Button>
      </Box>

      <Paper>
        <List>
          {projects.map((project) => (
            <ListItem
              key={project.project_id}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => handleDelete(project.project_id, e)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => navigate(`/projects/${project.project_id}`)}>
                <ListItemText
                  primary={project.project_name}
                  secondary={`${project.location || '위치 미지정'} | 세대 수: ${project.total_houses}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {projects.length === 0 && (
            <ListItem>
              <ListItemText
                primary="프로젝트가 없습니다"
                secondary="새 프로젝트를 생성해주세요"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>새 프로젝트 생성</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="프로젝트명"
            fullWidth
            value={newProject.project_name}
            onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="위치"
            fullWidth
            value={newProject.location}
            onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleCreate} variant="contained">생성</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectList;
