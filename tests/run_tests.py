#!/usr/bin/env python
"""
SewaBazaar Test Runner

A comprehensive test runner for SewaBazaar project that supports:
- Unit tests
- Integration tests
- API tests
- End-to-end tests
- Coverage reporting

Usage:
    python -m tests.run_tests [options]

Options:
    --unit            Run unit tests only
    --integration     Run integration tests only
    --api             Run API tests only
    --e2e             Run end-to-end tests only
    --all             Run all tests (default)
    --coverage        Generate coverage report
    --backend         Run backend tests only
    --frontend        Run frontend tests only
    --verbose         Show verbose output
"""

import os
import sys
import argparse
import subprocess
import time

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='SewaBazaar Test Runner')
    parser.add_argument('--unit', action='store_true', help='Run unit tests only')
    parser.add_argument('--integration', action='store_true', help='Run integration tests only')
    parser.add_argument('--api', action='store_true', help='Run API tests only')
    parser.add_argument('--e2e', action='store_true', help='Run end-to-end tests only')
    parser.add_argument('--all', action='store_true', help='Run all tests (default)')
    parser.add_argument('--coverage', action='store_true', help='Generate coverage report')
    parser.add_argument('--backend', action='store_true', help='Run backend tests only')
    parser.add_argument('--frontend', action='store_true', help='Run frontend tests only')
    parser.add_argument('--verbose', action='store_true', help='Show verbose output')
    
    args = parser.parse_args()
    
    # If no test type is specified, run all tests
    if not any([args.unit, args.integration, args.api, args.e2e, args.all, 
                args.backend, args.frontend]):
        args.all = True
    
    return args

def run_backend_tests(args):
    """Run backend tests based on the specified options"""
    print("🚀 Running Backend Tests...")
    print("=" * 60)
    
    cmd = ['pytest']
    
    # Add test type markers
    if args.unit:
        cmd.append('-m unit')
    elif args.integration:
        cmd.append('-m integration')
    elif args.api:
        cmd.append('-m api')
    elif args.e2e:
        cmd.append('-m e2e')
    
    # Add test paths - updated to work with new structure
    if args.all:
        cmd.append('tests/backend')
    else:
        if args.unit:
            cmd.append('tests/backend/unit')  # This now points to our reorganized unit tests
        if args.integration:
            cmd.append('tests/backend/services')
        if args.api:
            cmd.append('tests/backend/api')
        if args.e2e:
            cmd.append('tests/frontend')  # Changed from tests/e2e to tests/frontend
    
    # Add coverage if requested
    if args.coverage:
        cmd.extend(['--cov=backend', '--cov-report=html', '--cov-report=term'])
    
    # Add verbosity
    if args.verbose:
        cmd.append('-v')
    
    # Run the command
    cmd_str = ' '.join(cmd)
    print(f"Executing: {cmd_str}")
    return subprocess.run(cmd_str, shell=True).returncode

def run_frontend_tests(args):
    """Run frontend tests based on the specified options"""
    print("🚀 Running Frontend Tests...")
    print("=" * 60)
    
    # Change to frontend directory
    os.chdir('frontend')
    
    cmd = ['npm', 'test']
    
    # Add test paths based on options
    if not args.all:
        if args.unit:
            cmd.append('-- --testPathPattern=unit')
        if args.integration:
            cmd.append('-- --testPathPattern=integration')
        if args.e2e:
            cmd.append('-- --testPathPattern=e2e')
        if args.api:
            cmd.append('-- --testPathPattern=api')  # Added api option for frontend
    
    # Add coverage if requested
    if args.coverage:
        cmd.append('-- --coverage')
    
    # Run the command
    cmd_str = ' '.join(cmd)
    print(f"Executing: {cmd_str}")
    result = subprocess.run(cmd_str, shell=True)
    os.chdir('..')  # Change back to root directory
    return result.returncode

def main():
    """Main entry point"""
    start_time = time.time()
    args = parse_args()
    
    # Track exit codes
    exit_codes = []
    
    # Run backend tests if requested
    if args.all or args.backend:
        backend_exit = run_backend_tests(args)
        exit_codes.append(backend_exit)
    
    # Run frontend tests if requested
    if args.all or args.frontend:
        frontend_exit = run_frontend_tests(args)
        exit_codes.append(frontend_exit)
    
    # Report results
    end_time = time.time()
    elapsed = end_time - start_time
    
    print("\n" + "=" * 60)
    print(f"Test Run Completed in {elapsed:.2f} seconds")
    
    if all(code == 0 for code in exit_codes):
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == '__main__':
    sys.exit(main())
