const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./supabaseClient');

async function assignAllProductsToAdmin() {
  console.log('[*] Assigning all existing products to Admin Web (arildani60@gmail.com)...');

  const { data: adminUser, error: uErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'arildani60@gmail.com')
    .single();

  if (uErr || !adminUser) {
    console.error('[ERROR] Admin user arildani60@gmail.com not found:', uErr?.message);
    process.exit(1);
  }

  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('kampus')
    .eq('user_id', adminUser.id)
    .single();

  const kampus = (adminProfile && adminProfile.kampus) || 'Universitas Negeri Makassar';

  const { data: updated, error: upErr } = await supabase
    .from('products')
    .update({
      seller_id: adminUser.id,
      seller_nama: adminUser.first_name || 'M. Aril Ardani',
      seller_email: adminUser.email,
      seller_kampus: kampus,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id, nama');

  if (upErr) {
    console.error('[ERROR] Failed updating products:', upErr.message);
    process.exit(1);
  }

  console.log(`[OK] ${(updated || []).length} products now belong to ${adminUser.first_name} (${adminUser.email}).`);
}

assignAllProductsToAdmin().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
