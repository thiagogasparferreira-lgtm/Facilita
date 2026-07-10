from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_pro = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    language = Column(String, default="pt")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sessions = relationship("Session", back_populates="user")
    conversions = relationship("Conversion", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    api_keys = relationship("ApiKey", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="sessions")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    slug = Column(String, unique=True)
    tools = relationship("Tool", back_populates="category")

class Tool(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    tool_id = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(String)
    is_pro = Column(Boolean, default=False)
    max_size_mb = Column(Integer, default=10)
    daily_limit_free = Column(Integer, default=3)
    category = relationship("Category", back_populates="tools")
    conversions = relationship("Conversion", back_populates="tool")

class Conversion(Base):
    __tablename__ = "conversions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # None for anonymous
    tool_id = Column(Integer, ForeignKey("tools.id"))
    original_filename = Column(String)
    original_size = Column(Integer)
    result_size = Column(Integer, nullable=True)
    execution_time = Column(Float)
    status = Column(String, default="success") # success, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="conversions")
    tool = relationship("Tool", back_populates="conversions")
    downloads = relationship("Download", back_populates="conversion")

class Download(Base):
    __tablename__ = "downloads"
    id = Column(Integer, primary_key=True, index=True)
    conversion_id = Column(Integer, ForeignKey("conversions.id"))
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    conversion = relationship("Conversion", back_populates="downloads")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_name = Column(String) # FREE, PRO
    status = Column(String) # active, expired, cancelled
    valid_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="subscriptions")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    transaction_id = Column(String, unique=True)
    amount = Column(Float)
    method = Column(String, default="PIX")
    status = Column(String) # pending, approved, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="payments")

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    key_hash = Column(String, unique=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="api_keys")

class Favorite(Base):
    __tablename__ = "favorites"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tool_id = Column(Integer, ForeignKey("tools.id"))
    user = relationship("User", back_populates="favorites")

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    description = Column(String)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AppConfig(Base):
    __tablename__ = "app_configs"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True)
    value = Column(String)

class SEOConfig(Base):
    __tablename__ = "seo_configs"
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, unique=True) # ex: /ferramentas/comprimir-pdf
    title = Column(String)
    description = Column(String)
    keywords = Column(String)
    schema_json = Column(JSON, nullable=True)
