# Backend Testing Guide for SewaBazaar

## 🎯 What is Testing?

Testing is like having a quality control inspector for your code. It helps you make sure your application works correctly before you release it to users. Think of it as checking your homework before submitting it!

## 📚 Testing Concepts Explained

### 1. **Unit Tests**
- **What**: Testing individual pieces (units) of your code in isolation
- **Example**: Testing if a function that calculates service price works correctly
- **Why**: To make sure each small part works before combining them

### 2. **Integration Tests**
- **What**: Testing how different parts work together
- **Example**: Testing if creating a service also creates the related images
- **Why**: To ensure components work well together

### 3. **API Tests**
- **What**: Testing your web endpoints (URLs that return data)
- **Example**: Testing if `/api/services/` returns the correct list of services
- **Why**: To make sure your API works for frontend and mobile apps

### 4. **Performance Tests**
- **What**: Testing how fast your code runs
- **Example**: Testing if loading 1000 services takes less than 2 seconds
- **Why**: To ensure your app is fast for users

## 🛠️ Tools We Use

### 1. **Pytest** (Main Testing Framework)
```bash
# Install pytest
pip install pytest

# Run all tests
pytest

# Run tests with more details
pytest -v

# Run tests and show coverage
pytest --cov=apps
```

### 2. **Coverage** (Code Coverage Tool)
- **What**: Shows how much of your code is tested
- **Goal**: Aim for 80%+ coverage
- **Command**: `pytest --cov=apps --cov-report=html`

### 3. **Factory Boy** (Test Data Generator)
- **What**: Creates fake data for testing
- **Why**: Instead of manually creating test data every time

## 📁 Test File Structure

```
backend/
├── apps/
│   ├── accounts/
│   │   ├── tests.py          # Tests for user accounts
│   │   └── factories.py      # Test data generators
│   ├── services/
│   │   ├── tests.py          # Tests for services
│   │   └── factories.py      # Test data generators
│   ├── bookings/
│   │   ├── tests.py          # Tests for bookings
│   │   └── factories.py      # Test data generators
│   └── reviews/
│       ├── tests.py          # Tests for reviews
│       └── factories.py      # Test data generators
├── pytest.ini               # Pytest configuration
└── run_tests.py             # Custom test runner
```

## 🧪 How to Write Tests

### Basic Test Structure

```python
import pytest
from django.test import TestCase
from apps.accounts.models import User

class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def test_create_user(self):
        """Test that we can create a user"""
        # Arrange: Prepare test data
        user_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        # Act: Do the thing we're testing
        user = User.objects.create_user(**user_data)
        
        # Assert: Check if it worked
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
```

### Using Factories (Easier Way)

```python
import pytest
from apps.accounts.factories import UserFactory

@pytest.mark.django_db
class UserFactoryTest(TestCase):
    """Test using factories to create test data"""
    
    def test_user_factory_creates_valid_user(self):
        """Test that UserFactory creates a valid user"""
        # Create a user with fake data
        user = UserFactory()
        
        # Check if user was created properly
        self.assertIsNotNone(user.email)
        self.assertIsNotNone(user.username)
        self.assertTrue(len(user.email) > 0)
```

## 🚀 Running Tests

### 1. **Run All Tests**
```bash
cd backend
python run_tests.py all
```

### 2. **Run Specific Test Categories**
```bash
# Run only model tests
python run_tests.py specific

# Run only performance tests
python run_tests.py performance
```

### 3. **Run Tests with Coverage**
```bash
pytest --cov=apps --cov-report=html --cov-report=term-missing
```

### 4. **Run Tests in Watch Mode** (Auto-rerun on changes)
```bash
pytest --watch
```

## 📊 Understanding Test Results

### Test Output Example
```
============================= test session starts ==============================
platform win32 -- Python 3.11.0, pytest-7.4.3, pluggy-1.3.0
django: settings: sewabazaar.settings
plugins: django-4.7.0, cov-4.1.0, factoryboy-3.3.0
collected 45 items

apps/accounts/tests.py::AccountModelTest::test_create_user PASSED    [  2%]
apps/accounts/tests.py::AccountModelTest::test_user_str_representation PASSED [  4%]
apps/services/tests.py::ServiceModelTest::test_create_service PASSED [  6%]
...

============================== 45 passed in 2.34s ==============================
```

### Coverage Report Example
```
---------- coverage: platform win32, python 3.11.0-final-0 -----------
Name                           Stmts   Miss  Cover   Missing
------------------------------------------------------------
apps/accounts/models.py           45      2    96%   89-90
apps/accounts/views.py            78      5    94%   156-160
apps/services/models.py           67      3    96%   134-136
------------------------------------------------------------
TOTAL                           234     12    95%
```

