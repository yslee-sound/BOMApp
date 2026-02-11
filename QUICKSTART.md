# ANC 자동 설계 및 BOM 산출 프로그램

거실 사이즈 입력 기반으로 ANC 시스템의 Vibration Sensor와 Speaker를 자동 배치하고, BOM을 산출하는 웹 애플리케이션입니다.

## 프로젝트 구조

```
260211_BOM App/
├── anc-backend/          # FastAPI 백엔드
│   ├── app/
│   │   ├── api/         # API 엔드포인트
│   │   ├── models/      # 데이터베이스 모델
│   │   ├── schemas/     # Pydantic 스키마
│   │   ├── services/    # 비즈니스 로직
│   │   └── core/        # 데이터베이스 설정
│   └── requirements.txt
├── anc-frontend/         # React 프론트엔드
│   ├── src/
│   │   ├── components/  # UI 컴포넌트
│   │   ├── services/    # API 통신
│   │   └── types/       # TypeScript 타입
│   └── package.json
└── README.md
```

## 주요 기능

✅ **프로젝트 관리** - 여러 프로젝트 생성 및 관리
✅ **세대 관리** - 프로젝트별 세대 추가 및 관리
✅ **실사 데이터 입력** - 거실 사이즈 및 장애물 정보 입력
✅ **자동 설계** - VS 9개 (3x3 그리드), SPK 12개 자동 배치
✅ **도면 편집** - Konva 기반 드래그 앤 드롭 편집
✅ **BOM 자동 산출** - 케이블 길이 및 자재 수량 자동 계산
✅ **실시간 업데이트** - 설계 변경 시 BOM 자동 재계산

## 기술 스택

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **SQLite** - 데이터베이스 (개발용)
- **NumPy/SciPy** - 수치 계산 및 알고리즘

### Frontend
- **React 18** + **TypeScript**
- **Material-UI** - UI 컴포넌트
- **React-Konva** - Canvas 기반 도면 편집
- **Axios** - HTTP 클라이언트
- **React Router** - 라우팅

## 빠른 시작

### 1. Backend 실행

```powershell
# 백엔드 디렉토리로 이동
cd "d:\Workspace\260211_BOM App\anc-backend"

# 가상환경 생성 (선택사항)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

백엔드가 실행되면:
- API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 2. Frontend 실행

**새 PowerShell 창을 열어서:**

```powershell
# 프론트엔드 디렉토리로 이동
cd "d:\Workspace\260211_BOM App\anc-frontend"

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

프론트엔드가 실행되면:
- 웹 앱: http://localhost:3000

## 사용 방법

### 1단계: 프로젝트 생성
1. 메인 화면에서 "새 프로젝트" 버튼 클릭
2. 프로젝트명과 위치 입력
3. 생성 완료

### 2단계: 세대 추가
1. 프로젝트 선택
2. "세대 추가" 버튼 클릭
3. 세대번호(예: 101동 1001호)와 평형(예: 84㎡) 입력

### 3단계: 실사 데이터 입력
1. 세대 선택
2. 거실 가로/세로 사이즈 입력 (mm 단위)
3. 천장 높이, 몰딩 유무, 에어컨 유무 등 추가 정보 입력
4. "저장 및 설계 생성" 버튼 클릭

### 4단계: 설계 확인 및 편집
1. 자동으로 생성된 도면 확인
2. 필요시 센서/스피커 위치를 드래그하여 조정
3. "변경사항 저장" 버튼으로 저장
4. BOM 탭에서 자재 명세서 확인

## API 엔드포인트

### Projects
- `GET /api/v1/projects` - 프로젝트 목록
- `POST /api/v1/projects` - 프로젝트 생성
- `GET /api/v1/projects/{id}` - 프로젝트 조회
- `DELETE /api/v1/projects/{id}` - 프로젝트 삭제

### Houses
- `GET /api/v1/projects/{pid}/houses` - 세대 목록
- `POST /api/v1/projects/{pid}/houses` - 세대 추가
- `GET /api/v1/houses/{id}` - 세대 조회
- `DELETE /api/v1/houses/{id}` - 세대 삭제

### Surveys & Designs
- `POST /api/v1/houses/{id}/survey` - 실사 데이터 입력
- `POST /api/v1/houses/{id}/design/auto` - 자동 설계
- `GET /api/v1/houses/{id}/design` - 설계 조회
- `PUT /api/v1/houses/{id}/design` - 설계 수정

### BOM
- `GET /api/v1/designs/{id}/bom` - BOM 조회

## 핵심 알고리즘

### Vibration Sensor 배치
- 3x3 그리드 패턴 (총 9개)
- 벽면에서 300mm 오프셋
- 균등 간격 배치

### Speaker 배치
- 우물천장 라인을 따라 12개 배치
- 각 변에 비례하여 분산 배치
- 벽면에서 100mm 오프셋

### 케이블 길이 계산
- 맨해튼 거리(Manhattan distance) 사용
- 1.2m 및 7.0m 케이블 자동 선택
- 총 케이블 길이 및 개수 산출

### BOM 산출
- Vibration Sensor: 9개 (고정)
- Speaker: 배치된 개수
- Controller, Adapter, SD Card: 각 1개
- 케이블: 길이 기반 자동 계산
- 총 비용: 단가 × 수량

## 트러블슈팅

### Backend 실행 오류
```powershell
# 의존성 재설치
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Frontend 실행 오류
```powershell
# node_modules 삭제 후 재설치
Remove-Item -Recurse -Force node_modules
npm install

# 캐시 클리어
npm cache clean --force
```

### CORS 오류
백엔드의 `app/main.py`에서 CORS 설정 확인:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    ...
)
```

### 포트 충돌
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# 프로세스 종료
Stop-Process -Id <PID> -Force
```

## 개발 참고사항

### 데이터베이스 초기화
```powershell
# anc-backend 디렉토리에서
Remove-Item anc.db  # 기존 DB 삭제
python -m uvicorn app.main:app  # 새 DB 자동 생성
```

### 디버그 모드
```powershell
# Backend
uvicorn app.main:app --reload --log-level debug

# Frontend
npm start  # 자동으로 개발 모드
```

## 다음 단계

현재 프로토타입에서 추가 가능한 기능:
- [ ] PDF 도면 생성 및 다운로드
- [ ] 현장 사진 업로드
- [ ] 3D 시각화
- [ ] 이력 관리 및 버전 비교
- [ ] 장애물 추가 기능 (UI)
- [ ] 설계 승인 워크플로우
- [ ] 프로젝트 전체 BOM 통합
- [ ] 사용자 인증 및 권한 관리

## 라이선스

내부 사용을 위한 프로젝트입니다.

## 문의

프로젝트 관련 문의사항이 있으시면 담당자에게 연락 바랍니다.
