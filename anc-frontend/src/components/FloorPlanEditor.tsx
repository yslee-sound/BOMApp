import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line } from 'react-konva';
import { Box, FormControlLabel, Checkbox, FormGroup, Paper, Typography, TextField, Grid } from '@mui/material';
import { Device } from '../types';

interface FloorPlanEditorProps {
  width: number;
  depth: number;
  vsPositions: Device[];
  spkPositions: Device[];
  speakerLength?: number;  // 스피커 길이 (mm)
  speakerWidth?: number;   // 스피커 폭 (mm)
  speakerGaps?: { top?: number; right?: number; bottom?: number; left?: number };
  onUpdatePositions: (vs: Device[], spk: Device[]) => void;
  scale?: number;
}

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  width,
  depth,
  vsPositions,
  spkPositions,
  speakerLength = 600,
  speakerWidth = 130,
  speakerGaps,
  onUpdatePositions,
  scale = 0.15,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localVS, setLocalVS] = useState<Device[]>(vsPositions);
  const [localSPK, setLocalSPK] = useState<Device[]>(spkPositions);
  const [showVS, setShowVS] = useState<boolean>(true);
  const [showSPK, setShowSPK] = useState<boolean>(true);
  
  // 실시간 편집을 위한 로컬 상태
  const [localWidth, setLocalWidth] = useState<number>(width);
  const [localDepth, setLocalDepth] = useState<number>(depth);
  const [localSpeakerLength, setLocalSpeakerLength] = useState<number>(speakerLength);
  const [localSpeakerWidth, setLocalSpeakerWidth] = useState<number>(speakerWidth);
  const [localMinGap, setLocalMinGap] = useState<number>(200); // 최소 스피커 간격

  const stageWidth = Math.max(800, localWidth * scale + 100);
  const stageHeight = Math.max(600, localDepth * scale + 100);
  const offsetX = 50;
  const offsetY = 50;

  // 우물천장 크기 계산 (로컬 값으로, 기본 비율 0.70 적용)
  const aspectRatio = Math.max(localWidth, localDepth) / Math.min(localWidth, localDepth);
  let ceilingRatio = 0.70; // 기본값, 추후 스피커 개수 기반으로 계산
  
  const ceilingWidth = localWidth * ceilingRatio;
  const ceilingDepth = localDepth * ceilingRatio;
  const ceilingStartX = (localWidth - ceilingWidth) / 2;
  const ceilingStartY = (localDepth - ceilingDepth) / 2;

  useEffect(() => {
    setLocalVS(vsPositions);
    setLocalSPK(spkPositions);
  }, [vsPositions, spkPositions]);
  
  useEffect(() => {
    setLocalWidth(width);
    setLocalDepth(depth);
  }, [width, depth]);
  
  useEffect(() => {
    setLocalSpeakerLength(speakerLength);
    setLocalSpeakerWidth(speakerWidth);
  }, [speakerLength, speakerWidth]);

  const handleVSChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowVS(event.target.checked);
  };

  const handleSPKChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowSPK(event.target.checked);
  };

  const handleDragEnd = (e: any, deviceId: number, deviceType: 'VS' | 'SPK') => {
    const newX = (e.target.x() - offsetX) / scale;
    const newY = (e.target.y() - offsetY) / scale;

    if (deviceType === 'VS') {
      const updated = localVS.map((device) =>
        device.id === deviceId ? { ...device, x: newX, y: newY } : device
      );
      setLocalVS(updated);
      onUpdatePositions(updated, localSPK);
    } else {
      const updated = localSPK.map((device) =>
        device.id === deviceId ? { ...device, x: newX, y: newY } : device
      );
      setLocalSPK(updated);
      onUpdatePositions(localVS, updated);
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="subtitle1" sx={{ mr: 3, fontWeight: 'bold' }}>
          표시 항목:
        </Typography>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={showVS}
                onChange={handleVSChange}
                color="primary"
              />
            }
            label="Vibration Sensor"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showSPK}
                onChange={handleSPKChange}
                color="error"
              />
            }
            label="Speaker"
          />
        </FormGroup>
      </Paper>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa' }}>
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          {/* 거실 외곽선 */}
          <Rect
            x={offsetX}
            y={offsetY}
            width={localWidth * scale}
            height={localDepth * scale}
            stroke="#000000"
            strokeWidth={2}
            fill="#f5f5f5"
          />

          {/* 치수선 - 가로(상단) */}
          <Line
            points={[
              offsetX,
              offsetY - 20,
              offsetX + localWidth * scale,
              offsetY - 20,
            ]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Line
            points={[offsetX, offsetY - 25, offsetX, offsetY - 15]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Line
            points={[
              offsetX + localWidth * scale,
              offsetY - 25,
              offsetX + localWidth * scale,
              offsetY - 15,
            ]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Text
            x={offsetX + (localWidth * scale) / 2 - 30}
            y={offsetY - 35}
            text={`${Math.round(localWidth)} mm`}
            fontSize={14}
            fill="#0066cc"
            fontStyle="bold"
          />

          {/* 치수선 - 세로(좌측) */}
          <Line
            points={[
              offsetX - 20,
              offsetY,
              offsetX - 20,
              offsetY + localDepth * scale,
            ]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Line
            points={[offsetX - 25, offsetY, offsetX - 15, offsetY]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Line
            points={[
              offsetX - 25,
              offsetY + localDepth * scale,
              offsetX - 15,
              offsetY + localDepth * scale,
            ]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Text
            x={offsetX - 38}
            y={offsetY + (localDepth * scale) / 2 - 7}
            text={`${Math.round(localDepth)} mm`}
            fontSize={14}
            fill="#0066cc"
            fontStyle="bold"
            rotation={-90}
          />

        {/* 그리드 */}
        {[...Array(10)].map((_, i) => (
          <React.Fragment key={`grid-${i}`}>
            <Line
              points={[
                offsetX + (localWidth * scale * i) / 10,
                offsetY,
                offsetX + (localWidth * scale * i) / 10,
                offsetY + localDepth * scale,
              ]}
              stroke="#e0e0e0"
              strokeWidth={1}
            />
            <Line
              points={[
                offsetX,
                offsetY + (localDepth * scale * i) / 10,
                offsetX + localWidth * scale,
                offsetY + (localDepth * scale * i) / 10,
              ]}
              stroke="#e0e0e0"
              strokeWidth={1}
            />
          </React.Fragment>
        ))}

        {/* 우물천장 영역 */}
        <Rect
          x={offsetX + ceilingStartX * scale}
          y={offsetY + ceilingStartY * scale}
          width={ceilingWidth * scale}
          height={ceilingDepth * scale}
          stroke="#FF6B6B"
          strokeWidth={2}
          dash={[10, 5]}
          fill="rgba(255, 107, 107, 0.05)"
        />
        <Text
          x={offsetX + ceilingStartX * scale + 10}
          y={offsetY + ceilingStartY * scale + 10}
          text="우물천장"
          fontSize={12}
          fill="#FF6B6B"
          fontStyle="bold"
        />

        {/* 우물천장 치수선 - 가로(내부 상단) */}
        <Line
          points={[
            offsetX + ceilingStartX * scale,
            offsetY + ceilingStartY * scale + 25,
            offsetX + (ceilingStartX + ceilingWidth) * scale,
            offsetY + ceilingStartY * scale + 25,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + ceilingStartX * scale,
            offsetY + ceilingStartY * scale + 20,
            offsetX + ceilingStartX * scale,
            offsetY + ceilingStartY * scale + 30,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + (ceilingStartX + ceilingWidth) * scale,
            offsetY + ceilingStartY * scale + 20,
            offsetX + (ceilingStartX + ceilingWidth) * scale,
            offsetY + ceilingStartY * scale + 30,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Text
          x={offsetX + (ceilingStartX + ceilingWidth / 2) * scale - 35}
          y={offsetY + ceilingStartY * scale + 10}
          text={`${Math.round(ceilingWidth)} mm`}
          fontSize={12}
          fill="#FF6B6B"
          fontStyle="bold"
        />

        {/* 우물천장 치수선 - 세로(내부 좌측) */}
        <Line
          points={[
            offsetX + ceilingStartX * scale + 25,
            offsetY + ceilingStartY * scale,
            offsetX + ceilingStartX * scale + 25,
            offsetY + (ceilingStartY + ceilingDepth) * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + ceilingStartX * scale + 20,
            offsetY + ceilingStartY * scale,
            offsetX + ceilingStartX * scale + 30,
            offsetY + ceilingStartY * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + ceilingStartX * scale + 20,
            offsetY + (ceilingStartY + ceilingDepth) * scale,
            offsetX + ceilingStartX * scale + 30,
            offsetY + (ceilingStartY + ceilingDepth) * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Text
          x={offsetX + ceilingStartX * scale + 10}
          y={offsetY + (ceilingStartY + ceilingDepth / 2) * scale - 7}
          text={`${Math.round(ceilingDepth)} mm`}
          fontSize={12}
          fill="#FF6B6B"
          fontStyle="bold"
          rotation={-90}
        />

        {/* Vibration Sensors */}
        {showVS && localVS.map((vs) => (
          <React.Fragment key={`vs-${vs.id}`}>
            <Circle
              x={offsetX + vs.x * scale}
              y={offsetY + vs.y * scale}
              radius={8}
              fill="#2196F3"
              stroke={selectedId === `vs-${vs.id}` ? '#ff9800' : '#1976D2'}
              strokeWidth={selectedId === `vs-${vs.id}` ? 3 : 1}
              draggable
              onDragEnd={(e: any) => handleDragEnd(e, vs.id, 'VS')}
              onClick={() => setSelectedId(`vs-${vs.id}`)}
            />
            <Text
              x={offsetX + vs.x * scale + 12}
              y={offsetY + vs.y * scale - 6}
              text={`VS-${vs.id}`}
              fontSize={10}
              fill="#000"
            />
          </React.Fragment>
        ))}

        {/* Speakers */}
        {showSPK && localSPK.map((spk) => {
          // 스피커 방향에 따른 크기 결정
          const isHorizontal = spk.edge === 'top' || spk.edge === 'bottom';
          const rectWidth = isHorizontal ? localSpeakerLength * scale : localSpeakerWidth * scale;
          const rectHeight = isHorizontal ? localSpeakerWidth * scale : localSpeakerLength * scale;
          
          return (
            <React.Fragment key={`spk-${spk.id}`}>
              <Rect
                x={offsetX + spk.x * scale - rectWidth / 2}
                y={offsetY + spk.y * scale - rectHeight / 2}
                width={rectWidth}
                height={rectHeight}
                fill="#F44336"
                stroke={selectedId === `spk-${spk.id}` ? '#ff9800' : '#D32F2F'}
                strokeWidth={selectedId === `spk-${spk.id}` ? 3 : 1}
                draggable
                onDragEnd={(e: any) => handleDragEnd(e, spk.id, 'SPK')}
                onClick={() => setSelectedId(`spk-${spk.id}`)}
              />
              <Text
                x={offsetX + spk.x * scale}
                y={offsetY + spk.y * scale}
                text={`S${spk.id}`}
                fontSize={11}
                fill="#FFFFFF"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={6}
                offsetY={6}
                rotation={isHorizontal ? 0 : 90}
              />
            </React.Fragment>
          );
        })}

        {/* 범례 */}
        <Rect x={20} y={stageHeight - 80} width={150} height={70} fill="#ffffff" stroke="#000" />
        <Circle x={35} y={stageHeight - 60} radius={6} fill="#2196F3" />
        <Text x={50} y={stageHeight - 65} text="Vibration Sensor" fontSize={12} />
        <Rect x={29} y={stageHeight - 36} width={12} height={12} fill="#F44336" />
        <Text x={50} y={stageHeight - 35} text="Speaker" fontSize={12} />

        {/* 스피커 간격 표시 - 상단과 우측만 표시 (대칭) */}
        {speakerGaps && (
          <React.Fragment>
            {/* 상단 gap - 왼쪽 첫 번째 스피커 위, 왼쪽 시작점 정렬 */}
            {speakerGaps.top !== undefined && (() => {
              const topSpeakers = localSPK.filter(spk => spk.edge === 'top').sort((a, b) => a.x - b.x);
              if (topSpeakers.length > 0) {
                const firstSpk = topSpeakers[0];
                // 스피커 왼쪽 시작점
                const speakerLeftStart = firstSpk.x - localSpeakerLength / 2;
                return (
                  <Text
                    x={offsetX + speakerLeftStart * scale}
                    y={offsetY + firstSpk.y * scale - 25}
                    text={`GAP: ${Math.round(speakerGaps.top)} mm`}
                    fontSize={11}
                    fill="#FF6B6B"
                    fontStyle="bold"
                  />
                );
              }
              return null;
            })()}
            {/* 우측 gap - 최상단 스피커 오른쪽, 위쪽 시작점 정렬 */}
            {speakerGaps.right !== undefined && (() => {
              const rightSpeakers = localSPK.filter(spk => spk.edge === 'right').sort((a, b) => a.y - b.y);
              if (rightSpeakers.length > 0) {
                const firstSpk = rightSpeakers[0];
                // 스피커 위쪽 시작점 (rotation 90도이므로)
                const speakerTopStart = firstSpk.y - localSpeakerLength / 2;
                return (
                  <Text
                    x={offsetX + firstSpk.x * scale + 25}
                    y={offsetY + speakerTopStart * scale}
                    text={`GAP: ${Math.round(speakerGaps.right)} mm`}
                    fontSize={11}
                    fill="#FF6B6B"
                    fontStyle="bold"
                    rotation={90}
                  />
                );
              }
              return null;
            })()}
          </React.Fragment>
        )}
      </Layer>
    </Stage>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              실시간 편집
            </Typography>
            
            <TextField
              fullWidth
              label="거실 가로 (mm)"
              type="number"
              value={localWidth}
              onChange={(e) => setLocalWidth(Number(e.target.value))}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <TextField
              fullWidth
              label="거실 세로 (mm)"
              type="number"
              value={localDepth}
              onChange={(e) => setLocalDepth(Number(e.target.value))}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <TextField
              fullWidth
              label="스피커 길이 (mm)"
              type="number"
              value={localSpeakerLength}
              onChange={(e) => setLocalSpeakerLength(Number(e.target.value))}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <TextField
              fullWidth
              label="스피커 폭 (mm)"
              type="number"
              value={localSpeakerWidth}
              onChange={(e) => setLocalSpeakerWidth(Number(e.target.value))}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <TextField
              fullWidth
              label="최소 스피커 간격 (mm)"
              type="number"
              value={localMinGap}
              onChange={(e) => setLocalMinGap(Number(e.target.value))}
              sx={{ mb: 2 }}
              size="small"
              helperText="스피커 사이 최소 간격"
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              현재 우물천장 크기:
            </Typography>
            <Typography variant="body2">
              가로: {Math.round(ceilingWidth)} mm
            </Typography>
            <Typography variant="body2">
              세로: {Math.round(ceilingDepth)} mm
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FloorPlanEditor;
