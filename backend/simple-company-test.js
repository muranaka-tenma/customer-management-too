/**
 * シンプル企業管理APIテスト
 * 企業管理機能の基本的な動作テスト
 */

const http = require('http');
const { URL } = require('url');
const { MilestoneTracker } = require('./tests/utils/MilestoneTracker.js');

// テスト設定
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@company.com',
  password: 'password'
};

/**
 * HTTPリクエストヘルパー
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: { raw: body }
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 企業管理APIテスト
 */
async function runCompanyManagementTests() {
  const tracker = new MilestoneTracker();
  console.log('🚀 企業管理API統合テスト開始');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  let testsPassed = 0;
  let testsFailed = 0;
  let authToken = null;

  // ステップ1: 認証
  tracker.setOperation('認証処理');
  console.log('\n📋 Step 1: ログイン認証');
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', TEST_USER);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.accessToken) {
      console.log('✅ ログイン成功');
      authToken = loginResponse.data.accessToken;
      tracker.mark('認証完了');
      testsPassed++;
    } else {
      console.log('❌ ログイン失敗:', loginResponse);
      testsFailed++;
      return;
    }
  } catch (error) {
    console.log('❌ ログインエラー:', error.message);
    testsFailed++;
    return;
  }

  // ステップ2: 企業一覧取得（認証あり）
  tracker.setOperation('企業一覧取得');
  console.log('\n📋 Step 2: 企業一覧取得（認証あり）');
  try {
    const companiesResponse = await makeRequest('GET', '/api/companies', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 企業一覧レスポンス:', {
      status: companiesResponse.statusCode,
      success: companiesResponse.data.success,
      companyCount: companiesResponse.data.data?.length
    });
    
    if (companiesResponse.statusCode === 200 && companiesResponse.data.success === true) {
      console.log('✅ 企業一覧取得成功');
      console.log('   取得企業数:', companiesResponse.data.data?.length);
      tracker.mark('企業一覧取得完了');
      testsPassed++;
    } else {
      console.log('❌ 企業一覧取得失敗:', companiesResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 企業一覧取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ3: 企業一覧取得（認証なし）
  tracker.setOperation('認証なしアクセステスト');
  console.log('\n📋 Step 3: 企業一覧取得（認証なし）');
  try {
    const unauthorizedResponse = await makeRequest('GET', '/api/companies');
    
    console.log('📊 認証なしレスポンス:', {
      status: unauthorizedResponse.statusCode,
      success: unauthorizedResponse.data.success,
      code: unauthorizedResponse.data.code
    });
    
    if (unauthorizedResponse.statusCode === 401 && unauthorizedResponse.data.code === 'AUTHENTICATION_REQUIRED') {
      console.log('✅ 認証なしアクセス拒否成功');
      tracker.mark('認証なしテスト完了');
      testsPassed++;
    } else {
      console.log('❌ 認証なしアクセス拒否失敗:', unauthorizedResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 認証なしアクセステストエラー:', error.message);
    testsFailed++;
  }

  // ステップ4: 新規企業作成
  tracker.setOperation('新規企業作成');
  console.log('\n📋 Step 4: 新規企業作成');
  try {
    const newCompanyData = {
      name: '新規テスト企業株式会社',
      industry: 'IT',
      email: 'contact@newtest-company.com',
      phone: '03-1111-2222',
      address: '東京都新宿区テスト町2-2-2'
    };
    
    const createResponse = await makeRequest('POST', '/api/companies', newCompanyData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 企業作成レスポンス:', {
      status: createResponse.statusCode,
      success: createResponse.data.success,
      hasData: !!createResponse.data.data
    });
    
    if (createResponse.statusCode === 201 && createResponse.data.success === true) {
      console.log('✅ 新規企業作成成功');
      console.log('   作成企業:', createResponse.data.data?.name);
      tracker.mark('企業作成完了');
      testsPassed++;
    } else {
      console.log('❌ 新規企業作成失敗:', createResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 新規企業作成エラー:', error.message);
    testsFailed++;
  }

  // ステップ5: 重複企業名エラーテスト
  tracker.setOperation('重複企業名テスト');
  console.log('\n📋 Step 5: 重複企業名テスト');
  try {
    const duplicateCompanyData = {
      name: '重複企業名',
      industry: '製造業',
      email: 'duplicate@company.com',
      phone: '03-3333-4444',
      address: '大阪府大阪市'
    };
    
    const duplicateResponse = await makeRequest('POST', '/api/companies', duplicateCompanyData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 重複企業名テストレスポンス:', {
      status: duplicateResponse.statusCode,
      success: duplicateResponse.data.success,
      code: duplicateResponse.data.code
    });
    
    if (duplicateResponse.statusCode === 409 && duplicateResponse.data.code === 'COMPANY_NAME_EXISTS') {
      console.log('✅ 重複企業名拒否成功');
      tracker.mark('重複企業名テスト完了');
      testsPassed++;
    } else {
      console.log('❌ 重複企業名拒否失敗:', duplicateResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 重複企業名テストエラー:', error.message);
    testsFailed++;
  }

  // ステップ6: 企業詳細取得
  tracker.setOperation('企業詳細取得');
  console.log('\n📋 Step 6: 企業詳細取得');
  try {
    const companyDetailResponse = await makeRequest('GET', '/api/companies/test-company-1', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 企業詳細レスポンス:', {
      status: companyDetailResponse.statusCode,
      success: companyDetailResponse.data.success,
      hasData: !!companyDetailResponse.data.data
    });
    
    if (companyDetailResponse.statusCode === 200 && companyDetailResponse.data.success === true) {
      console.log('✅ 企業詳細取得成功');
      tracker.mark('企業詳細取得完了');
      testsPassed++;
    } else {
      console.log('❌ 企業詳細取得失敗:', companyDetailResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 企業詳細取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ7: 企業統計情報取得
  tracker.setOperation('企業統計情報取得');
  console.log('\n📋 Step 7: 企業統計情報取得');
  try {
    const statsResponse = await makeRequest('GET', '/api/companies/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 統計情報レスポンス:', {
      status: statsResponse.statusCode,
      success: statsResponse.data.success,
      hasData: !!statsResponse.data.data
    });
    
    if (statsResponse.statusCode === 200 && statsResponse.data.success === true) {
      console.log('✅ 企業統計情報取得成功');
      console.log('   統計項目:', Object.keys(statsResponse.data.data || {}));
      tracker.mark('統計情報取得完了');
      testsPassed++;
    } else {
      console.log('❌ 企業統計情報取得失敗:', statsResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 企業統計情報取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ8: 企業連絡先取得
  tracker.setOperation('企業連絡先取得');
  console.log('\n📋 Step 8: 企業連絡先取得');
  try {
    const contactsResponse = await makeRequest('GET', '/api/companies/test-company-1/contacts', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 企業連絡先レスポンス:', {
      status: contactsResponse.statusCode,
      success: contactsResponse.data.success,
      contactCount: contactsResponse.data.data?.length
    });
    
    if (contactsResponse.statusCode === 200 && contactsResponse.data.success === true) {
      console.log('✅ 企業連絡先取得成功');
      console.log('   連絡先数:', contactsResponse.data.data?.length);
      tracker.mark('企業連絡先取得完了');
      testsPassed++;
    } else {
      console.log('❌ 企業連絡先取得失敗:', contactsResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 企業連絡先取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ9: 企業検索
  tracker.setOperation('企業検索');
  console.log('\n📋 Step 9: 企業検索');
  try {
    const searchData = {
      query: 'テスト',
      filters: {
        industry: 'IT',
        status: 'ACTIVE'
      }
    };
    
    const searchResponse = await makeRequest('POST', '/api/companies/search', searchData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 企業検索レスポンス:', {
      status: searchResponse.statusCode,
      success: searchResponse.data.success,
      totalMatches: searchResponse.data.totalMatches
    });
    
    if (searchResponse.statusCode === 200 && searchResponse.data.success === true) {
      console.log('✅ 企業検索成功');
      console.log('   検索結果数:', searchResponse.data.totalMatches);
      tracker.mark('企業検索完了');
      testsPassed++;
    } else {
      console.log('❌ 企業検索失敗:', searchResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 企業検索エラー:', error.message);
    testsFailed++;
  }

  // テスト結果サマリー
  console.log('\n📊 企業管理API統合テスト結果サマリー');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${testsPassed} テスト`);
  console.log(`❌ 失敗: ${testsFailed} テスト`);
  
  if (testsPassed + testsFailed > 0) {
    console.log(`📈 成功率: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  }
  
  tracker.summary();
  
  if (testsFailed === 0) {
    console.log('\n🎉 企業管理API統合テストが100%成功しました！');
    return true;
  } else {
    console.log('\n⚠️  いくつかのテストが失敗しました。');
    return false;
  }
}

/**
 * テスト実行
 */
if (require.main === module) {
  console.log('🔍 環境チェック');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  
  // サーバー起動待ち
  setTimeout(() => {
    runCompanyManagementTests()
      .then(success => {
        process.exit(success ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ テスト実行エラー:', error);
        process.exit(1);
      });
  }, 1000);
}

module.exports = { runCompanyManagementTests };