# -*- mode: python ; coding: utf-8 -*-

import os

block_cipher = None

# 분석 설정
a = Analysis(
    ['app/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('static', 'static'),  # 프론트엔드 빌드 파일 포함
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'sqlalchemy.sql.default_comparator',
        'sqlalchemy.ext.baked',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# 실행 파일 설정
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ANC-AutoDesign',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,  # UPX 압축 사용 (파일 크기 감소)
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 콘솔 창 표시 (uvicorn 로깅 오류 방지)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico' if os.path.exists('icon.ico') else None,  # 아이콘 파일 (있는 경우)
)
