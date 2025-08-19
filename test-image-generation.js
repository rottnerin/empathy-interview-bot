#!/usr/bin/env node

/**
 * Test script for OpenAI Image Generation
 * This script tests the generateOpenAIImage function to verify it can create images of Mateo
 * 
 * Usage: node test-image-generation.js
 * Make sure OPENAI_API_KEY is set in your environment
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
} catch (e) {
  // Ignore errors loading env file
}

// Copy of the generateOpenAIImage function from the persona route
async function generateOpenAIImage(prompt) {
  const endpoint = 'https://api.openai.com/v1/images/generations';
  
  console.log('🎨 Testing OpenAI Image Generation...');
  console.log('📝 Prompt:', prompt);
  console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('');

  // First try: base64
  console.log('🔄 Attempt 1: Requesting base64 format...');
  const resp1 = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ 
      model: 'dall-e-3', // Updated to use dall-e-3 instead of gpt-image-1
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
  const resp2 = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ 
      model: 'dall-e-3', // Updated to use dall-e-3
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

async function saveImageFromBase64(base64Data, filename) {
  // Remove the data:image/png;base64, prefix
  const base64Image = base64Data.split(';base64,').pop();
  const buffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(filename, buffer);
  console.log(`💾 Image saved as ${filename}`);
}

async function testMateoImageGeneration() {
  console.log('🚀 Starting Mateo Image Generation Test\n');
  
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.log('💡 Make sure to set your OpenAI API key in .env.local');
    process.exit(1);
  }

  // The exact persona from the route
  const persona = {
    name: 'Mateo Alvarez',
    age: 15,
    backstory: 'Grade 10 student in Madrid who struggles with after-school time management between futsal, friends, YouTube, coding, and homework.',
    goals: ['enjoy sports and hobbies', 'keep up with schoolwork'],
    frustrations: ['phone distractions', 'procrastinating after practice', 'underestimating task time'],
    style: 'casual Madrid high school vibe, friendly and quick-witted',
    portrait_prompt: 'Photorealistic portrait of a 15-year-old Spanish boy from Madrid (Mateo Alvarez), short dark hair, warm brown eyes, athletic build, casual hoodie, soft window light, neutral studio background, natural expression.'
  };

  // The exact image prompt from the route
  const imagePrompt = `${persona.portrait_prompt} Full body, head-to-toe, standing, centered in frame, ensure entire figure fits within a square canvas without cropping, with comfortable margins, neutral background.`;

  console.log('👤 Testing persona:', persona.name);
  console.log('🎯 Age:', persona.age);
  console.log('');

  try {
    const result = await generateOpenAIImage(imagePrompt);
    
    console.log('\n📋 Test Results:');
    console.log('================');
    
    if (result.url) {
      console.log('✅ Image generation: SUCCESS');
      console.log('🔗 Method used:', result.method);
      console.log('🌐 Image URL/Data length:', result.url.length);
      
      // If it's base64, save it as a file
      if (result.url.startsWith('data:image/')) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `mateo-test-${timestamp}.png`;
        await saveImageFromBase64(result.url, filename);
        console.log('🖼️  You can open the saved image to verify it shows Mateo');
      } else {
        console.log('🖼️  You can visit the URL to see the generated image');
        console.log('🔗 URL:', result.url);
      }
      
      console.log('\n🎉 Test PASSED: generateOpenAIImage function is working correctly!');
      
    } else {
      console.log('❌ Image generation: FAILED');
      console.log('🚫 Error:', result.error);
      console.log('🔍 Debug info:', JSON.stringify(result.debug, null, 2));
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check your OpenAI API key is valid and has credits');
      console.log('   - Verify your account has access to DALL-E 3');
      console.log('   - Check your internet connection');
      console.log('\n❌ Test FAILED: Image generation is not working');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error occurred:');
    console.error(error);
    console.log('\n❌ Test FAILED: Unexpected error in image generation');
  }
}

// Run the test
testMateoImageGeneration().catch(console.error);
