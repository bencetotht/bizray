from __future__ import annotations

import os
from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import (
    String,
    Integer,
    Float,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    Text,
    create_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, default=lambda: str(uuid4()), index=True)
    username: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    company_history_data: Mapped[str | None] = mapped_column(Text)
    user_role: Mapped[str] = mapped_column(String(64), nullable=False, default="registered")
    registered_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    firmenbuchnummer: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    legal_form: Mapped[str | None] = mapped_column(String(128))
    business_purpose: Mapped[str | None] = mapped_column(String(2048))
    seat: Mapped[str | None] = mapped_column(String(256))

    # Risk-related
    risk_score: Mapped[float | None] = mapped_column(Float)
    reference_date: Mapped[date | None] = mapped_column(Date)

    # Relationships
    address: Mapped[Address | None] = relationship(
        back_populates="company",
        uselist=False,
        cascade="all, delete-orphan",
    )
    partners: Mapped[list[Partner]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    registry_entries: Mapped[list[RegistryEntry]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    risk_indicators: Mapped[list[RiskIndicator]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    street: Mapped[str | None] = mapped_column(String(256))
    house_number: Mapped[str | None] = mapped_column(String(64))
    postal_code: Mapped[str | None] = mapped_column(String(32))
    city: Mapped[str | None] = mapped_column(String(256))
    country: Mapped[str | None] = mapped_column(String(16))

    company: Mapped[Company] = relationship(back_populates="address")


class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    name: Mapped[str | None] = mapped_column(String(512))
    first_name: Mapped[str | None] = mapped_column(String(256))
    last_name: Mapped[str | None] = mapped_column(String(256))
    birth_date: Mapped[date | None] = mapped_column(Date)
    role: Mapped[str | None] = mapped_column(String(256))
    representation: Mapped[str | None] = mapped_column(String(256))

    company: Mapped[Company] = relationship(back_populates="partners")

    __table_args__ = (
        Index("ix_partners_company_id_last_name", "company_id", "last_name"),
    )

class RegistryEntry(Base):
    __tablename__ = "registry_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    type: Mapped[str | None] = mapped_column(String(128))
    court: Mapped[str | None] = mapped_column(String(256))
    file_number: Mapped[str | None] = mapped_column(String(256))
    application_date: Mapped[date | None] = mapped_column(Date)
    registration_date: Mapped[date | None] = mapped_column(Date)

    company: Mapped[Company] = relationship(back_populates="registry_entries")


class RiskIndicator(Base):
    __tablename__ = "risk_indicators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    key: Mapped[str] = mapped_column(String(128), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)

    company: Mapped[Company] = relationship(back_populates="risk_indicators")

    __table_args__ = (
        UniqueConstraint("company_id", "key", name="uq_risk_indicators_company_key"),
    )

def _make_engine():
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://admin:admin@192.168.88.46:5432/bizray",
    )
    # return create_engine(database_url, pool_pre_ping=True)
    pool_size = int(os.getenv("BIZRAY_DB_POOL_SIZE", "20"))
    max_overflow = int(os.getenv("BIZRAY_DB_MAX_OVERFLOW", "40"))
    return create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=pool_size,
        max_overflow=max_overflow,
    )

engine = _make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def init_db() -> None:
    Base.metadata.create_all(bind=engine)

def get_session():
    return SessionLocal()