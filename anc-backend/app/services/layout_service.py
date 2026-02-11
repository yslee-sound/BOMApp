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
        거실 중앙의 우물천장 라인을 따라 스피커 배치
        
        Args:
            width: 거실 가로 길이 (mm)
            depth: 거실 세로 길이 (mm)
            total_speakers: 총 스피커 개수 (10~12개)
            offset: 우물천장 여유 공간 (mm) - 거실 외곽에서 우물천장까지의 거리
        
        Returns:
            스피커 위치 리스트
        """
        # 스피커 개수 제한 (10~12개)
        total_speakers = max(10, min(12, total_speakers))
        
        # 거실 모양 분석 (장변/단변 비율)
        aspect_ratio = max(width, depth) / min(width, depth)
        
        # 우물천장 크기 계산 (거실 크기의 60~75%)
        # 장방형일수록 크게, 정사각형에 가까울수록 작게
        if aspect_ratio > 1.5:  # 장방형
            ceiling_ratio = 0.75
        elif aspect_ratio > 1.2:  # 약간 긴 형태
            ceiling_ratio = 0.70
        else:  # 정사각형에 가까움
            ceiling_ratio = 0.65
        
        # 우물천장 크기
        ceiling_width = width * ceiling_ratio
        ceiling_depth = depth * ceiling_ratio
        
        # 우물천장 시작점 (중앙 배치)
        ceiling_start_x = (width - ceiling_width) / 2
        ceiling_start_y = (depth - ceiling_depth) / 2
        
        # 우물천장 끝점
        ceiling_end_x = ceiling_start_x + ceiling_width
        ceiling_end_y = ceiling_start_y + ceiling_depth
        
        # 우물천장 둘레
        ceiling_perimeter = 2 * (ceiling_width + ceiling_depth)
        
        # 각 변에 배치할 스피커 개수 계산 (둘레 비율에 따라)
        width_ratio = ceiling_width / ceiling_perimeter
        depth_ratio = ceiling_depth / ceiling_perimeter
        
        # 각 변의 스피커 개수 (최소 2개씩 배치)
        top_count = max(2, round(total_speakers * width_ratio))
        bottom_count = max(2, round(total_speakers * width_ratio))
        left_count = max(2, round(total_speakers * depth_ratio))
        right_count = total_speakers - (top_count + bottom_count + left_count)
        right_count = max(2, right_count)
        
        # 개수 조정 (합이 total_speakers가 되도록)
        while (top_count + bottom_count + left_count + right_count) > total_speakers:
            if top_count > 2:
                top_count -= 1
            elif bottom_count > 2:
                bottom_count -= 1
            elif left_count > 2:
                left_count -= 1
            elif right_count > 2:
                right_count -= 1
        
        while (top_count + bottom_count + left_count + right_count) < total_speakers:
            if top_count == bottom_count and top_count < (total_speakers // 4 + 1):
                top_count += 1
            elif bottom_count < top_count:
                bottom_count += 1
            elif left_count == right_count and left_count < (total_speakers // 4 + 1):
                left_count += 1
            elif right_count < left_count:
                right_count += 1
        
        positions = []
        speaker_id = 1
        
        # 상단 (좌→우)
        for i in range(top_count):
            x = ceiling_start_x + (ceiling_width / (top_count - 1)) * i if top_count > 1 else ceiling_start_x + ceiling_width / 2
            y = ceiling_start_y
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "top"
            })
            speaker_id += 1
        
        # 우측 (상→하) - 모서리 제외
        for i in range(1, right_count + 1):
            x = ceiling_end_x
            y = ceiling_start_y + (ceiling_depth / (right_count + 1)) * i
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "right"
            })
            speaker_id += 1
        
        # 하단 (우→좌)
        for i in range(bottom_count):
            x = ceiling_end_x - (ceiling_width / (bottom_count - 1)) * i if bottom_count > 1 else ceiling_start_x + ceiling_width / 2
            y = ceiling_end_y
            positions.append({
                "id": speaker_id,
                "x": round(x, 1),
                "y": round(y, 1),
                "type": "SPK",
                "edge": "bottom"
            })
            speaker_id += 1
        
        # 좌측 (하→상) - 모서리 제외
        for i in range(1, left_count + 1):
            x = ceiling_start_x
            y = ceiling_end_y - (ceiling_depth / (left_count + 1)) * i
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
