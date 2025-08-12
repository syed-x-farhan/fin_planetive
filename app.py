"""
Main entry point for Railway deployment
"""
import os
import sys
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Financial Modeling API...")
    print("📊 Backend will be available at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    print("🔧 Health check at: http://localhost:8000/health")
    print("=" * 50)
    
    # Add backend directory to Python path
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # Debug: Check if backend files exist
    print(f"Backend dir path: {backend_dir}")
    print(f"Backend dir exists: {os.path.exists(backend_dir)}")
    if os.path.exists(backend_dir):
        print(f"Files in backend: {os.listdir(backend_dir)}")
    
    # The backend files are in the root /app directory!
    main_py_path = "/app/main.py"
    print(f"main.py exists at {main_py_path}: {os.path.exists(main_py_path)}")
    
    # Import the FastAPI app from the root main.py
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("backend_main", main_py_path)
        if spec is None:
            raise ImportError(f"Could not load spec from {main_py_path}")
        backend_main = importlib.util.module_from_spec(spec)
        sys.modules["backend_main"] = backend_main
        spec.loader.exec_module(backend_main)
        app = backend_main.app
        print("✅ Successfully imported FastAPI app from root main.py!")
    except Exception as e:
        print(f"❌ Failed to import app: {e}")
        raise
    
    port = int(os.environ.get("PORT", 8000))
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
