import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from main import app
from src.db import Base, get_session, engine

Base.metadata.create_all(bind=engine)


TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
def override_get_session():
    """Dependency override to use our test database session."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture
def test_db_session():
    connection = engine.connect()
    transaction = connection.begin()
    db = TestSessionLocal(bind=connection)
    yield db
    db.close()
    transaction.rollback()
    connection.close()