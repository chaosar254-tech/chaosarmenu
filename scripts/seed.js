const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Starting seed...')

  try {
    // Create a test user (you'll need to create this user in Supabase Auth first)
    // For now, we'll use a placeholder UUID - replace with actual user ID
    const testUserId = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000'
    
    console.log('Creating restaurant...')
    let restaurant
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        slug: 'ornek-restoran',
        name: 'Örnek Restoran',
        owner_user_id: testUserId,
      })
      .select()
      .single()

    if (restaurantError) {
      if (restaurantError.code === '23505') {
        console.log('Restaurant already exists, using existing one...')
        const { data: existing } = await supabase
          .from('restaurants')
          .select()
          .eq('slug', 'ornek-restoran')
          .single()
        if (existing) {
          restaurant = existing
        } else {
          throw restaurantError
        }
      } else {
        throw restaurantError
      }
    } else {
      restaurant = restaurantData
    }

    console.log('✅ Restaurant created:', restaurant.id)

    // Create categories
    console.log('Creating categories...')
    let categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .insert([
        {
          restaurant_id: restaurant.id,
          name: 'Ana Yemekler',
          sort_order: 1,
          is_active: true,
        },
        {
          restaurant_id: restaurant.id,
          name: 'Tatlılar',
          sort_order: 2,
          is_active: true,
        },
      ])
      .select()

    if (categoriesError) {
      // If categories exist, fetch them
      const { data: existing } = await supabase
        .from('menu_categories')
        .select()
        .eq('restaurant_id', restaurant.id)
      
      if (existing && existing.length > 0) {
        categories = existing
        console.log('Using existing categories...')
      } else {
        throw categoriesError
      }
    } else {
      categories = categoriesData
    }

    console.log('✅ Categories created:', categories.length)

    // Create menu items
    console.log('Creating menu items...')
    const menuItems = [
      {
        restaurant_id: restaurant.id,
        category_id: categories[0].id,
        name: 'Classic Burger',
        description: 'Sulu köfte, taze sebzeler, özel sos',
        price: 85.00,
        image_url: '/images/classic-burger.jpg',
        has_ar: true,
        ar_model_glb: '/models/classic-burger.glb',
        ar_model_usdz: '/models/classic-burger.usdz',
        is_active: true,
        sort_order: 1,
      },
      {
        restaurant_id: restaurant.id,
        category_id: categories[0].id,
        name: 'Izgara Tavuk',
        description: 'Taze ızgara tavuk, yanında pilav ve salata',
        price: 95.00,
        image_url: '/images/chicken-wrap.jpg',
        has_ar: false,
        is_active: true,
        sort_order: 2,
      },
      {
        restaurant_id: restaurant.id,
        category_id: categories[0].id,
        name: 'Pepperoni Pizza',
        description: 'İtalyan usulü pizza, bol peynir',
        price: 120.00,
        image_url: '/images/pepperoni-pizza.jpg',
        has_ar: false,
        is_active: true,
        sort_order: 3,
      },
      {
        restaurant_id: restaurant.id,
        category_id: categories[1].id,
        name: 'Sufle',
        description: 'Sıcak çikolatalı sufle',
        price: 45.00,
        image_url: '/images/sufle.jpg',
        has_ar: false,
        is_active: true,
        sort_order: 1,
      },
      {
        restaurant_id: restaurant.id,
        category_id: categories[1].id,
        name: 'Patates Kızartması',
        description: 'Çıtır patates kızartması',
        price: 25.00,
        image_url: '/images/patates-kızartması.jpg',
        has_ar: false,
        is_active: true,
        sort_order: 2,
      },
      {
        restaurant_id: restaurant.id,
        category_id: categories[1].id,
        name: 'Kola',
        description: 'Soğuk kola',
        price: 15.00,
        image_url: '/images/cola.jpg',
        has_ar: false,
        is_active: true,
        sort_order: 3,
      },
    ]

    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .insert(menuItems)
      .select()

    if (itemsError) {
      console.log('Items may already exist, skipping...')
    } else {
      console.log('✅ Menu items created:', items.length)
    }

    // Create sample QR codes
    console.log('Creating QR codes...')
    const menuBaseUrl = process.env.NEXT_PUBLIC_MENU_URL || 'http://localhost:3001'
    const qrCodes = [
      {
        restaurant_id: restaurant.id,
        name: 'Masa 1',
        table_no: 1,
        target_path: `${menuBaseUrl}/menu/${restaurant.slug}?table=1`,
      },
      {
        restaurant_id: restaurant.id,
        name: 'Masa 5',
        table_no: 5,
        target_path: `${menuBaseUrl}/menu/${restaurant.slug}?table=5`,
      },
      {
        restaurant_id: restaurant.id,
        name: 'Genel Menü',
        table_no: null,
        target_path: `${menuBaseUrl}/menu/${restaurant.slug}`,
      },
    ]

    const { data: qrCodesData, error: qrError } = await supabase
      .from('qr_codes')
      .insert(qrCodes)
      .select()

    if (qrError) {
      console.log('QR codes may already exist, skipping...')
    } else {
      console.log('✅ QR codes created:', qrCodesData.length)
    }

    console.log('\n✨ Seed completed successfully!')
    console.log(`\nRestaurant slug: ${restaurant.slug}`)
    console.log(`Menu URL: ${menuBaseUrl}/menu/${restaurant.slug}`)
    console.log(`\n⚠️  Note: Make sure you have created a user in Supabase Auth and set TEST_USER_ID in .env.local`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()

