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
    
    # Change working directory to backend
    os.chdir(backend_dir)
    
    # Now import after path setup
    try:
        from main import app
        print("✅ Successfully imported FastAPI app")
    except ImportError as e:
        print(f"❌ Failed to import app: {e}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Python path: {sys.path}")
        print(f"Files in backend dir: {os.listdir('.')}")
        raise
    
    port = int(os.environ.get("PORT", 8000))
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
