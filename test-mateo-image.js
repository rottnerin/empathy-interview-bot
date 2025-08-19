#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Mateo Image Generation
 * 
 * This script provides multiple ways to test the generateOpenAIImage function:
 * 1. Mock test - verifies function structure and logic flow
 * 2. Real API test - tests with actual OpenAI API (requires API key)
 * 3. Manual test instructions for the web UI
 * 
 * Usage: 
 *   node test-mateo-image.js mock     # Run mock test
 *   node test-mateo-image.js real     # Run with real API (needs OPENAI_API_KEY)
 *   node test-mateo-image.js help     # Show setup instructions
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env if they exist
function loadEnvFile() {
  const envFiles = ['.env.local', '.env'];
  let loaded = false;
  
  for (const envFile of envFiles) {
    try {
      const envPath = path.join(__dirname, envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0 && !key.startsWith('#')) {
            process.env[key.trim()] = valueParts.join('=').trim();
          }
        });
        console.log(`📁 Loaded environment from ${envFile}`);
        loaded = true;
        break; // Use first file found
      }
    } catch (e) {
      console.log(`⚠️  Could not load ${envFile} file`);
    }
  }
  
  return loaded;
}

// The exact persona and prompt from your persona route
const MATEO_PERSONA = {
  name: 'Mateo Alvarez',
  age: 15,
  backstory: 'Grade 10 student in Madrid who struggles with after-school time management between futsal, friends, YouTube, coding, and homework.',
  goals: ['enjoy sports and hobbies', 'keep up with schoolwork'],
  frustrations: ['phone distractions', 'procrastinating after practice', 'underestimating task time'],
  style: 'casual Madrid high school vibe, friendly and quick-witted',
  portrait_prompt: 'Photorealistic portrait of a 15-year-old Spanish boy from Madrid (Mateo Alvarez), short dark hair, warm brown eyes, athletic build, casual hoodie, soft window light, neutral studio background, natural expression.'
};

const FULL_IMAGE_PROMPT = `${MATEO_PERSONA.portrait_prompt} Full body, head-to-toe, standing, centered in frame, ensure entire figure fits within a square canvas without cropping, with comfortable margins, neutral background.`;

// Mock fetch function for testing
function createMockFetch(scenario = 'success') {
  return async (url, options) => {
    console.log('🔍 Mock API call to:', url);
    console.log('📝 Request body:', JSON.parse(options.body));
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    const scenarios = {
      success: {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          data: [{
            b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jUH3aAAAAABJRU5ErkJggg==', // 1x1 pixel PNG
          }]
        })
      },
      url_success: {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          data: [{
            url: 'https://example.com/mateo-image.png'
          }]
        })
      },
      error: {
        ok: false,
        status: 400,
        text: async () => JSON.stringify({
          error: { message: 'Mock API error for testing' }
        })
      }
    };
    
    return scenarios[scenario] || scenarios.error;
  };
}

// Real generateOpenAIImage function (copy from persona route)
async function generateOpenAIImage(prompt, mockFetch = null) {
  const endpoint = 'https://api.openai.com/v1/images/generations';
  const fetchFn = mockFetch || fetch;
  
  console.log('🎨 Generating image with prompt:');
  console.log('📝', prompt.substring(0, 100) + '...');
  console.log('');

  // First try: base64
  console.log('🔄 Attempt 1: Requesting base64 format...');
  const resp1 = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ 
      model: 'dall-e-3', 
      prompt, 
      n: 1, 
      size: '1024x1024', 
      response_format: 'b64_json' 
    })
  });
  
  const text1 = await resp1.text();
  let data1;
  try { 
    data1 = JSON.parse(text1); 
  } catch { 
    data1 = null; 
  }
  
  const debug1 = { 
    attempt: 'b64_json', 
    ok: resp1.ok, 
    status: resp1.status, 
    bodySample: text1?.slice(0, 400) 
  };
  
  console.log('📊 Response 1:', {
    status: resp1.status,
    ok: resp1.ok,
    hasData: !!data1?.data?.[0],
    errorMessage: data1?.error?.message
  });

  if (resp1.ok) {
    const first = data1?.data?.[0];
    if (first?.b64_json) {
      console.log('✅ Success with base64 format!');
      return { 
        url: `data:image/png;base64,${first.b64_json}`, 
        debug: debug1,
        method: 'base64'
      };
    }
    if (first?.url) {
      console.log('✅ Success with URL from base64 request!');
      return { 
        url: first.url, 
        debug: debug1,
        method: 'url_from_base64'
      };
    }
  }

  // Second try: URL
  console.log('🔄 Attempt 2: Requesting URL format...');
  const resp2 = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ 
      model: 'dall-e-3', 
      prompt, 
      n: 1, 
      size: '1024x1024' 
    })
  });
  
  const text2 = await resp2.text();
  let data2;
  try { 
    data2 = JSON.parse(text2); 
  } catch { 
    data2 = null; 
  }
  
  const debug2 = { 
    attempt: 'url', 
    ok: resp2.ok, 
    status: resp2.status, 
    bodySample: text2?.slice(0, 400) 
  };
  
  console.log('📊 Response 2:', {
    status: resp2.status,
    ok: resp2.ok,
    hasData: !!data2?.data?.[0],
    errorMessage: data2?.error?.message
  });

  if (resp2.ok) {
    const first = data2?.data?.[0];
    if (first?.url) {
      console.log('✅ Success with URL format!');
      return { 
        url: first.url, 
        debug: debug2,
        method: 'url'
      };
    }
  }

  const err = (data1?.error?.message || data2?.error?.message || 'unknown error');
  console.log('❌ Both attempts failed');
  return { 
    error: err, 
    debug: { resp1: debug1, resp2: debug2 } 
  };
}

