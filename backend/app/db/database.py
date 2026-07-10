import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Lê a URL do banco de dados a partir das variáveis de ambiente (padrão em deploys de produção como Render/Heroku)
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

if SQLALCHEMY_DATABASE_URL:
    # Se a URL começar com postgres:// (padrão legado do Render/Heroku),
    # ajusta para postgresql:// que é a sintaxe exigida pelas novas versões do SQLAlchemy
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    # Caso contrário, utiliza o SQLite local padrão para desenvolvimento na raiz do backend
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'facilita.db')}"

# connect_args={"check_same_thread": False} só é necessário para conexões SQLite
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
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
