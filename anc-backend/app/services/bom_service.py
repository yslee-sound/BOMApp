import numpy as np
from typing import List, Dict


class BOMService:
    """BOM 계산 서비스"""
    
    # 자재 단가 (원)
    PRICES = {
        "VS-001": 50000,
        "SPK-001": 120000,
        "CTRL-001": 300000,
        "ADP-001": 50000,
        "SD-001": 30000,
        "CBL-1.2": 5000,
        "CBL-7.0": 15000
    }
    
    @staticmethod
    def calculate_cable_requirements(vs_positions: List[Dict], 
                                    spk_positions: List[Dict],
                                    controller_pos: Dict) -> Dict:
        """
        케이블 길이 및 규격별 수량 계산
        
        Args:
            vs_positions: VS 위치 리스트
            spk_positions: SPK 위치 리스트
            controller_pos: 제어기 위치
        
        Returns:
            케이블 요구사항
        """
        cable_specs = {
            1.2: 0,
            7.0: 0
        }
        
        total_length = 0
        all_devices = vs_positions + spk_positions
        ctrl_point = np.array([controller_pos["x"], controller_pos["y"]])
        
        for device in all_devices:
            device_point = np.array([device["x"], device["y"]])
            # 맨해튼 거리
            distance = np.abs(device_point[0] - ctrl_point[0]) + \
                      np.abs(device_point[1] - ctrl_point[1])
            
            # mm를 m로 변환
            distance_m = distance / 1000
            total_length += distance_m
            
            # 케이블 규격 선택
            if distance_m <= 1.2:
                cable_specs[1.2] += 1
            elif distance_m <= 7.0:
                cable_specs[7.0] += 1
            else:
                # 7m 초과시 7m 케이블 여러 개
                cable_specs[7.0] += int(np.ceil(distance_m / 7.0))
        
        return {
            "total_length": round(total_length, 2),
            "cable_1_2m": cable_specs[1.2],
            "cable_7_0m": cable_specs[7.0]
        }
    
    def calculate_bom(self, vs_positions: List[Dict], 
                     spk_positions: List[Dict],
                     controller_pos: Dict) -> Dict:
        """
        BOM 계산
        
        Args:
            vs_positions: VS 위치 리스트
            spk_positions: SPK 위치 리스트
            controller_pos: 제어기 위치
        
        Returns:
            BOM 결과
        """
        # 케이블 계산
        cable_req = self.calculate_cable_requirements(
            vs_positions, spk_positions, controller_pos
        )
        
        # 자재 수량
        materials = [
            {
                "code": "VS-001",
                "name": "Vibration Sensor",
                "qty": len(vs_positions),
                "unit": "EA",
                "unit_price": self.PRICES["VS-001"],
                "total": len(vs_positions) * self.PRICES["VS-001"]
            },
            {
                "code": "SPK-001",
                "name": "ANC Speaker",
                "qty": len(spk_positions),
                "unit": "EA",
                "unit_price": self.PRICES["SPK-001"],
                "total": len(spk_positions) * self.PRICES["SPK-001"]
            },
            {
                "code": "CTRL-001",
                "name": "ANC Controller",
                "qty": 1,
                "unit": "EA",
                "unit_price": self.PRICES["CTRL-001"],
                "total": self.PRICES["CTRL-001"]
            },
            {
                "code": "ADP-001",
                "name": "Power Adapter",
                "qty": 1,
                "unit": "EA",
                "unit_price": self.PRICES["ADP-001"],
                "total": self.PRICES["ADP-001"]
            },
            {
                "code": "SD-001",
                "name": "SD Card",
                "qty": 1,
                "unit": "EA",
                "unit_price": self.PRICES["SD-001"],
                "total": self.PRICES["SD-001"]
            },
            {
                "code": "CBL-1.2",
                "name": "A2B Cable 1.2m",
                "qty": cable_req["cable_1_2m"],
                "unit": "EA",
                "unit_price": self.PRICES["CBL-1.2"],
                "total": cable_req["cable_1_2m"] * self.PRICES["CBL-1.2"]
            },
            {
                "code": "CBL-7.0",
                "name": "A2B Cable 7.0m",
                "qty": cable_req["cable_7_0m"],
                "unit": "EA",
                "unit_price": self.PRICES["CBL-7.0"],
                "total": cable_req["cable_7_0m"] * self.PRICES["CBL-7.0"]
            }
        ]
        
        # 총 비용 계산
        total_cost = sum(item["total"] for item in materials)
        
        return {
            "vibration_sensors": len(vs_positions),
            "speakers": len(spk_positions),
            "controller": 1,
            "adapter": 1,
            "sd_card": 1,
            "cable_1_2m": cable_req["cable_1_2m"],
            "cable_7_0m": cable_req["cable_7_0m"],
            "total_cable_length": cable_req["total_length"],
            "total_cost": total_cost,
            "materials": materials
        }