async function runMockTest() {
  console.log('🧪 Running Mock Test for generateOpenAIImage\n');
  console.log('👤 Testing Mateo persona:', MATEO_PERSONA.name);
  console.log('🎯 Age:', MATEO_PERSONA.age);
  console.log('');

  // Test successful base64 response
  console.log('📋 Test 1: Successful base64 response');
  console.log('=====================================');
  const mockFetch1 = createMockFetch('success');
  const result1 = await generateOpenAIImage(FULL_IMAGE_PROMPT, mockFetch1);
  
  if (result1.url && result1.method === 'base64') {
    console.log('✅ Test 1 PASSED: Function correctly handles base64 response');
  } else {
    console.log('❌ Test 1 FAILED: Function did not handle base64 response correctly');
  }
  console.log('');

  // Test successful URL response
  console.log('📋 Test 2: Successful URL response');
  console.log('==================================');
  const mockFetch2 = createMockFetch('url_success');
  const result2 = await generateOpenAIImage(FULL_IMAGE_PROMPT, mockFetch2);
  
  if (result2.url && result2.method === 'url') {
    console.log('✅ Test 2 PASSED: Function correctly handles URL response');
  } else {
    console.log('❌ Test 2 FAILED: Function did not handle URL response correctly');
  }
  console.log('');

  // Test error handling
  console.log('📋 Test 3: Error handling');
  console.log('=========================');
  const mockFetch3 = createMockFetch('error');
  const result3 = await generateOpenAIImage(FULL_IMAGE_PROMPT, mockFetch3);
  
  if (result3.error && !result3.url) {
    console.log('✅ Test 3 PASSED: Function correctly handles API errors');
  } else {
    console.log('❌ Test 3 FAILED: Function did not handle errors correctly');
  }
  console.log('');

  console.log('🎉 Mock tests completed!');
  console.log('💡 To test with real API, run: node test-mateo-image.js real');
}

async function runRealApiTest() {
  console.log('🌐 Running Real API Test for generateOpenAIImage\n');
  
  loadEnvFile();
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.log('💡 To set up your API key:');
    console.log('   1. Create a .env.local file in the project root');
    console.log('   2. Add: OPENAI_API_KEY=your_api_key_here');
    console.log('   3. Run: node test-mateo-image.js real');
    return;
  }

  console.log('👤 Testing real image generation for:', MATEO_PERSONA.name);
  console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('');

  try {
    const result = await generateOpenAIImage(FULL_IMAGE_PROMPT);
    
    console.log('\n📋 Real API Test Results:');
    console.log('=========================');
    
    if (result.url) {
      console.log('✅ Image generation: SUCCESS');
      console.log('🔗 Method used:', result.method);
      console.log('🌐 Image URL/Data length:', result.url.length);
      
      // If it's base64, save it as a file
      if (result.url.startsWith('data:image/')) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `mateo-generated-${timestamp}.png`;
        const base64Image = result.url.split(';base64,').pop();
        const buffer = Buffer.from(base64Image, 'base64');
        fs.writeFileSync(filename, buffer);
        console.log('💾 Image saved as:', filename);
        console.log('🖼️  Open the file to verify it shows Mateo');
      } else {
        console.log('🔗 URL:', result.url);
        console.log('🖼️  Visit the URL to see the generated image');
      }
      
      console.log('\n🎉 Real API Test PASSED: generateOpenAIImage is working correctly!');
      
    } else {
      console.log('❌ Image generation: FAILED');
      console.log('🚫 Error:', result.error);
      console.log('🔍 Debug info:', JSON.stringify(result.debug, null, 2));
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check your OpenAI API key is valid and has credits');
      console.log('   - Verify your account has access to DALL-E 3');
      console.log('   - Check your internet connection');
      console.log('\n❌ Real API Test FAILED');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('\n❌ Real API Test FAILED');
  }
}

function showHelp() {
  console.log('🔧 Setup Instructions for Mateo Image Generation Test\n');
  console.log('📋 Prerequisites:');
  console.log('   ✓ Node.js installed');
  console.log('   ✓ OpenAI API account (for real testing)');
  console.log('');
  console.log('🚀 Quick Start:');
  console.log('   1. Test function logic:     node test-mateo-image.js mock');
  console.log('   2. Test with real API:     node test-mateo-image.js real');
  console.log('');
  console.log('🔑 API Key Setup (for real testing):');
  console.log('   1. Get your OpenAI API key from https://platform.openai.com/api-keys');
  console.log('   2. Create .env.local file in project root');
  console.log('   3. Add this line: OPENAI_API_KEY=your_actual_api_key_here');
  console.log('   4. Save the file');
  console.log('');
  console.log('🌐 Web UI Testing:');
  console.log('   1. Make sure your .env.local has the API key');
  console.log('   2. Run: npm run dev');
  console.log('   3. Open http://localhost:3000');
  console.log('   4. The app should load Mateo automatically');
  console.log('   5. Check if the persona image loads (not just the fallback avatar)');
  console.log('');
  console.log('🔍 What to look for:');
  console.log('   ✅ Success: A photorealistic image of a 15-year-old Spanish boy');
  console.log('   ❌ Fallback: A generic avatar icon (means API failed)');
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('   - Check browser console for error messages');
  console.log('   - Verify API key has DALL-E 3 access and credits');
  console.log('   - Check Network tab in browser dev tools for API calls');
}

// Main execution
const command = process.argv[2] || 'help';

switch (command.toLowerCase()) {
  case 'mock':
    runMockTest().catch(console.error);
    break;
  case 'real':
    runRealApiTest().catch(console.error);
    break;
  case 'help':
  default:
    showHelp();
    break;
}