## 🔧 Test Categories Explained

### 1. **Model Tests**
```python
def test_service_creation(self):
    """Test creating a service"""
    service = ServiceFactory()
    self.assertIsNotNone(service.name)
    self.assertIsNotNone(service.provider)
```

### 2. **Serializer Tests**
```python
def test_service_serializer(self):
    """Test service data serialization"""
    service = ServiceFactory()
    serializer = ServiceSerializer(service)
    data = serializer.data
    
    self.assertEqual(data['name'], service.name)
    self.assertEqual(data['price'], service.price)
```

### 3. **API Tests**
```python
def test_list_services_api(self):
    """Test getting list of services via API"""
    # Create test services
    ServiceFactory.create_batch(3)
    
    # Make API request
    response = self.client.get('/api/services/')
    
    # Check response
    self.assertEqual(response.status_code, 200)
    self.assertEqual(len(response.data), 3)
```

### 4. **Integration Tests**
```python
def test_service_with_images(self):
    """Test creating service with multiple images"""
    service = ServiceFactory()
    images = ServiceImageFactory.create_batch(3, service=service)
    
    self.assertEqual(service.images.count(), 3)
    self.assertEqual(service.images.first().service, service)
```

### 5. **Performance Tests**
```python
@pytest.mark.django_db
def test_service_list_performance(self):
    """Test that loading services is fast"""
    import time
    
    # Create 100 services
    ServiceFactory.create_batch(100)
    
    start_time = time.time()
    services = Service.objects.all()
    end_time = time.time()
    
    # Should load in less than 0.1 seconds
    self.assertLess(end_time - start_time, 0.1)
    self.assertEqual(services.count(), 100)
```

## 🐛 Common Testing Patterns

### 1. **Setup and Teardown**
```python
class ServiceTest(TestCase):
    def setUp(self):
        """Run before each test"""
        self.user = UserFactory()
        self.service = ServiceFactory(provider=self.user)
    
    def tearDown(self):
        """Run after each test"""
        # Clean up if needed
        pass
```

### 2. **Testing Exceptions**
```python
def test_invalid_service_data(self):
    """Test that invalid data raises errors"""
    with self.assertRaises(ValidationError):
        Service.objects.create(
            name='',  # Empty name should fail
            price=-100  # Negative price should fail
        )
```

### 3. **Testing Permissions**
```python
def test_service_owner_permissions(self):
    """Test that only service owner can edit"""
    owner = UserFactory()
    other_user = UserFactory()
    service = ServiceFactory(provider=owner)
    
    # Owner should be able to edit
    self.assertTrue(service.can_edit(owner))
    
    # Other user should not be able to edit
    self.assertFalse(service.can_edit(other_user))
```

## 📈 Best Practices

### 1. **Test Naming**
- Use descriptive names: `test_user_cannot_book_own_service`
- Follow pattern: `test_[what]_[when]_[expected_result]`

### 2. **Test Organization**
- Group related tests in classes
- Use docstrings to explain what each test does
- Keep tests independent (don't rely on other tests)

### 3. **Test Data**
- Use factories for consistent test data
- Create minimal data needed for each test
- Clean up after tests if needed

### 4. **Assertions**
- Test one thing per test
- Use specific assertions: `assertEqual`, `assertIn`, `assertRaises`
- Provide clear error messages

## 🚨 Troubleshooting

### Common Issues

1. **Database Errors**
   ```bash
   # Reset test database
   python manage.py flush
   ```

2. **Import Errors**
   ```bash
   # Make sure you're in the right directory
   cd backend
   export DJANGO_SETTINGS_MODULE=sewabazaar.settings
   ```

3. **Slow Tests**
   ```bash
   # Run tests in parallel
   pytest -n auto
   ```

### Debugging Tests
```python
def test_debug_example(self):
    """Example of debugging a test"""
    service = ServiceFactory()
    
    # Add breakpoint to debug
    import pdb; pdb.set_trace()
    
    # Or use print statements
    print(f"Service: {service}")
    
    self.assertIsNotNone(service)
```

## 📚 Additional Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/)

## 🎉 Next Steps

1. **Start Simple**: Write basic model tests first
2. **Add Coverage**: Aim for 80%+ code coverage
3. **Practice**: Write tests for new features
4. **Learn**: Read existing tests to understand patterns

Remember: **Good tests save time in the long run!** They help you catch bugs early and make your code more reliable.









