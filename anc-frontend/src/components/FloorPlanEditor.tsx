import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line } from 'react-konva';
import { Box, FormControlLabel, Checkbox, FormGroup, Paper, Typography } from '@mui/material';
import { Device } from '../types';

interface FloorPlanEditorProps {
  width: number;
  depth: number;
  vsPositions: Device[];
  spkPositions: Device[];
  speakerLength?: number;  // 스피커 길이 (mm)
  speakerWidth?: number;   // 스피커 폭 (mm)
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
  onUpdatePositions,
  scale = 0.15,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localVS, setLocalVS] = useState<Device[]>(vsPositions);
  const [localSPK, setLocalSPK] = useState<Device[]>(spkPositions);
  const [showVS, setShowVS] = useState<boolean>(true);
  const [showSPK, setShowSPK] = useState<boolean>(true);

  const stageWidth = Math.max(800, width * scale + 100);
  const stageHeight = Math.max(600, depth * scale + 100);
  const offsetX = 50;
  const offsetY = 50;

  // 우물천장 크기 계산 (백엔드 로직과 동일)
  const aspectRatio = Math.max(width, depth) / Math.min(width, depth);
  let ceilingRatio = 0.65;
  if (aspectRatio > 1.5) {
    ceilingRatio = 0.75;
  } else if (aspectRatio > 1.2) {
    ceilingRatio = 0.70;
  }
  
  const ceilingWidth = width * ceilingRatio;
  const ceilingDepth = depth * ceilingRatio;
  const ceilingStartX = (width - ceilingWidth) / 2;
  const ceilingStartY = (depth - ceilingDepth) / 2;

  useEffect(() => {
    setLocalVS(vsPositions);
    setLocalSPK(spkPositions);
  }, [vsPositions, spkPositions]);

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
      
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          {/* 거실 외곽선 */}
          <Rect
            x={offsetX}
            y={offsetY}
            width={width * scale}
            height={depth * scale}
            stroke="#000000"
            strokeWidth={2}
            fill="#f5f5f5"
          />

          {/* 치수선 - 가로(상단) */}
          <Line
            points={[
              offsetX,
              offsetY - 20,
              offsetX + width * scale,
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
              offsetX + width * scale,
              offsetY - 25,
              offsetX + width * scale,
              offsetY - 15,
            ]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Text
            x={offsetX + (width * scale) / 2 - 30}
            y={offsetY - 35}
            text={`${width} mm`}
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
              offsetY + depth * scale,
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
              offsetY + depth * scale,
              offsetX - 15,
              offsetY + depth * scale,
            ]}
            stroke="#0066cc"
            strokeWidth={1}
          />
          <Text
            x={offsetX - 38}
            y={offsetY + (depth * scale) / 2 - 7}
            text={`${depth} mm`}
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
                offsetX + (width * scale * i) / 10,
                offsetY,
                offsetX + (width * scale * i) / 10,
                offsetY + depth * scale,
              ]}
              stroke="#e0e0e0"
              strokeWidth={1}
            />
            <Line
              points={[
                offsetX,
                offsetY + (depth * scale * i) / 10,
                offsetX + width * scale,
                offsetY + (depth * scale * i) / 10,
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

        {/* 우물천장 치수선 - 가로(상단) */}
        <Line
          points={[
            offsetX + ceilingStartX * scale,
            offsetY + ceilingStartY * scale - 15,
            offsetX + (ceilingStartX + ceilingWidth) * scale,
            offsetY + ceilingStartY * scale - 15,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + ceilingStartX * scale,
            offsetY + ceilingStartY * scale - 20,
            offsetX + ceilingStartX * scale,
            offsetY + ceilingStartY * scale - 10,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + (ceilingStartX + ceilingWidth) * scale,
            offsetY + ceilingStartY * scale - 20,
            offsetX + (ceilingStartX + ceilingWidth) * scale,
            offsetY + ceilingStartY * scale - 10,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Text
          x={offsetX + (ceilingStartX + ceilingWidth / 2) * scale - 35}
          y={offsetY + ceilingStartY * scale - 30}
          text={`${Math.round(ceilingWidth)} mm`}
          fontSize={12}
          fill="#FF6B6B"
          fontStyle="bold"
        />

        {/* 우물천장 치수선 - 세로(좌측) */}
        <Line
          points={[
            offsetX + ceilingStartX * scale - 15,
            offsetY + ceilingStartY * scale,
            offsetX + ceilingStartX * scale - 15,
            offsetY + (ceilingStartY + ceilingDepth) * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + ceilingStartX * scale - 20,
            offsetY + ceilingStartY * scale,
            offsetX + ceilingStartX * scale - 10,
            offsetY + ceilingStartY * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + ceilingStartX * scale - 20,
            offsetY + (ceilingStartY + ceilingDepth) * scale,
            offsetX + ceilingStartX * scale - 10,
            offsetY + (ceilingStartY + ceilingDepth) * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Text
          x={offsetX + ceilingStartX * scale - 38}
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
          const rectWidth = isHorizontal ? speakerLength * scale : speakerWidth * scale;
          const rectHeight = isHorizontal ? speakerWidth * scale : speakerLength * scale;
          
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
                x={offsetX + spk.x * scale + rectWidth / 2 + 5}
                y={offsetY + spk.y * scale - 6}
                text={`SPK-${spk.id}`}
                fontSize={10}
                fill="#000"
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
      </Layer>
    </Stage>
    </Box>
  );
};

export default FloorPlanEditor;
