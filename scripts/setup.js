#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('🚀 TheraJournal Setup');
  console.log('====================\n');

  try {
    // Check if .env already exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('Please provide your Supabase configuration:');
    console.log('(You can find these in your Supabase project settings)\n');

    const supabaseUrl = await question('Supabase URL: ');
    const supabaseAnonKey = await question('Supabase Anon Key: ');
    
    // Create .env file
    const envContent = `# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Note: All AI features use completely free providers (Groq, Hugging Face, Ollama)
# No API keys or payments required for AI functionality!
`;

    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');

    // Check if Supabase schema needs to be run
    console.log('\n📋 Next Steps:');
    console.log('1. Run the SQL schema from supabase-schema.sql in your Supabase SQL editor');
    console.log('2. Install dependencies: npm install');
    console.log('3. Start development: npm start');
    
    console.log('\n🎉 All AI features are completely free!');
    console.log('💡 The app uses Groq, Hugging Face, and Ollama - no API keys needed!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();
