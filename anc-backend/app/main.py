from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.database import init_db
from app.api.endpoints import projects, houses, surveys, designs
import os

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


# 정적 파일 서빙 설정 (독립 실행형 배포용)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

if os.path.exists(static_dir):
    # 정적 파일 마운트
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    @app.get("/", include_in_schema=False)
    async def serve_frontend():
        """프론트엔드 메인 페이지 서빙"""
        return FileResponse(os.path.join(static_dir, "index.html"))
    
    # React Router를 위한 fallback (모든 경로를 index.html로)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_routes(full_path: str):
        """프론트엔드 라우팅 및 정적 파일 서빙"""
        # API 경로는 제외
        if full_path.startswith("api/"):
            return {"error": "Not Found"}, 404
        
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
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
    import webbrowser
    import threading
    import time
    
    # Get port from environment variable (for cloud deployment)
    port = int(os.environ.get("PORT", 8000))
    
    def open_browser():
        """서버 시작 후 브라우저 자동 실행"""
        time.sleep(2)  # 서버가 완전히 시작될 때까지 대기
        webbrowser.open(f'http://localhost:{port}')
    
    # 브라우저 자동 실행 (백그라운드 스레드)
    # Only open browser in development (when PORT is default 8000)
    if port == 8000:
        threading.Thread(target=open_browser, daemon=True).start()
    
    # 서버 실행
    print("\n" + "="*50)
    print("🚀 ANC 자동 설계 시스템 시작")
    print("="*50)
    print(f"📱 웹 애플리케이션: http://localhost:{port}")
    print(f"📚 API 문서: http://localhost:{port}/docs")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port)
