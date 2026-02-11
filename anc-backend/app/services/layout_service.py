import numpy as np
from scipy.spatial.distance import euclidean
from typing import List, Dict, Tuple


class LayoutService:
    """VS 및 SPK 자동 배치 서비스"""

    @staticmethod
    def calculate_vs_positions(width: float, depth: float, offset: float = 300) -> List[Dict]:
        """
        9개의 Vibration Sensor를 3x3 그리드로 배치
        
        Args:
            width: 거실 가로 길이 (mm)
            depth: 거실 세로 길이 (mm)
            offset: 벽면에서의 오프셋 (mm)
        
        Returns:
            센서 위치 리스트
        """
        effective_width = width - (2 * offset)
        effective_depth = depth - (2 * offset)
        
        x_spacing = effective_width / 2
        y_spacing = effective_depth / 2
        
        positions = []
        sensor_id = 1
        
        for row in range(3):
            for col in range(3):
                x = offset + (col * x_spacing)
                y = offset + (row * y_spacing)
                positions.append({
                    "id": sensor_id,
                    "x": round(x, 1),
                    "y": round(y, 1),
                    "type": "VS"
                })
                sensor_id += 1
        
        return positions

    @staticmethod
    def calculate_spk_positions(width: float, depth: float, 
                               total_speakers: int = 12, 
                               offset: float = 100) -> List[Dict]:
        """
        우물천장 라인을 따라 스피커 배치
        
        Args:
            width: 거실 가로 길이 (mm)
            depth: 거실 세로 길이 (mm)
            total_speakers: 총 스피커 개수
            offset: edge로부터의 오프셋 (mm)
        
        Returns:
            스피커 위치 리스트
        """
        perimeter = 2 * (width + depth)
        spacing = perimeter / total_speakers
        
        positions = []
        speaker_id = 1
        
        # 각 변에 배치될 스피커 수 계산
        top_count = int((width / perimeter) * total_speakers)
        right_count = int((depth / perimeter) * total_speakers)
        bottom_count = int((width / perimeter) * total_speakers)
        left_count = total_speakers - (top_count + right_count + bottom_count)
        
        # 상단
        for i in range(top_count):
            x = (width / (top_count + 1)) * (i + 1)
            y = offset
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "top"
            })
            speaker_id += 1
        
        # 우측
        for i in range(right_count):
            x = width - offset
            y = (depth / (right_count + 1)) * (i + 1)
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "right"
            })
            speaker_id += 1
        
        # 하단
        for i in range(bottom_count):
            x = width - ((width / (bottom_count + 1)) * (i + 1))
            y = depth - offset
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "bottom"
            })
            speaker_id += 1
        
        # 좌측
        for i in range(left_count):
            x = offset
            y = depth - ((depth / (left_count + 1)) * (i + 1))
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "left"
            })
            speaker_id += 1
        
        return positions[:total_speakers]

    @staticmethod
    def avoid_obstacles(positions: List[Dict], obstacles: List[Dict], 
                       min_distance: float = 300) -> List[Dict]:
        """
        장애물과의 최소 거리를 유지하도록 센서/스피커 위치 조정
        
        Args:
            positions: 디바이스 위치 리스트
            obstacles: 장애물 위치 리스트
            min_distance: 최소 안전 거리 (mm)
        
        Returns:
            조정된 위치 리스트
        """
        if not obstacles:
            return positions
        
        adjusted_positions = []
        
        for pos in positions:
            sensor_point = np.array([pos["x"], pos["y"]])
            needs_adjustment = False
            
            for obs in obstacles:
                obs_point = np.array([obs["x"], obs["y"]])
                distance = euclidean(sensor_point, obs_point)
                
                if distance < min_distance:
                    needs_adjustment = True
                    # 장애물 반대 방향으로 이동
                    direction = sensor_point - obs_point
                    if np.linalg.norm(direction) > 0:
                        direction = direction / np.linalg.norm(direction)
                        new_point = obs_point + direction * min_distance
                        sensor_point = new_point
            
            adjusted_positions.append({
                **pos,
                "x": round(float(sensor_point[0]), 1),
                "y": round(float(sensor_point[1]), 1),
                "adjusted": needs_adjustment
            })
        
        return adjusted_positions

    def auto_design(self, width: float, depth: float, 
                   obstacles: List[Dict] = None, offset: float = 300) -> Dict:
        """
        자동 설계 생성
        
        Args:
            width: 거실 가로 길이
            depth: 거실 세로 길이
            obstacles: 장애물 리스트
            offset: 오프셋
        
        Returns:
            설계 결과
        """
        # VS 배치
        vs_positions = self.calculate_vs_positions(width, depth, offset)
        
        # SPK 배치
        spk_positions = self.calculate_spk_positions(width, depth)
        
        # 간섭 회피
        if obstacles:
            vs_positions = self.avoid_obstacles(vs_positions, obstacles, 300)
            spk_positions = self.avoid_obstacles(spk_positions, obstacles, 200)
        
        # 제어기 위치 (기본값: 원점)
        controller_position = {"x": 0, "y": 0}
        
        return {
            "vs_positions": vs_positions,
            "spk_positions": spk_positions,
            "controller_position": controller_position
        }
