"""
Main entry point for Railway deployment
"""
import os
import sys
import uvicorn

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Add backend directory to Python path  
backend_dir = os.path.join(current_dir, 'backend')
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    print("🚀 Starting Financial Modeling API...")
    print("📊 Backend will be available at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    print("🔧 Health check at: http://localhost:8000/health")
    print("=" * 50)
    
    port = int(os.environ.get("PORT", 8000))
    
    # Import the FastAPI app from the backend directory
    # Since we added backend to sys.path, we can import directly
    sys.path.insert(0, backend_dir)
    from backend.main import app
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )
