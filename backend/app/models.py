"""
TeleStore Pro Normalized SQLAlchemy 2.0 Database Models
Includes 84 Product-Plan entries, multi-plan durations, price history audit, and double-entry ledger.
"""

from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, 
    Numeric, DateTime, ForeignKey, Index, Enum
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

Base = declarative_base()

class DeliveryTypeEnum(str, enum.Enum):
    AUTOMATIC_CODE = "AUTOMATIC_CODE"
    AUTOMATIC_FILE = "AUTOMATIC_FILE"
    MANUAL = "MANUAL"

class OrderStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(64), nullable=True)
    first_name = Column(String(128), nullable=False)
    last_name = Column(String(128), nullable=True)
    referral_code = Column(String(32), unique=True, nullable=False, index=True)
    referred_by = Column(String(32), nullable=True)
    language = Column(String(8), default="en", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    wallet = relationship("Wallet", back_populates="user", uselist=False)

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    currency = Column(String(8), default="BDT", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="wallet")

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True)
    name = Column(String(128), nullable=False)
    name_bn = Column(String(128), nullable=True)
    icon = Column(String(16), default="📦", nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    product_plans = relationship("ProductPlan", back_populates="category")

class ProductPlan(Base):
    """
    Catalog model supporting 84 product-plan entries.
    Preserves source INR price, provides optional BDT selling price.
    """
    __tablename__ = "product_plans"

    id = Column(String(64), primary_key=True)  # e.g., 'prod-zee5-1y'
    product_name = Column(String(255), nullable=False, index=True)  # e.g., 'Zee5'
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)
    plan_name = Column(String(128), nullable=False)  # e.g., '1 Year' or 'VIP'
    duration = Column(String(64), nullable=False)  # e.g., '1 Year', '1 Month', 'Lifetime'
    
    # Source currency & price
    source_price_inr = Column(Numeric(12, 2), nullable=True)  # Null if Price unavailable
    source_currency = Column(String(8), default="INR", nullable=False)
    
    # Optional BDT selling price configured by admin
    selling_price_bdt = Column(Numeric(12, 2), nullable=True)
    
    description = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=True)
    stock = Column(Integer, default=0, nullable=False)
    delivery_type = Column(Enum(DeliveryTypeEnum), default=DeliveryTypeEnum.AUTOMATIC_CODE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_out_of_stock = Column(Boolean, default=False, nullable=False)
    is_price_unavailable = Column(Boolean, default=False, nullable=False)
    source_reference = Column(String(128), default="Uploaded Catalog 2026", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("Category", back_populates="product_plans")
    price_history = relationship("PriceHistory", back_populates="product_plan")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(String(36), primary_key=True)
    product_plan_id = Column(String(64), ForeignKey("product_plans.id"), nullable=False, index=True)
    old_price_bdt = Column(Numeric(12, 2), nullable=True)
    new_price_bdt = Column(Numeric(12, 2), nullable=True)
    old_price_inr = Column(Numeric(12, 2), nullable=True)
    new_price_inr = Column(Numeric(12, 2), nullable=True)
    changed_by = Column(String(64), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product_plan = relationship("ProductPlan", back_populates="price_history")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True)
    order_number = Column(String(32), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    telegram_id = Column(BigInteger, nullable=False, index=True)
    product_plan_id = Column(String(64), ForeignKey("product_plans.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price_bdt = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.PENDING, nullable=False)
    delivery_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
