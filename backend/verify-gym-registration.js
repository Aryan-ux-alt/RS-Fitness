#!/usr/bin/env node

/**
 * Gym Registration System - Quick Verification Script
 * Run this to verify all components are working correctly
 */

const API_URL = process.env.API_URL || "http://localhost:4000/api";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

async function test(name, fn) {
  process.stdout.write(`${colors.blue}→${colors.reset} ${name}...`);
  try {
    await fn();
    console.log(` ${colors.green}✓${colors.reset}`);
    return true;
  } catch (err) {
    console.log(` ${colors.red}✗${colors.reset}`);
    console.log(`  ${colors.red}Error: ${err.message}${colors.reset}`);
    return false;
  }
}

async function request(method, path, body = null) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status}: ${data.message || "Unknown error"}`);
  }

  return data;
}

async function runTests() {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}GYM REGISTRATION SYSTEM - VERIFICATION${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const results = [];

  // Test 1: Health check
  results.push(await test("Health check", async () => {
    const res = await request("GET", "/health");
    if (!res.ok) throw new Error("Health check failed");
  }));

  // Test 2: Get registered gyms
  let existingGyms = [];
  results.push(await test("Get registered gyms", async () => {
    const res = await request("GET", "/auth/gyms");
    existingGyms = res;
    if (!Array.isArray(res)) throw new Error("Response is not an array");
  }));

  // Test 3: Check gym not exists
  results.push(await test("Check non-existent gym", async () => {
    try {
      await request("GET", "/auth/check-gym?name=NonExistentGym123");
      throw new Error("Should have returned 404");
    } catch (err) {
      if (err.message.includes("404")) return;
      throw err;
    }
  }));

  // Test 4: Register gym owner
  const testGymName = `TestGym_${Date.now()}`;
  let gymOwnerId = null;
  let accessToken = null;
  results.push(await test("Register gym owner", async () => {
    const res = await request("POST", "/gym-owners/signup", {
      gymName: testGymName,
      phone: Math.random().toString().slice(2, 12),
      email: `owner_${Date.now()}@test.com`,
      password: "TestPassword123",
      city: "TestCity",
    });
    
    if (res.status !== "pending") {
      throw new Error(`Expected status 'pending', got '${res.status}'`);
    }
    gymOwnerId = res.gymOwner?.id;
  }));

  // Test 5: Verify gym is registered
  results.push(await test("Verify gym in registered_gyms", async () => {
    const res = await request("GET", "/auth/check-gym?name=" + testGymName);
    if (res.gymName !== testGymName) {
      throw new Error(`Expected gym name '${testGymName}', got '${res.gymName}'`);
    }
  }));

  // Test 6: Register user with verified gym
  let userId = null;
  results.push(await test("Register user with registered gym", async () => {
    const res = await request("POST", "/auth/signup", {
      name: "Test User",
      email: `user_${Date.now()}@test.com`,
      password: "TestPassword123",
      phone: Math.random().toString().slice(2, 12),
      gymName: testGymName,
    });
    
    if (!res.user?.id) throw new Error("User ID not returned");
    userId = res.user.id;
  }));

  // Test 7: Try registering user with unregistered gym
  results.push(await test("Reject user with unregistered gym", async () => {
    try {
      await request("POST", "/auth/signup", {
        name: "Test User",
        email: `user_fail_${Date.now()}@test.com`,
        password: "TestPassword123",
        phone: Math.random().toString().slice(2, 12),
        gymName: "NonExistentGym12345",
      });
      throw new Error("Should have rejected unregistered gym");
    } catch (err) {
      if (err.message.includes("not registered")) return;
      throw err;
    }
  }));

  // Test 8: Gym owner login
  results.push(await test("Gym owner login", async () => {
    const signupRes = await request("POST", "/gym-owners/signup", {
      gymName: `LoginTestGym_${Date.now()}`,
      phone: Math.random().toString().slice(2, 12),
      email: `owner_login_${Date.now()}@test.com`,
      password: "TestPassword123",
      city: "TestCity",
    });

    // Try login after 24 hour check (will be pending)
    try {
      const loginRes = await request("POST", "/gym-owners/login", {
        email: signupRes.gymOwner.email,
        password: "TestPassword123",
      });
      accessToken = loginRes.accessToken;
    } catch (err) {
      // Expected: pending approval message, but we can still verify user exists
      if (err.message.includes("pending")) return;
      throw err;
    }
  }));

  // Test 9: Get gym members (if we can login)
  if (accessToken) {
    results.push(await test("Get gym members with auth", async () => {
      const response = await fetch(`${API_URL}/gym-owners/members`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      
      // Should return array (even if empty)
      if (!Array.isArray(data) && !data.message) {
        throw new Error("Response is not an array");
      }
    }));
  }

  // Summary
  console.log(`\n${colors.blue}─────────────────────────────────────${colors.reset}`);
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`${colors.blue}Results:${colors.reset} ${passed}/${total} tests passed (${percentage}%)\n`);

  if (passed === total) {
    console.log(`${colors.green}✓ All systems operational!${colors.reset}\n`);
    return 0;
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed${colors.reset}\n`);
    return 1;
  }
}

runTests().then(code => process.exit(code)).catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err.message);
  process.exit(1);
});
