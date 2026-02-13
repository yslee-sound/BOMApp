export interface Project {
  project_id: number;
  project_name: string;
  location?: string;
  total_houses: number;
  status: string;
  created_at: string;
}

export interface House {
  house_id: number;
  project_id: number;
  house_number: string;
  floor_plan_type?: string;
  survey_date?: string;
  design_date?: string;
  created_at: string;
}

export interface Survey {
  survey_id: number;
  house_id: number;
  living_room_width: number;
  living_room_depth: number;
  ceiling_width?: number;   // 우물천장 가로 (mm)
  ceiling_depth?: number;   // 우물천장 세로 (mm)
  ceiling_start_x?: number; // 우물천장 시작 X 좌표 (mm)
  ceiling_start_y?: number; // 우물천장 시작 Y 좌표 (mm)
  ceiling_height?: number;
  speaker_length?: number;  // 스피커 길이 (mm)
  speaker_width?: number;   // 스피커 폭 (mm)
  speaker_height?: number;  // 스피커 높이 (mm)
  has_molding: boolean;
  molding_width?: number;
  has_air_conditioner: boolean;
  ac_positions?: Obstacle[];
  lighting_positions?: Obstacle[];
  notes?: string;
  surveyor_name?: string;
  photo_urls?: string[];
  created_at: string;
}

export interface Obstacle {
  x: number;
  y: number;
  type: string;
}

export interface Device {
  id: number;
  x: number;
  y: number;
  type: 'VS' | 'SPK';
  adjusted?: boolean;
  edge?: string;
}

export interface Design {
  design_id: number;
  house_id: number;
  vs_positions: Device[];
  spk_positions: Device[];
  controller_position?: { x: number; y: number };
  speaker_gaps?: { top?: number; right?: number; bottom?: number; left?: number };
  design_version: number;
  is_approved: boolean;
  created_at: string;
}

export interface MaterialItem {
  code: string;
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface BOM {
  bom_id: number;
  design_id: number;
  vibration_sensors: number;
  speakers: number;
  controller: number;
  adapter: number;
  sd_card: number;
  cable_1_2m: number;
  cable_7_0m: number;
  total_cable_length: number;
  total_cost: number;
  materials?: MaterialItem[];
  created_at: string;
}
