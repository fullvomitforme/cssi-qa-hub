/**
 * QA Hub Cleanup Script — Combined Auth + Catalog Deletion
 * 
 * This script performs two operations:
 * 1. Auth cleanup: Suspend temporary test users, mark profiles INACTIVE
 * 2. Catalog cleanup: Delete unreferenced verification scenarios
 * 
 * Usage:
 *   npx tsx scripts/cleanup-qa-hub.ts                    # Dry run (default)
 *   npx tsx scripts/cleanup-qa-hub.ts --dangerously-run  # Execute
 *   npx tsx scripts/cleanup-qa-hub.ts --yes              # Skip confirmation
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// ─── Configuration ───────────────────────────────────────────────────────────

const OPERATIONAL_ACCOUNT_ID = 'f62775e6-3966-4e98-acb2-01cb12673b9b';
const OPERATIONAL_ACCOUNT_EMAIL = 'tazkiyadigitalarchive@gmail.com';
const OPERATIONAL_ROLE = 'QA_LEAD' as const;

const TEMP_TEST_USER_IDS = [
  '31000000-0000-4000-8000-000000000001', // phase2.admin@localhost.com
  '31000000-0000-4000-8000-000000000002', // phase2.lead@localhost.com
  '31000000-0000-4000-8000-000000000003', // phase2.tester@localhost.com
] as const;

const SAFE_TO_DELETE_SCENARIO_IDS = [
  'f2fe6aa3-c3f3-40a5-84a5-c49c681e42cb',
  '1fcccd07-da42-47cb-b17a-706aeddac3d0',
  'a9acf6c0-17df-40d2-8ba2-665179a0305b',
  '9b6289d6-5f02-4493-85f7-9a333b498e2a',
  '0e0d95a8-e48d-4742-aaf3-4536d344ab23',
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface CleanupReport {
  auth: {
    before: { total: number; active: number; suspended: number };
    after: { total: number; active: number; suspended: number };
    suspendedUsers: Array<{ id: string; email: string }>;
    profileUpdates: Array<{ id: string; email: string; action: string; newStatus: string }>;
    roleUpdates: Array<{ id: string; email: string; oldRole: string; newRole: string }>;
  };
  catalog: {
    before: { scenarios: number; steps: number; tags: number };
    after: { scenarios: number; steps: number; tags: number };
    deletedScenarios: Array<{ id: string; title: string }>;
    deletedSteps: number;
  };
  verification: {
    operationalAccountVerified: boolean;
    noAuthCapableTestUsers: boolean;
    historicalDataIntact: boolean;
    allChecksPassed: boolean;
  };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function logSection(title: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(title.toUpperCase());
  console.log('='.repeat(80));
}

function logSuccess(message: string): void {
  console.log(`  ✅ ${message}`);
}

function logWarning(message: string): void {
  console.log(`  ⚠️  ${message}`);
}

function logError(message: string): void {
  console.log(`  ❌ ${message}`);
}

function logInfo(message: string): void {
  console.log(`  ℹ️  ${message}`);
}

// ─── Auth Cleanup Functions ─────────────────────────────────────────────────

async function getSuspendedUsers(): Promise<string[]> {
  // Supabase admin API doesn't have a direct "list suspended" endpoint
  // We'll check each user individually
  const suspended: string[] = [];
  
  for (const userId of [...TEMP_TEST_USER_IDS, OPERATIONAL_ACCOUNT_ID]) {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error) continue;
      
      // Check if user is suspended by looking at confirmed_at vs last_sign_in
      // Actually, we need to check the user_metadata or app_metadata for suspension status
      // The Supabase admin API returns a 'banned_until' field if user is banned
      const user = data.user;
      if (user?.banned_until) {
        suspended.push(userId);
      }
    } catch {
      // User doesn't exist or error occurred
    }
  }
  
  return suspended;
}

async function auditAuthState(): Promise<{
  total: number;
  active: number;
  suspended: number;
  users: Array<{ id: string; email: string; suspended: boolean }>;
}> {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    throw new Error(`Failed to list auth users: ${error.message}`);
  }
  
  const users = data?.users ?? [];
  const suspended = await getSuspendedUsers();
  
  return {
    total: users.length,
    active: users.length - suspended.length,
    suspended: suspended.length,
    users: users.map(u => ({
      id: u.id,
      email: u.email!,
      suspended: suspended.includes(u.id),
    })),
  };
}

async function suspendTestUsers(): Promise<Array<{ id: string; email: string }>> {
  const suspended: Array<{ id: string; email: string }> = [];
  
  for (const userId of TEMP_TEST_USER_IDS) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email || userId;
      
      // Suspend the user
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        is_sso_user: false,
        ban_duration: '24h', // Suspend for 24 hours (can be adjusted)
      });
      
      if (error) {
        logError(`Failed to suspend user ${email}: ${error.message}`);
      } else {
        logSuccess(`Suspended: ${email}`);
        suspended.push({ id: userId, email });
      }
    } catch (err: any) {
      logError(`Error suspending user ${userId}: ${err.message}`);
    }
  }
  
  return suspended;
}

async function updateProfileStatuses(): Promise<Array<{ id: string; email: string; action: string; newStatus: string }>> {
  const updates: Array<{ id: string; email: string; action: string; newStatus: string }> = [];
  
  // Mark temporary test user profiles as INACTIVE
  for (const userId of TEMP_TEST_USER_IDS) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, status')
      .eq('id', userId)
      .single();
    
    if (!profile) {
      logWarning(`Profile not found for user ${userId}`);
      continue;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      logError(`Failed to update profile ${profile.email}: ${error.message}`);
    } else {
      logSuccess(`Marked INACTIVE: ${profile.email}`);
      updates.push({ id: userId, email: profile.email, action: 'status', newStatus: 'INACTIVE' });
    }
  }
  
  return updates;
}

async function updateOperationalAccountRole(): Promise<Array<{ id: string; email: string; oldRole: string; newRole: string }>> {
  const updates: Array<{ id: string; email: string; oldRole: string; newRole: string }> = [];
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', OPERATIONAL_ACCOUNT_ID)
    .single();
  
  if (!profile) {
    throw new Error(`Operational account profile not found: ${OPERATIONAL_ACCOUNT_EMAIL}`);
  }
  
  if (profile.role === OPERATIONAL_ROLE) {
    logInfo(`Role already correct: ${profile.email} = ${OPERATIONAL_ROLE}`);
    return updates;
  }
  
  const oldRole = profile.role;
  
  const { error } = await supabase
    .from('profiles')
    .update({ role: OPERATIONAL_ROLE, updated_at: new Date().toISOString() })
    .eq('id', OPERATIONAL_ACCOUNT_ID);
  
  if (error) {
    throw new Error(`Failed to update operational account role: ${error.message}`);
  }
  
  logSuccess(`Updated role: ${profile.email} ${oldRole} → ${OPERATIONAL_ROLE}`);
  updates.push({ id: OPERATIONAL_ACCOUNT_ID, email: profile.email, oldRole: oldRole, newRole: OPERATIONAL_ROLE });
  
  return updates;
}

// ─── Catalog Cleanup Functions ──────────────────────────────────────────────

async function auditCatalogState(): Promise<{
  scenarios: number;
  steps: number;
  tags: number;
}> {
  const { count: scenarioCount } = await supabase
    .from('test_scenarios')
    .select('*', { count: 'exact', head: true });
  
  const { count: stepsCount } = await supabase
    .from('test_steps')
    .select('*', { count: 'exact', head: true });
  
  const { count: tagsCount } = await supabase
    .from('scenario_tags')
    .select('*', { count: 'exact', head: true });
  
  return {
    scenarios: scenarioCount ?? 0,
    steps: stepsCount ?? 0,
    tags: tagsCount ?? 0,
  };
}

async function deleteScenarios(): Promise<Array<{ id: string; title: string }>> {
  const deleted: Array<{ id: string; title: string }> = [];
  
  for (const scenarioId of SAFE_TO_DELETE_SCENARIO_IDS) {
    // Get scenario title before deletion
    const { data: scenario } = await supabase
      .from('test_scenarios')
      .select('title')
      .eq('id', scenarioId)
      .single();
    
    // Delete the scenario (steps will be deleted via CASCADE or explicit query)
    const { error } = await supabase
      .from('test_scenarios')
      .delete()
      .eq('id', scenarioId);
    
    if (error) {
      logError(`Failed to delete scenario ${scenarioId}: ${error.message}`);
    } else {
      logSuccess(`Deleted scenario: ${scenario?.title || scenarioId.substring(0, 8)}`);
      deleted.push({ id: scenarioId, title: scenario?.title || 'Unknown' });
    }
  }
  
  return deleted;
}

async function deleteOrphanedSteps(): Promise<number> {
  // Steps are deleted via CASCADE when scenarios are deleted
  // If CASCADE is not set up, we need to delete them explicitly
  let deletedCount = 0;
  
  for (const scenarioId of SAFE_TO_DELETE_SCENARIO_IDS) {
    const { data: steps } = await supabase
      .from('test_steps')
      .select('id')
      .eq('scenario_id', scenarioId);
    
    if (steps && steps.length > 0) {
      for (const step of steps) {
        const { error } = await supabase
          .from('test_steps')
          .delete()
          .eq('id', step.id);
        
        if (error) {
          logError(`Failed to delete step ${step.id}: ${error.message}`);
        } else {
          deletedCount++;
        }
      }
    }
  }
  
  return deletedCount;
}

// ─── Verification Functions ─────────────────────────────────────────────────

async function verifyOperationalAccount(): Promise<boolean> {
  // 1. Check auth user exists and is not suspended
  const { data: authData } = await supabase.auth.admin.getUserById(OPERATIONAL_ACCOUNT_ID);
  const user = authData?.user;
  
  if (!user) {
    logError(`Auth user not found: ${OPERATIONAL_ACCOUNT_EMAIL}`);
    return false;
  }
  
  if (user.banned_until) {
    logError(`Operational account is banned: ${OPERATIONAL_ACCOUNT_EMAIL}`);
    return false;
  }
  
  // 2. Check profile exists, is ACTIVE, and has correct role
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role, status')
    .eq('id', OPERATIONAL_ACCOUNT_ID)
    .single();
  
  if (!profile) {
    logError(`Profile not found: ${OPERATIONAL_ACCOUNT_EMAIL}`);
    return false;
  }
  
  if (profile.status !== 'ACTIVE') {
    logError(`Operational account status is ${profile.status}, expected ACTIVE`);
    return false;
  }
  
  if (profile.role !== OPERATIONAL_ROLE) {
    logError(`Operational account role is ${profile.role}, expected ${OPERATIONAL_ROLE}`);
    return false;
  }
  
  logSuccess(`Operational account verified: ${OPERATIONAL_ACCOUNT_EMAIL} (${OPERATIONAL_ROLE}, ACTIVE)`);
  return true;
}

async function verifyNoAuthCapableTestUsers(): Promise<boolean> {
  const { data } = await supabase.auth.admin.listUsers();
  const users = data?.users ?? [];
  
  let issues = 0;
  
  for (const userId of TEMP_TEST_USER_IDS) {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      logError(`Test user not found: ${userId}`);
      issues++;
      continue;
    }
    
    if (user.banned_until) {
      logSuccess(`Test user suspended: ${user.email}`);
    } else {
      logError(`Test user is still active: ${user.email}`);
      issues++;
    }
  }
  
  return issues === 0;
}

async function verifyHistoricalDataIntact(): Promise<boolean> {
  const tables = [
    { name: 'test_executions', expected: 20 },
    { name: 'test_execution_attempts', expected: 11 },
    { name: 'reports', expected: 2 },
    { name: 'report_snapshots', expected: 2 },
    { name: 'failures', expected: 2 },
    { name: 'feedback', expected: 3 },
    { name: 'qa_work_items', expected: 1 },
    { name: 'test_plans', expected: 2 },
    { name: 'test_runs', expected: 10 },
  ];
  
  let issues = 0;
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      logError(`Failed to count ${table.name}: ${error.message}`);
      issues++;
      continue;
    }
    
    if (count !== table.expected) {
      logError(`${table.name}: ${count} rows (expected ${table.expected})`);
      issues++;
    } else {
      logSuccess(`${table.name}: ${count} rows intact`);
    }
  }
  
  return issues === 0;
}

async function verifyCanonicalCatalogIntact(): Promise<boolean> {
  const checks = [
    { table: 'applications', expected: 6, label: 'Applications' },
    { table: 'modules', expected: 3, label: 'Modules' },
    { table: 'features', expected: 3, label: 'Features' },
    { table: 'test_scenarios', expected: 7, label: 'Scenarios (3 KEEP + 2 REFERENCED + 2 REAL)' },
  ];
  
  let issues = 0;
  
  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      logError(`Failed to count ${check.label}: ${error.message}`);
      issues++;
      continue;
    }
    
    if (count !== check.expected) {
      logError(`${check.label}: ${count} rows (expected ${check.expected})`);
      issues++;
    } else {
      logSuccess(`${check.label}: ${count} rows intact`);
    }
  }
  
  // Verify no SAFE_TO_DELETE scenarios remain
  const { data: remainingScenarios } = await supabase
    .from('test_scenarios')
    .select('id')
    .in('id', SAFE_TO_DELETE_SCENARIO_IDS);
  
  if (remainingScenarios && remainingScenarios.length > 0) {
    logError(`${remainingScenarios.length} SAFE_TO_DELETE scenarios still exist`);
    issues++;
  } else {
    logSuccess('No SAFE_TO_DELETE scenarios remain');
  }
  
  return issues === 0;
}

// ─── Main Execution ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dangerouslyRun = args.includes('--dangerously-run');
  const skipConfirmation = args.includes('--yes');
  
  const report: CleanupReport = {
    auth: {
      before: { total: 0, active: 0, suspended: 0 },
      after: { total: 0, active: 0, suspended: 0 },
      suspendedUsers: [],
      profileUpdates: [],
      roleUpdates: [],
    },
    catalog: {
      before: { scenarios: 0, steps: 0, tags: 0 },
      after: { scenarios: 0, steps: 0, tags: 0 },
      deletedScenarios: [],
      deletedSteps: 0,
    },
    verification: {
      operationalAccountVerified: false,
      noAuthCapableTestUsers: false,
      historicalDataIntact: false,
      allChecksPassed: false,
    },
  };
  
  console.log('🔧 QA Hub Cleanup Script');
  console.log('='.repeat(80));
  
  if (!dangerouslyRun) {
    console.log('\n⚠️  DRY RUN MODE — No changes will be made.');
    console.log('To execute, add --dangerously-run flag.\n');
  }
  
  try {
    // ── Phase 1: Auth Audit ──
    logSection('Phase 1: Auth Audit');
    
    report.auth.before = await auditAuthState();
    console.log(`  Total auth users: ${report.auth.before.total}`);
    console.log(`  Active: ${report.auth.before.active}`);
    console.log(`  Suspended: ${report.auth.before.suspended}`);
    
    // ── Phase 2: Catalog Audit ──
    logSection('Phase 2: Catalog Audit');
    
    report.catalog.before = await auditCatalogState();
    console.log(`  Scenarios: ${report.catalog.before.scenarios}`);
    console.log(`  Steps: ${report.catalog.before.steps}`);
    console.log(`  Tags: ${report.catalog.before.tags}`);
    
    // ── Phase 3: Execute Changes ──
    if (!dangerouslyRun) {
      console.log('\n🛑 DRY RUN MODE — Skipping execution.');
      return;
    }
    
    if (!skipConfirmation) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const answer = await new Promise<string>((resolve) => {
        readline.question(
          '\n⚠️  You are about to modify Auth users and delete catalog data. Type "run" to confirm: ',
          resolve
        );
      });
      readline.close();
      
      if (answer !== 'run') {
        console.log('\n❌ Execution cancelled by user.');
        return;
      }
    }
    
    // ── Phase 4: Auth Cleanup ──
    logSection('Phase 4: Auth Cleanup');
    
    // 4a. Suspend temporary test users
    console.log('\nSuspending temporary test users...');
    report.auth.suspendedUsers = await suspendTestUsers();
    
    // 4b. Update profile statuses to INACTIVE
    console.log('\nUpdating profile statuses...');
    report.auth.profileUpdates = await updateProfileStatuses();
    
    // 4c. Update operational account role
    console.log('\nUpdating operational account role...');
    report.auth.roleUpdates = await updateOperationalAccountRole();
    
    // ── Phase 5: Catalog Cleanup ──
    logSection('Phase 5: Catalog Cleanup');
    
    console.log('\nDeleting unreferenced scenarios...');
    report.catalog.deletedScenarios = await deleteScenarios();
    
    console.log('\nDeleting orphaned steps...');
    report.catalog.deletedSteps = await deleteOrphanedSteps();
    
    // ── Phase 6: Post-Cleanup Audit ──
    logSection('Phase 6: Post-Cleanup Audit');
    
    report.auth.after = await auditAuthState();
    console.log(`  Total auth users: ${report.auth.after.total}`);
    console.log(`  Active: ${report.auth.after.active}`);
    console.log(`  Suspended: ${report.auth.after.suspended}`);
    
    report.catalog.after = await auditCatalogState();
    console.log(`  Scenarios: ${report.catalog.after.scenarios}`);
    console.log(`  Steps: ${report.catalog.after.steps}`);
    console.log(`  Tags: ${report.catalog.after.tags}`);
    
    // ── Phase 7: Verification ──
    logSection('Phase 7: Verification');
    
    report.verification.operationalAccountVerified = await verifyOperationalAccount();
    report.verification.noAuthCapableTestUsers = await verifyNoAuthCapableTestUsers();
    report.verification.historicalDataIntact = await verifyHistoricalDataIntact();
    
    const catalogIntact = await verifyCanonicalCatalogIntact();
    report.verification.allChecksPassed = 
      report.verification.operationalAccountVerified &&
      report.verification.noAuthCapableTestUsers &&
      report.verification.historicalDataIntact &&
      catalogIntact;
    
    // ── Final Summary ──
    logSection('Final Summary');
    
    console.log('\n📊 AUTH CLEANUP:');
    console.log(`  Before: ${report.auth.before.total} users (${report.auth.before.active} active)`);
    console.log(`  After:  ${report.auth.after.total} users (${report.auth.after.active} active)`);
    console.log(`  Suspended: ${report.auth.suspendedUsers.length} test users`);
    console.log(`  Profile updates: ${report.auth.profileUpdates.length}`);
    console.log(`  Role updates: ${report.auth.roleUpdates.length}`);
    
    console.log('\n📊 CATALOG CLEANUP:');
    console.log(`  Before: ${report.catalog.before.scenarios} scenarios, ${report.catalog.before.steps} steps`);
    console.log(`  After:  ${report.catalog.after.scenarios} scenarios, ${report.catalog.after.steps} steps`);
    console.log(`  Deleted scenarios: ${report.catalog.deletedScenarios.length}`);
    console.log(`  Deleted steps: ${report.catalog.deletedSteps}`);
    
    console.log('\n✅ VERIFICATION:');
    console.log(`  Operational account: ${report.verification.operationalAccountVerified ? 'PASS' : 'FAIL'}`);
    console.log(`  No auth-capable test users: ${report.verification.noAuthCapableTestUsers ? 'PASS' : 'FAIL'}`);
    console.log(`  Historical data intact: ${report.verification.historicalDataIntact ? 'PASS' : 'FAIL'}`);
    console.log(`  Catalog integrity: ${catalogIntact ? 'PASS' : 'FAIL'}`);
    
    console.log('\n' + '='.repeat(80));
    if (report.verification.allChecksPassed) {
      console.log('✅ CLEANUP COMPLETE — READY FOR IMPORT');
    } else {
      console.log('❌ CLEANUP FAILED — Some verification checks did not pass');
      process.exit(1);
    }
    console.log('='.repeat(80));
    
  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
