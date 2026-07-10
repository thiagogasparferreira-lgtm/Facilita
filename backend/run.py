import uvicorn
import os

if __name__ == "__main__":
    # Garante que as pastas de armazenamento existam
    storage_dirs = [
        "app/storage/uploads",
        "app/storage/outputs",
        "app/storage/temp"
    ]
    for directory in storage_dirs:
        os.makedirs(directory, exist_ok=True)
        
    print("Iniciando o servidor FastAPI do Facilita...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
