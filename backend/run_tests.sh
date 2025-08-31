#!/bin/bash

echo "================================"
echo "SewaBazaar Backend Test Runner"
echo "================================"
echo

echo "1. Running Simple API Tests..."
echo "--------------------------------"
python3 simple_api_test.py
echo

echo "2. Running Django Model Tests..."
echo "--------------------------------"
python3 manage.py test apps.services apps.bookings apps.accounts apps.reviews --verbosity=2
echo

echo "3. Running Custom Backend Tests..."
echo "--------------------------------"
python3 manage.py test_backend
echo

echo "Tests completed!"