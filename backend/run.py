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
        
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0" if os.environ.get("RENDER") else "127.0.0.1"
    reload_flag = not bool(os.environ.get("RENDER"))  # reload só em dev local

    print(f"Iniciando o servidor FastAPI do Facilita em {host}:{port}...")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload_flag)
