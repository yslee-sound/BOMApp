import numpy as np
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
                               total_speakers: int = None,  # None이면 자동 계산
                               offset: float = 100,
                               speaker_width: float = 130,
                               speaker_length: float = 600,
                               min_gap: float = 100,
                               max_gap: float = 600,
                               horizontal_count: int = None,
                               vertical_count: int = None,
                               ceiling_width: float = None,  # 실사에서 입력한 우물천장 가로
                               ceiling_depth: float = None,  # 실사에서 입력한 우물천장 세로
                               ceiling_start_x: float = None,  # 우물천장 시작점 X 좌표
                               ceiling_start_y: float = None) -> Tuple[List[Dict], Dict[str, float]]:  # 우물천장 시작점 Y 좌표
        """
        거실 중앙의 우물천장 라인을 따라 스피커 배치
        스피커는 우물천장 라인 바깥쪽(거실 외곽 방향)에 붙어서 배치
        
        Args:
            width: 거실 가로 길이 (mm)
            depth: 거실 세로 길이 (mm)
            total_speakers: 총 스피커 개수 (None이면 자동 계산)
            offset: 우물천장 여유 공간 (mm) - 거실 외곽에서 우물천장까지의 거리
            speaker_width: 스피커 폭 (mm) - 기본값 130mm
            speaker_length: 스피커 길이 (mm) - 기본값 600mm
            min_gap: 최소 스피커 간격 (mm) - 기본값 100mm
            max_gap: 최대 스피커 간격 (mm) - 기본값 600mm
            horizontal_count: 가로 스피커 개수 (None이면 자동 계산)
            vertical_count: 세로 스피커 개수 (None이면 자동 계산)
            ceiling_width: 실사에서 입력한 우물천장 가로 (None이면 자동 계산)
            ceiling_depth: 실사에서 입력한 우물천장 세로 (None이면 자동 계산)
            ceiling_start_x: 우물천장 시작점 X 좌표 (None이면 중앙 배치)
            ceiling_start_y: 우물천장 시작점 Y 좌표 (None이면 중앙 배치)
        
        Returns:
            (스피커 위치 리스트, 각 변의 gap 정보)
        """
        # 사용자가 우물천장 크기를 명시적으로 지정했는지 확인
        user_defined_ceiling = (ceiling_width is not None and ceiling_depth is not None)
        
        # 우물천장 크기가 실사에서 입력된 경우 그 값을 사용
        if user_defined_ceiling:
            print(f"[DEBUG] Using user-defined ceiling size - Width: {ceiling_width}, Depth: {ceiling_depth}")
            initial_ceiling_width = ceiling_width
            initial_ceiling_depth = ceiling_depth
        else:
            # 거실 모양 분석 (장변/단변 비율)
            aspect_ratio = max(width, depth) / min(width, depth)
            
            # 초기 우물천장 크기 계산 (거실 크기의 60~75%)
            if aspect_ratio > 1.5:  # 장방형
                ceiling_ratio = 0.75
            elif aspect_ratio > 1.2:  # 약간 긴 형태
                ceiling_ratio = 0.70
            else:  # 정사각형에 가까움
                ceiling_ratio = 0.65
            
            # 초기 우물천장 크기
            initial_ceiling_width = width * ceiling_ratio
            initial_ceiling_depth = depth * ceiling_ratio
            print(f"[DEBUG] Auto-calculated ceiling size - Width: {initial_ceiling_width}, Depth: {initial_ceiling_depth}")
        
        # 각 변에 배치 가능한 최대 스피커 개수 계산 (min_gap 기준)
        # 공식: 각 변 길이 = min_gap × (count + 1) + speaker_length × count
        # 정리: count <= (각 변 길이 - min_gap) / (speaker_length + min_gap)
        max_width_count = int((initial_ceiling_width - min_gap) / (speaker_length + min_gap))
        max_depth_count = int((initial_ceiling_depth - min_gap) / (speaker_length + min_gap))
        
        # 최소 2개는 배치 (단, 물리적으로 불가능하면 1개)
        if max_width_count < 2:
            # 2개도 안 들어가는지 확인
            required_for_2 = min_gap * 3 + speaker_length * 2
            if initial_ceiling_width >= required_for_2:
                max_width_count = 2
            else:
                max_width_count = max(1, max_width_count)
        else:
            max_width_count = max(2, max_width_count)
            
        if max_depth_count < 2:
            required_for_2 = min_gap * 3 + speaker_length * 2
            if initial_ceiling_depth >= required_for_2:
                max_depth_count = 2
            else:
                max_depth_count = max(1, max_depth_count)
        else:
            max_depth_count = max(2, max_depth_count)
        
        print(f"[DEBUG] Max speaker counts based on ceiling size - Width: {max_width_count}, Depth: {max_depth_count}")
        
        # total_speakers가 None이면 최대 개수로 자동 계산
        if total_speakers is None:
            total_speakers = 2 * (max_width_count + max_depth_count)
        else:
            # 지정된 경우에도 최대 개수 제한
            max_total = 2 * (max_width_count + max_depth_count)
            total_speakers = min(total_speakers, max_total)
        
        # 최소 8개는 배치
        total_speakers = max(8, total_speakers)
        
        # 사용자가 지정한 개수를 그대로 사용 (항상 입력된 값 우선, 단 최대 개수 제한)
        if horizontal_count is not None and vertical_count is not None:
            # 입력된 값 사용하되 우물천장 크기에 배치 가능한 최대 개수로 제한
            top_count = min(max(1, horizontal_count), max_width_count)
            bottom_count = top_count
            left_count = min(max(1, vertical_count), max_depth_count)
            right_count = left_count
            
            # 입력값이 최대값을 초과하면 로그 출력
            if horizontal_count > max_width_count:
                print(f"[WARNING] Horizontal count {horizontal_count} exceeds maximum {max_width_count}. Adjusted to {max_width_count}.")
            if vertical_count > max_depth_count:
                print(f"[WARNING] Vertical count {vertical_count} exceeds maximum {max_depth_count}. Adjusted to {max_depth_count}.")
            
            # 수동 지정 시 total_speakers 재계산
            total_speakers = top_count + bottom_count + left_count + right_count
        else:
            # horizontal_count나 vertical_count가 없으면 자동 계산
            # 우물천장 둘레 비율 계산
            perimeter = 2 * (initial_ceiling_width + initial_ceiling_depth)
            width_ratio = initial_ceiling_width / perimeter
            depth_ratio = initial_ceiling_depth / perimeter
            
            # 각 변의 스피커 개수 초기 배분 (비율 기반)
            top_count = max(2, min(max_width_count, round(total_speakers * width_ratio)))
            bottom_count = max(2, min(max_width_count, round(total_speakers * width_ratio)))
            left_count = max(2, min(max_depth_count, round(total_speakers * depth_ratio)))
            right_count = total_speakers - (top_count + bottom_count + left_count)
            right_count = max(2, min(max_depth_count, right_count))
            
            # 개수 조정 (합이 total_speakers가 되고 max 제약 만족)
            while (top_count + bottom_count + left_count + right_count) > total_speakers:
                if top_count > 2 and top_count <= max_width_count:
                    top_count -= 1
                elif bottom_count > 2 and bottom_count <= max_width_count:
                    bottom_count -= 1
                elif left_count > 2 and left_count <= max_depth_count:
                    left_count -= 1
                elif right_count > 2 and right_count <= max_depth_count:
                    right_count -= 1
                else:
                    break
            
            while (top_count + bottom_count + left_count + right_count) < total_speakers:
                if top_count < max_width_count and top_count == bottom_count:
                    top_count += 1
                elif bottom_count < max_width_count and bottom_count < top_count:
                    bottom_count += 1
                elif left_count < max_depth_count and left_count == right_count:
                    left_count += 1
                elif right_count < max_depth_count and right_count < left_count:
                    right_count += 1
                else:
                    break
        
        # 실제 필요한 우물천장 크기 계산
        # 사용자 지정된 스피커 개수 기준으로 정확히 계산
        required_ceiling_width = (speaker_length * top_count) + (min_gap * (top_count + 1))
        required_ceiling_depth = (speaker_length * max(left_count, right_count)) + (min_gap * (max(left_count, right_count) + 1))
        
        print(f"[DEBUG] Speaker counts - Top: {top_count}, Bottom: {bottom_count}, Left: {left_count}, Right: {right_count}")
        print(f"[DEBUG] Required ceiling - Width: {required_ceiling_width}, Depth: {required_ceiling_depth}")
        
        # 우물천장 크기 결정
        if user_defined_ceiling:
            # 사용자가 우물천장 크기를 명시적으로 입력한 경우: 입력값을 그대로 사용
            final_ceiling_width = initial_ceiling_width
            final_ceiling_depth = initial_ceiling_depth
            print(f"[DEBUG] User-defined mode - Final ceiling - Width: {final_ceiling_width}, Depth: {final_ceiling_depth}")
        elif horizontal_count is not None and vertical_count is not None:
            # 스피커 개수를 수동 지정한 경우: 필요한 크기를 그대로 사용 (거실 크기의 90%까지 허용)
            final_ceiling_width = min(required_ceiling_width, width * 0.9)
            final_ceiling_depth = min(required_ceiling_depth, depth * 0.9)
            print(f"[DEBUG] Manual speaker count mode - Final ceiling - Width: {final_ceiling_width}, Depth: {final_ceiling_depth}")
        else:
            # 자동 계산 시: 초기 크기와 필요 크기 중 큰 것 사용
            final_ceiling_width = max(initial_ceiling_width, required_ceiling_width)
            final_ceiling_depth = max(initial_ceiling_depth, required_ceiling_depth)
            # 거실 크기를 넘지 않도록 제한
            final_ceiling_width = min(final_ceiling_width, width * 0.9)
            final_ceiling_depth = min(final_ceiling_depth, depth * 0.9)
            print(f"[DEBUG] Auto mode - Final ceiling - Width: {final_ceiling_width}, Depth: {final_ceiling_depth}")
        
        # 우물천장 시작점: 사용자가 지정하면 그 값 사용, 없으면 중앙 배치
        if ceiling_start_x is not None and ceiling_start_y is not None:
            final_ceiling_start_x = ceiling_start_x
            final_ceiling_start_y = ceiling_start_y
            print(f"[DEBUG] Using user-defined ceiling position - X: {final_ceiling_start_x}, Y: {final_ceiling_start_y}")
        else:
            final_ceiling_start_x = (width - final_ceiling_width) / 2
            final_ceiling_start_y = (depth - final_ceiling_depth) / 2
            print(f"[DEBUG] Using centered ceiling position - X: {final_ceiling_start_x}, Y: {final_ceiling_start_y}")
        
        # 우물천장 끝점
        ceiling_end_x = final_ceiling_start_x + final_ceiling_width
        ceiling_end_y = final_ceiling_start_y + final_ceiling_depth
        
        positions = []
        speaker_id = 1
        gaps = {}  # 각 변의 gap 정보 저장
        
        # 스피커 폭의 절반 (스피커를 우물천장 라인 바깥으로 배치하기 위해)
        half_speaker_width = speaker_width / 2
        
        # 상단 (좌→우) - 우물천장 라인 위쪽(거실 외곽 방향)
        # 스피커 외곽 기준 등간격 배치: 시작-스피커외곽, 스피커외곽-스피커외곽, 스피커외곽-끝 모두 동일
        if top_count > 0:
            # 총 스피커 길이
            total_speaker_length = speaker_length * top_count
            # 남은 여백
            remaining_space = final_ceiling_width - total_speaker_length
            # 간격 (시작, 중간, 끝)
            gap = remaining_space / (top_count + 1)
            gaps['top'] = round(gap, 1)
            
            for i in range(top_count):
                # i번째 스피커 중심 = 간격*(i+1) + 스피커길이*i + 스피커길이/2
                x = final_ceiling_start_x + gap * (i + 1) + speaker_length * (i + 0.5)
                y = final_ceiling_start_y - half_speaker_width
                positions.append({
                    "id": speaker_id,
                    "x": round(x, 1),
                    "y": round(y, 1),
                    "type": "SPK",
                    "edge": "top"
                })
                speaker_id += 1
        
        # 우측 (상→하) - 우물천장 라인 오른쪽(거실 외곽 방향)
        if right_count > 0:
            # 우측은 세로 배치이므로 speaker_length가 세로 방향 길이
            total_speaker_length = speaker_length * right_count
            remaining_space = final_ceiling_depth - total_speaker_length
            gap = remaining_space / (right_count + 1)
            gaps['right'] = round(gap, 1)
            
            for i in range(right_count):
                x = ceiling_end_x + half_speaker_width
                y = final_ceiling_start_y + gap * (i + 1) + speaker_length * (i + 0.5)
                positions.append({
                    "id": speaker_id,
                    "x": round(x, 1),
                    "y": round(y, 1),
                    "type": "SPK",
                    "edge": "right"
                })
                speaker_id += 1
        
        # 하단 (우→좌) - 우물천장 라인 아래쪽(거실 외곽 방향)
        if bottom_count > 0:
            total_speaker_length = speaker_length * bottom_count
            remaining_space = final_ceiling_width - total_speaker_length
            gap = remaining_space / (bottom_count + 1)
            gaps['bottom'] = round(gap, 1)
            
            for i in range(bottom_count):
                # 하단은 오른쪽에서 왼쪽으로 배치
                x = ceiling_end_x - (gap * (i + 1) + speaker_length * (i + 0.5))
                y = ceiling_end_y + half_speaker_width
                positions.append({
                    "id": speaker_id,
                    "x": round(x, 1),
                    "y": round(y, 1),
                    "type": "SPK",
                    "edge": "bottom"
                })
                speaker_id += 1
        
        # 좌측 (하→상) - 우물천장 라인 왼쪽(거실 외곽 방향)
        if left_count > 0:
            # 좌측은 세로 배치이므로 speaker_length가 세로 방향 길이
            total_speaker_length = speaker_length * left_count
            remaining_space = final_ceiling_depth - total_speaker_length
            gap = remaining_space / (left_count + 1)
            gaps['left'] = round(gap, 1)
            
            for i in range(left_count):
                x = final_ceiling_start_x - half_speaker_width
                # 좌측은 아래에서 위로 배치
                y = ceiling_end_y - (gap * (i + 1) + speaker_length * (i + 0.5))
                positions.append({
                    "id": speaker_id,
                    "x": round(x, 1),
                    "y": round(y, 1),
                    "type": "SPK",
                    "edge": "left"
                })
                speaker_id += 1
        
        print(f"[DEBUG] Total speakers created: {len(positions)}, Returning: {min(len(positions), total_speakers)}")
        return positions[:total_speakers], gaps

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
                distance = np.linalg.norm(sensor_point - obs_point)
                
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
                   obstacles: List[Dict] = None, offset: float = 300,
                   speaker_width: float = 130,
                   speaker_length: float = 600,
                   min_gap: float = 100,
                   max_gap: float = 600,
                   horizontal_count: int = None,
                   vertical_count: int = None,
                   ceiling_width: float = None,
                   ceiling_depth: float = None,
                   ceiling_start_x: float = None,
                   ceiling_start_y: float = None) -> Dict:
        """
        자동 설계 생성
        
        Args:
            width: 거실 가로 길이
            depth: 거실 세로 길이
            obstacles: 장애물 리스트
            offset: 오프셋
            speaker_width: 스피커 폭 (mm)
            speaker_length: 스피커 길이 (mm)
            min_gap: 최소 스피커 간격 (mm)
            max_gap: 최대 스피커 간격 (mm)
            horizontal_count: 가로 스피커 개수 (None이면 자동)
            vertical_count: 세로 스피커 개수 (None이면 자동)
            ceiling_width: 우물천장 가로 (None이면 자동)
            ceiling_depth: 우물천장 세로 (None이면 자동)
            ceiling_start_x: 우물천장 시작 X 좌표 (None이면 자동)
            ceiling_start_y: 우물천장 시작 Y 좌표 (None이면 자동)
        
        Returns:
            설계 결과
        """
        # VS 배치
        vs_positions = self.calculate_vs_positions(width, depth, offset)
        
        # SPK 배치
        spk_positions, speaker_gaps = self.calculate_spk_positions(
            width, depth, 
            speaker_width=speaker_width,
            speaker_length=speaker_length,
            min_gap=min_gap,
            max_gap=max_gap,
            horizontal_count=horizontal_count,
            vertical_count=vertical_count,
            ceiling_width=ceiling_width,
            ceiling_depth=ceiling_depth,
            ceiling_start_x=ceiling_start_x,
            ceiling_start_y=ceiling_start_y
        )
        
        # 간섭 회피
        if obstacles:
            vs_positions = self.avoid_obstacles(vs_positions, obstacles, 300)
            spk_positions = self.avoid_obstacles(spk_positions, obstacles, 200)
        
        # 제어기 위치 (기본값: 원점)
        controller_position = {"x": 0, "y": 0}
        
        return {
            "vs_positions": vs_positions,
            "spk_positions": spk_positions,
            "controller_position": controller_position,
            "speaker_gaps": speaker_gaps
        }
