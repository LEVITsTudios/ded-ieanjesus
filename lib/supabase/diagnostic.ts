/**
 * Supabase Configuration Diagnostic
 * Uso: Ejecuta esta función en la consola o en un componente para verificar
 * que la configuración de Supabase sea correcta
 */

export async function runSupabaseDiagnostics() {
  console.group('🔍 Supabase Configuration Diagnostic');
  
  // 1. Verificar variables de entorno
  console.log('📋 Environment Variables Check:');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_URL: ${url ? '✓ SET' : '✗ MISSING'}`);
  console.log(`    Value: ${url || 'N/A'}`);
  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✓ SET' : '✗ MISSING'}`);
  console.log(`    Value: ${key ? key.substring(0, 20) + '...' : 'N/A'}`);
  
  if (!url || !key) {
    console.error('❌ Missing required environment variables!');
    console.groupEnd();
    return false;
  }
  
  // 2. Verificar formato de URL
  console.log('\n🌐 URL Validation:');
  const isHttps = url.startsWith('https://');
  console.log(`  ${isHttps ? '✓' : '✗'} URL starts with https://`);
  
  if (!isHttps) {
    console.error('❌ URL must start with https://');
    console.groupEnd();
    return false;
  }
  
  // 3. Intentar conectarse a Supabase
  console.log('\n🔌 Connection Test:');
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Accept': 'application/json',
      },
    });
    
    console.log(`  ✓ HTTP Status: ${response.status}`);
    console.log(`  ✓ Connection successful!`);
    
    if (response.status === 404) {
      console.log(`  ℹ️ 404 is normal - REST API endpoint requires specific table`);
    }
  } catch (err) {
    console.error('❌ Connection failed:', err);
    console.log('   Possible causes:');
    console.log('   - Supabase service is down');
    console.log('   - Network connectivity issue');
    console.log('   - CORS problem');
    console.log('   - Invalid credentials');
    console.groupEnd();
    return false;
  }
  
  // 4. Verificar clave de API
  console.log('\n🔑 API Key Validation:');
  const keyParts = key.split('_');
  const isValidKeyFormat = key.startsWith('sb_') && keyParts.length >= 2;
  console.log(`  ${isValidKeyFormat ? '✓' : '✗'} Key format appears valid`);
  console.log(`  Key prefix: ${key.substring(0, 10)}...`);
  
  // 5. Intentar crear el cliente
  console.log('\n⚙️ Client Initialization:');
  try {
    const { createClient } = await import('./client');
    const client = createClient();
    
    if (client) {
      console.log('  ✓ Client created successfully');
      
      // Intentar obtener la sesión
      try {
        const { data } = await client.auth.getSession();
        if (data.session) {
          console.log('  ✓ Active session found:', data.session.user?.email);
        } else {
          console.log('  ℹ️ No active session (normal if not logged in)');
        }
      } catch (err) {
        console.error('  ✗ Error getting session:', err);
      }
    }
  } catch (err) {
    console.error('  ✗ Failed to create client:', err);
  }
  
  console.log('\n✅ Diagnostic complete!');
  console.groupEnd();
  return true;
}

// Exportar también una función para verificar conectividad de red
export async function checkNetworkConnectivity() {
  console.group('🌐 Network Connectivity Check');
  
  try {
    // Verificar conexión general a internet
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    
    console.log('✓ General internet connectivity: OK');
    console.groupEnd();
    return true;
  } catch (err) {
    console.error('✗ Network connectivity check failed:', err);
    console.log('Possible issues:');
    console.log('- No internet connection');
    console.log('- Network blocking/firewall');
    console.log('- CORS issues');
    console.groupEnd();
    return false;
  }
}
