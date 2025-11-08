import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})


@pytest.fixture(scope="session", autouse=True)
def mock_create_engine_for_tests(session_mocker):
    session_mocker.patch("sqlalchemy.create_engine", return_value=test_engine)



from main import app
from src.db import Base, get_session


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    Base.metadata.create_all(bind=test_engine)


def override_get_session():
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_session] = override_get_session


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    db_session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    yield db_session

    db_session.close()
    transaction.rollback()
    connection.close()