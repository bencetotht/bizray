# import os
# import pytest
# from fastapi.testclient import TestClient
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# # Set test database URL BEFORE importing db.py to prevent production connection
# TEST_DATABASE_URL = "sqlite:///:memory:"
# os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})


# @pytest.fixture(scope="session", autouse=True)
# def mock_create_engine_for_tests(session_mocker):
#     session_mocker.patch("sqlalchemy.create_engine", return_value=test_engine)



# from main import app
# from src.db import Base, get_session, engine

# Base.metadata.create_all(bind=engine)


# TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# def override_get_session():
#     """Dependency override to use our test database session."""
#     db = TestSessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# app.dependency_overrides[get_session] = override_get_session

# @pytest.fixture(scope="session")
# def client():
#     return TestClient(app)

# @pytest.fixture
# def test_db_session():
#     connection = engine.connect()
#     transaction = connection.begin()
#     db = TestSessionLocal(bind=connection)
#     yield db
#     db.close()
#     transaction.rollback()
#     connection.close()