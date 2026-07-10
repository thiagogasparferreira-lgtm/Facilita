import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Define o caminho do banco de dados na raiz do projeto backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'facilita.db')}"

# connect_args={"check_same_thread": False} é necessário para o SQLite no FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Injeção de dependência do FastAPI para banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
