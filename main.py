"""
Main entry point for Railway deployment
"""
import os
import sys

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Add backend directory to Python path  
backend_dir = os.path.join(current_dir, 'backend')
sys.path.insert(0, backend_dir)

# Change to backend directory
os.chdir(backend_dir)

# Import and run the backend
from start import *
