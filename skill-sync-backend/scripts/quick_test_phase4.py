#!/usr/bin/env python3
"""
Quick Phase 4 Test - Minimal test to verify endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"
COMPANY_EMAIL = "hr@techcorp.com"
COMPANY_PASSWORD = "TechCorp2024"

def test():
    print("=" * 60)
    print("Quick Phase 4 Test")
    print("=" * 60)
    
    # 1. Check server
    print("\n1. Checking server health...")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Server is running: {r.status_code}")
    except Exception as e:
        print(f"❌ Server not running: {e}")
        return
    
    # 2. Login
    print("\n2. Logging in as company...")
    try:
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": COMPANY_EMAIL, "password": COMPANY_PASSWORD},
            timeout=10
        )
        if r.status_code == 200:
            token = r.json().get("access_token")
            print(f"✅ Login successful")
            print(f"   Token: {token[:50]}...")
        else:
            print(f"❌ Login failed: {r.status_code}")
            print(f"   Response: {r.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Get internships for this company
    print("\n3. Getting company internships...")
    try:
        r = requests.get(f"{BASE_URL}/api/internship/my-posts", headers=headers, timeout=10)
        if r.status_code == 200:
            internships = r.json()
            print(f"✅ Found {len(internships)} internships")
            if internships:
                internship_id = internships[0]["id"]
                print(f"   Using internship ID: {internship_id} - {internships[0]['title']}")
            else:
                print("❌ No internships found")
                return
        else:
            print(f"❌ Failed to get internships: {r.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 4. Get ranked candidates
    print("\n4. Getting ranked candidates...")
    try:
        r = requests.get(
            f"{BASE_URL}/api/filter/rank-candidates/{internship_id}/filtered",
            params={"page": 1, "page_size": 5},
            headers=headers,
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            candidates = data.get("ranked_candidates", [])
            print(f"✅ Found {len(candidates)} candidates")
            if candidates:
                candidate_id = candidates[0]["candidate_id"]
                print(f"   Using candidate ID: {candidate_id}")
                print(f"   Match score: {candidates[0]['match_score']}")
            else:
                print("❌ No candidates found")
                return
        else:
            print(f"❌ Failed to get candidates: {r.status_code}")
            print(f"   Response: {r.text[:200]}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 5. Test Task 4.1: Get candidate explanation
    print("\n5. Testing Task 4.1: Get Candidate Explanation...")
    try:
        r = requests.get(
            f"{BASE_URL}/api/recommendations/candidates/{candidate_id}/explanation",
            params={"internship_id": internship_id},
            headers=headers,
            timeout=30
        )
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Explanation retrieved")
            print(f"   Overall Score: {data.get('overall_score')}")
            print(f"   Confidence: {data.get('confidence')}")
            print(f"   Recommendation: {data.get('recommendation')}")
            print(f"   Explanation ID: {data.get('explanation_id')}")
        else:
            print(f"❌ Failed: {r.status_code}")
            print(f"   Response: {r.text[:500]}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 6. Test Task 4.4: Check precompute status
    print("\n6. Testing Task 4.4: Precompute Status...")
    try:
        r = requests.get(
            f"{BASE_URL}/api/internship/{internship_id}/precompute-status",
            headers=headers,
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Status retrieved")
            print(f"   Total Matches: {data.get('total_matches')}")
            print(f"   Precomputed: {data.get('precomputed_count')}")
            print(f"   Coverage: {data.get('coverage_percent')}%")
        else:
            print(f"❌ Failed: {r.status_code}")
            print(f"   Response: {r.text[:200]}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 7. Test Task 4.2: Compare candidates (if we have 2+)
    if len(candidates) >= 2:
        print("\n7. Testing Task 4.2: Candidate Comparison...")
        candidate_id_1 = candidates[0]["candidate_id"]
        candidate_id_2 = candidates[1]["candidate_id"]
        try:
            r = requests.get(
                f"{BASE_URL}/api/recommendations/internship/{internship_id}/compare",
                params={"candidates": f"{candidate_id_1},{candidate_id_2}"},
                headers=headers,
                timeout=30
            )
            if r.status_code == 200:
                data = r.json()
                print(f"✅ Comparison generated")
                print(f"   Better Candidate: {data.get('better_candidate')}")
                print(f"   Score Difference: {data.get('score_difference')}")
                print(f"   Audit ID: {data.get('audit_id')}")
            else:
                print(f"❌ Failed: {r.status_code}")
                print(f"   Response: {r.text[:500]}")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("\n7. Skipping comparison (need 2+ candidates)")
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test()
