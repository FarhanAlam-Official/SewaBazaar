import requests
import json

def test_api_endpoints():
    """Test the voucher API endpoints with new simplified system."""
    
    base_url = 'http://127.0.0.1:8000/api/rewards'
    
    print('🔍 Testing GET vouchers...')
    try:
        response = requests.get(f'{base_url}/vouchers/?user_id=1')
        if response.status_code == 200:
            vouchers = response.json()
            print(f'✅ Found {len(vouchers)} vouchers')
            for v in vouchers[:3]:  # Show first 3
                print(f'   📄 {v["voucher_code"]}: Rs.{v["value"]} ({v["status"]})')
        else:
            print(f'❌ Error: {response.status_code}')
            print(response.text)
    except Exception as e:
        print(f'❌ Request failed: {e}')
    
    print()
    
    # Test validate voucher for booking
    print('🧪 Testing voucher validation...')
    test_voucher = 'SB-20250912-100-001'
    test_booking_amount = 50
    
    data = {
        'voucher_code': test_voucher,
        'booking_amount': test_booking_amount,
        'user_id': 1
    }
    
    try:
        response = requests.post(f'{base_url}/vouchers/validate-booking/', json=data)
        if response.status_code == 200:
            result = response.json()
            print(f'✅ Validation successful:')
            print(f'   💰 Can use: {result["can_use"]}')
            print(f'   💸 Discount: Rs.{result["discount_amount"]}')
            print(f'   💳 Final: Rs.{result["final_amount"]}')
            if result.get('wasted_amount', 0) > 0:
                print(f'   ⚠️  Wasted: Rs.{result["wasted_amount"]}')
        else:
            print(f'❌ Validation error: {response.status_code}')
            try:
                print(response.json())
            except:
                print(response.text)
    except Exception as e:
        print(f'❌ Request failed: {e}')
    
    print()
    
    # Test different booking amounts
    print('🎯 Testing different booking amounts...')
    test_amounts = [25, 50, 100, 150, 200]
    
    for amount in test_amounts:
        data = {
            'voucher_code': test_voucher,
            'booking_amount': amount,
            'user_id': 1
        }
        
        try:
            response = requests.post(f'{base_url}/vouchers/validate-booking/', json=data)
            if response.status_code == 200:
                result = response.json()
                wasted = result.get('wasted_amount', 0)
                wasted_text = f' (⚠️ Rs.{wasted} wasted)' if wasted > 0 else ''
                print(f'   Rs.{amount}: Rs.{result["discount_amount"]} discount → Rs.{result["final_amount"]} final{wasted_text}')
            else:
                print(f'   Rs.{amount}: ❌ Error {response.status_code}')
        except Exception as e:
            print(f'   Rs.{amount}: ❌ Failed - {e}')

if __name__ == "__main__":
    test_api_endpoints()