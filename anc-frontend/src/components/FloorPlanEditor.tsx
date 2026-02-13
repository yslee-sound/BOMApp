import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line } from 'react-konva';
import { Box, FormControlLabel, Checkbox, FormGroup, Paper, Typography, TextField, Grid, Button } from '@mui/material';
import { Device } from '../types';

interface FloorPlanEditorProps {
  width: number;
  depth: number;
  vsPositions: Device[];
  spkPositions: Device[];
  speakerLength?: number;  // 스피커 길이 (mm)
  speakerWidth?: number;   // 스피커 폭 (mm)
  ceilingWidth?: number;   // 우물천장 가로 (mm)
  ceilingDepth?: number;   // 우물천장 세로 (mm)
  ceilingStartX?: number;  // 우물천장 시작 X 좌표 (mm)
  ceilingStartY?: number;  // 우물천장 시작 Y 좌표 (mm)
  speakerGaps?: { top?: number; right?: number; bottom?: number; left?: number };
  onUpdatePositions: (vs: Device[], spk: Device[]) => void;
  onApplyChanges?: (params: {
    width: number;
    depth: number;
    ceilingWidth: number;
    ceilingDepth: number;
    ceilingStartX: number;
    ceilingStartY: number;
    minGap: number;
    maxGap: number;
    horizontalCount: number;
    verticalCount: number;
  }) => void;
  scale?: number;
}

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  width,
  depth,
  vsPositions,
  spkPositions,
  speakerLength = 600,
  speakerWidth = 130,
  ceilingWidth,
  ceilingDepth,
  ceilingStartX,
  ceilingStartY,
  speakerGaps,
  onUpdatePositions,
  onApplyChanges,
  scale = 0.15,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localVS, setLocalVS] = useState<Device[]>(vsPositions);
  const [localSPK, setLocalSPK] = useState<Device[]>(spkPositions);
  const [showVS, setShowVS] = useState<boolean>(true);
  const [showSPK, setShowSPK] = useState<boolean>(true);
  
  // 스피커 커스텀 이름 저장 (id -> 이름)
  const [speakerNames, setSpeakerNames] = useState<Map<number, string>>(new Map());
  
  // 숨김 스피커 ID 저장
  const [hiddenSpeakers, setHiddenSpeakers] = useState<Set<number>>(new Set());
  
  // Stage ref for keyboard events
  const stageRef = useRef<any>(null);
  
  // 최대 스피커 개수 계산 함수
  const calculateMaxSpeakerCount = (ceilingSize: number, minGap: number, speakerLen: number): number => {
    // 공식: count <= (ceilingSize - minGap) / (speakerLen + minGap)
    const maxCount = Math.floor((ceilingSize - minGap) / (speakerLen + minGap));
    return Math.max(1, maxCount); // 최소 1개
  };
  
  // 입력 필드용 임시 상태 (적용 버튼 누르기 전까지 도면에 반영되지 않음)
  const [inputWidth, setInputWidth] = useState<number>(width);
  const [inputDepth, setInputDepth] = useState<number>(depth);
  const [inputCeilingWidth, setInputCeilingWidth] = useState<number>(ceilingWidth || width * 0.7);
  const [inputCeilingDepth, setInputCeilingDepth] = useState<number>(ceilingDepth || depth * 0.7);
  const [inputCeilingStartX, setInputCeilingStartX] = useState<number>(ceilingStartX ?? (width - (ceilingWidth || width * 0.7)) / 2);
  const [inputCeilingStartY, setInputCeilingStartY] = useState<number>(ceilingStartY ?? (depth - (ceilingDepth || depth * 0.7)) / 2);
  const [inputMinGap, setInputMinGap] = useState<number>(100); // 최소 스피커 간격
  const [inputMaxGap, setInputMaxGap] = useState<number>(600); // 최대 스피커 간격
  const [inputHorizontalCount, setInputHorizontalCount] = useState<number>(2); // 가로 스피커 개수
  const [inputVerticalCount, setInputVerticalCount] = useState<number>(2); // 세로 스피커 개수

  // 도면 렌더링에는 props로 받은 값 사용 (적용된 값만 표시)
  const stageWidth = Math.max(800, width * scale + 100);
  const stageHeight = Math.max(600, depth * scale + 100);
  const offsetX = 50;
  const offsetY = 50;

  // 우물천장 크기 계산 (실사 데이터에서 입력한 값 우선 사용)
  let finalCeilingWidth: number;
  let finalCeilingDepth: number;
  
  if (ceilingWidth && ceilingDepth) {
    // 실사에서 입력한 우물천장 크기 사용
    finalCeilingWidth = ceilingWidth;
    finalCeilingDepth = ceilingDepth;
  } else {
    // 자동 계산 (기본 비율 0.70 적용)
    finalCeilingWidth = width * 0.70;
    finalCeilingDepth = depth * 0.70;
  }
  
  // 우물천장 시작점 계산 (props에서 받거나 중앙 배치)
  const finalCeilingStartX = ceilingStartX ?? (width - finalCeilingWidth) / 2;
  const finalCeilingStartY = ceilingStartY ?? (depth - finalCeilingDepth) / 2;

  useEffect(() => {
    setLocalVS(vsPositions);
    setLocalSPK(spkPositions);
  }, [vsPositions, spkPositions]);
  
  // 키보드 이벤트 핸들러: 'h' 키로 스피커 숨기기/보이기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        if (selectedId && selectedId.startsWith('spk-')) {
          const speakerId = parseInt(selectedId.replace('spk-', ''));
          setHiddenSpeakers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(speakerId)) {
              newSet.delete(speakerId);
              console.log(`스피커 ${speakerId} 표시`);
            } else {
              newSet.add(speakerId);
              console.log(`스피커 ${speakerId} 숨김`);
            }
            return newSet;
          });
          // 숨긴 후 선택 해제
          setSelectedId(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId]);
  
  // props가 변경되면 입력 필드도 업데이트
  useEffect(() => {
    setInputWidth(width);
    setInputDepth(depth);
    const newCeilingWidth = ceilingWidth || width * 0.7;
    const newCeilingDepth = ceilingDepth || depth * 0.7;
    setInputCeilingWidth(newCeilingWidth);
    setInputCeilingDepth(newCeilingDepth);
    setInputCeilingStartX(ceilingStartX ?? (width - newCeilingWidth) / 2);
    setInputCeilingStartY(ceilingStartY ?? (depth - newCeilingDepth) / 2);
  }, [width, depth, ceilingWidth, ceilingDepth, ceilingStartX, ceilingStartY]);

  // 우물천장 크기나 최소 간격 변경 시 스피커 개수 검증
  useEffect(() => {
    const maxHorizontal = calculateMaxSpeakerCount(inputCeilingWidth, inputMinGap, speakerLength);
    const maxVertical = calculateMaxSpeakerCount(inputCeilingDepth, inputMinGap, speakerLength);
    
    // 현재 입력된 개수가 최대값을 초과하면 조정
    if (inputHorizontalCount > maxHorizontal) {
      setInputHorizontalCount(maxHorizontal);
      console.warn(`가로 스피커 개수가 ${maxHorizontal}개로 조정되었습니다.`);
    }
    if (inputVerticalCount > maxVertical) {
      setInputVerticalCount(maxVertical);
      console.warn(`세로 스피커 개수가 ${maxVertical}개로 조정되었습니다.`);
    }
  }, [inputCeilingWidth, inputCeilingDepth, inputMinGap, speakerLength]);

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

  const handleSpeakerNameEdit = (speakerId: number) => {
    const currentName = speakerNames.get(speakerId) || `S${speakerId}`;
    const newName = prompt('스피커 이름 입력:', currentName);
    
    if (newName !== null && newName.trim() !== '') {
      setSpeakerNames(new Map(speakerNames.set(speakerId, newName.trim())));
    }
  };

  const getSpeakerName = (speakerId: number): string => {
    return speakerNames.get(speakerId) || `S${speakerId}`;
  };

  const formatSpeakerName = (speakerId: number, isVertical: boolean): string => {
    const name = getSpeakerName(speakerId);
    // 세로변(좌/우측)인 경우 각 글자마다 줄바꿈
    if (isVertical) {
      return name.split('').join('\n');
    }
    return name;
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
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa' }}>
      <Stage 
        width={stageWidth} 
        height={stageHeight}
        ref={stageRef}
        tabIndex={1}
      >
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
            text={`${Math.round(width)} mm`}
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
            text={`${Math.round(depth)} mm`}
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
          x={offsetX + finalCeilingStartX * scale}
          y={offsetY + finalCeilingStartY * scale}
          width={finalCeilingWidth * scale}
          height={finalCeilingDepth * scale}
          stroke="#FF6B6B"
          strokeWidth={2}
          dash={[10, 5]}
          fill="rgba(255, 107, 107, 0.05)"
        />
        <Text
          x={offsetX + finalCeilingStartX * scale + 10}
          y={offsetY + finalCeilingStartY * scale + 10}
          text="우물천장"
          fontSize={12}
          fill="#FF6B6B"
          fontStyle="bold"
        />

        {/* 우물천장 시작점 좌표 표시 */}
        <Circle
          x={offsetX + finalCeilingStartX * scale}
          y={offsetY + finalCeilingStartY * scale}
          radius={4}
          fill="#FF6B6B"
        />
        <Text
          x={offsetX + finalCeilingStartX * scale - 60}
          y={offsetY + finalCeilingStartY * scale - 25}
          text={`시작점 (${Math.round(finalCeilingStartX)}, ${Math.round(finalCeilingStartY)})`}
          fontSize={10}
          fill="#FF6B6B"
          fontStyle="bold"
        />

        {/* 우물천장 치수선 - 가로(내부 상단) */}
        <Line
          points={[
            offsetX + finalCeilingStartX * scale,
            offsetY + finalCeilingStartY * scale + 25,
            offsetX + (finalCeilingStartX + finalCeilingWidth) * scale,
            offsetY + finalCeilingStartY * scale + 25,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + finalCeilingStartX * scale,
            offsetY + finalCeilingStartY * scale + 20,
            offsetX + finalCeilingStartX * scale,
            offsetY + finalCeilingStartY * scale + 30,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + (finalCeilingStartX + finalCeilingWidth) * scale,
            offsetY + finalCeilingStartY * scale + 20,
            offsetX + (finalCeilingStartX + finalCeilingWidth) * scale,
            offsetY + finalCeilingStartY * scale + 30,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Text
          x={offsetX + (finalCeilingStartX + finalCeilingWidth / 2) * scale - 35}
          y={offsetY + finalCeilingStartY * scale + 10}
          text={`${Math.round(finalCeilingWidth)} mm`}
          fontSize={12}
          fill="#FF6B6B"
          fontStyle="bold"
        />

        {/* 우물천장 치수선 - 세로(내부 좌측) */}
        <Line
          points={[
            offsetX + finalCeilingStartX * scale + 25,
            offsetY + finalCeilingStartY * scale,
            offsetX + finalCeilingStartX * scale + 25,
            offsetY + (finalCeilingStartY + finalCeilingDepth) * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + finalCeilingStartX * scale + 20,
            offsetY + finalCeilingStartY * scale,
            offsetX + finalCeilingStartX * scale + 30,
            offsetY + finalCeilingStartY * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Line
          points={[
            offsetX + finalCeilingStartX * scale + 20,
            offsetY + (finalCeilingStartY + finalCeilingDepth) * scale,
            offsetX + finalCeilingStartX * scale + 30,
            offsetY + (finalCeilingStartY + finalCeilingDepth) * scale,
          ]}
          stroke="#FF6B6B"
          strokeWidth={1}
        />
        <Text
          x={offsetX + finalCeilingStartX * scale + 10}
          y={offsetY + (finalCeilingStartY + finalCeilingDepth / 2) * scale - 7}
          text={`${Math.round(finalCeilingDepth)} mm`}
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
          const isHidden = hiddenSpeakers.has(spk.id);
          const isSelected = selectedId === `spk-${spk.id}`;
          // 숨김 스피커는 fill만 반투명, 테두리는 선명하게
          const fillColor = isHidden ? 'rgba(244, 67, 54, 0.3)' : '#F44336';
          const textOpacity = isHidden ? 0.3 : 1;
          
          return (
            <React.Fragment key={`spk-${spk.id}`}>
              <Rect
                x={offsetX + spk.x * scale - rectWidth / 2}
                y={offsetY + spk.y * scale - rectHeight / 2}
                width={rectWidth}
                height={rectHeight}
                fill={fillColor}
                stroke={isSelected ? '#FF6F00' : '#D32F2F'}
                strokeWidth={isSelected ? 3 : 1}
                dash={isHidden ? [10, 5] : undefined}
                draggable
                onDragEnd={(e: any) => handleDragEnd(e, spk.id, 'SPK')}
                onClick={() => setSelectedId(`spk-${spk.id}`)}
              />
              <Text
                x={offsetX + spk.x * scale - rectWidth / 2}
                y={offsetY + spk.y * scale - rectHeight / 2}
                width={rectWidth}
                height={rectHeight}
                text={formatSpeakerName(spk.id, !isHorizontal)}
                fontSize={11}
                fill="#FFFFFF"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                rotation={0}
                opacity={textOpacity}
                listening={true}
                onDblClick={() => handleSpeakerNameEdit(spk.id)}
                onClick={() => setSelectedId(`spk-${spk.id}`)}
                onMouseEnter={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'default';
                  }
                }}
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
                const speakerLeftStart = firstSpk.x - speakerLength / 2;
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
                const speakerTopStart = firstSpk.y - speakerLength / 2;
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
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              편집
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="거실 가로 (mm)"
                  type="number"
                  value={inputWidth}
                  onChange={(e) => setInputWidth(Number(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="거실 세로 (mm)"
                  type="number"
                  value={inputDepth}
                  onChange={(e) => setInputDepth(Number(e.target.value))}
                  size="small"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="우물천장 가로 (mm)"
                  type="number"
                  value={inputCeilingWidth}
                  onChange={(e) => setInputCeilingWidth(Number(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="우물천장 세로 (mm)"
                  type="number"
                  value={inputCeilingDepth}
                  onChange={(e) => setInputCeilingDepth(Number(e.target.value))}
                  size="small"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="우물천장 시작 X (mm)"
                  type="number"
                  value={inputCeilingStartX}
                  onChange={(e) => setInputCeilingStartX(Number(e.target.value))}
                  size="small"
                  helperText="좌상단 X 좌표"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="우물천장 시작 Y (mm)"
                  type="number"
                  value={inputCeilingStartY}
                  onChange={(e) => setInputCeilingStartY(Number(e.target.value))}
                  size="small"
                  helperText="좌상단 Y 좌표"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="최소 스피커 간격 (mm)"
                  type="number"
                  value={inputMinGap}
                  onChange={(e) => setInputMinGap(Number(e.target.value))}
                  size="small"
                  helperText="스피커 최소 간격"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="최대 스피커 간격 (mm)"
                  type="number"
                  value={inputMaxGap}
                  onChange={(e) => setInputMaxGap(Number(e.target.value))}
                  size="small"
                  helperText="스피커 최대 간격"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="가로 스피커 개수"
                  type="number"
                  value={inputHorizontalCount}
                  onChange={(e) => {
                    const maxCount = calculateMaxSpeakerCount(inputCeilingWidth, inputMinGap, speakerLength);
                    const value = Math.min(Number(e.target.value), maxCount);
                    setInputHorizontalCount(Math.max(1, value));
                  }}
                  size="small"
                  helperText={`최대: ${calculateMaxSpeakerCount(inputCeilingWidth, inputMinGap, speakerLength)}개`}
                  inputProps={{ min: 1, max: calculateMaxSpeakerCount(inputCeilingWidth, inputMinGap, speakerLength) }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="세로 스피커 개수"
                  type="number"
                  value={inputVerticalCount}
                  onChange={(e) => {
                    const maxCount = calculateMaxSpeakerCount(inputCeilingDepth, inputMinGap, speakerLength);
                    const value = Math.min(Number(e.target.value), maxCount);
                    setInputVerticalCount(Math.max(1, value));
                  }}
                  size="small"
                  helperText={`최대: ${calculateMaxSpeakerCount(inputCeilingDepth, inputMinGap, speakerLength)}개`}
                  inputProps={{ min: 1, max: calculateMaxSpeakerCount(inputCeilingDepth, inputMinGap, speakerLength) }}
                />
              </Grid>
            </Grid>
            
            {onApplyChanges && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => onApplyChanges({
                  width: inputWidth,
                  depth: inputDepth,
                  ceilingWidth: inputCeilingWidth,
                  ceilingDepth: inputCeilingDepth,
                  ceilingStartX: inputCeilingStartX,
                  ceilingStartY: inputCeilingStartY,
                  minGap: inputMinGap,
                  maxGap: inputMaxGap,
                  horizontalCount: inputHorizontalCount,
                  verticalCount: inputVerticalCount,
                })}
                sx={{ mb: 2 }}
              >
                적용
              </Button>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              현재 우물천장:
            </Typography>
            <Typography variant="body2">
              크기: {Math.round(finalCeilingWidth)} × {Math.round(finalCeilingDepth)} mm
            </Typography>
            <Typography variant="body2">
              시작점: ({Math.round(finalCeilingStartX)}, {Math.round(finalCeilingStartY)}) mm
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FloorPlanEditor;
