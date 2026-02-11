from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.api.endpoints import projects, houses, surveys, designs

# 데이터베이스 초기화
init_db()

app = FastAPI(
    title="ANC Auto Design & BOM API",
    description="거실 사이즈 입력 기반 ANC 자동 설계 및 BOM 산출 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(houses.router, prefix="/api/v1", tags=["Houses"])
app.include_router(surveys.router, prefix="/api/v1", tags=["Surveys"])
app.include_router(designs.router, prefix="/api/v1", tags=["Designs & BOM"])


@app.get("/")
def root():
    return {
        "message": "ANC Auto Design & BOM API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
