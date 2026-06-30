-- =============================================================================
-- DSCITY — Seed dữ liệu danh mục (copy từ data/mock.ts)
-- =============================================================================
-- Chạy SAU 0001_init + 0002_functions. Chỉ seed dữ liệu CÔNG KHAI (bãi đỗ, xe,
-- chuyến, khuyến mãi). Hồ sơ/ví/booking sinh theo từng người dùng khi đăng ký.
-- Idempotent: chạy lại được nhờ on conflict do update.
-- =============================================================================

-- --- PLACES (mock places[]) --------------------------------------------------
insert into places (id, name, geo, price_per_hour, price_per_day, slots_total, slots_left, open_hours, rating, reviews_count, floor, image_url, payments) values
  ('central-plaza', 'Bãi đậu xe Central Plaza', st_makepoint(106.702, 10.7740)::geography,
    20000, 180000, 50, 12, '06:00 - 22:00', 4.6, 128, 'B2',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=60',
    '{visa,mastercard,momo,cash}'),
  ('skyline-tower', 'Bãi đậu xe Skyline Tower', st_makepoint(106.7009, 10.7769)::geography,
    25000, 200000, 40, 8, '00:00 - 24:00', 4.5, 96, 'B1',
    'https://images.unsplash.com/photo-1545179605-1296651e9d43?auto=format&fit=crop&w=800&q=60',
    '{visa,mastercard,momo,cash}'),
  ('bitexco-parking', 'Bitexco Parking', st_makepoint(106.7041, 10.7717)::geography,
    30000, 250000, 80, 20, '06:00 - 23:00', 4.7, 210, 'B3',
    'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=60',
    '{visa,mastercard,momo,cash}')
on conflict (id) do update set
  name = excluded.name, geo = excluded.geo,
  price_per_hour = excluded.price_per_hour, price_per_day = excluded.price_per_day,
  slots_total = excluded.slots_total, slots_left = excluded.slots_left,
  open_hours = excluded.open_hours, rating = excluded.rating,
  reviews_count = excluded.reviews_count, floor = excluded.floor,
  image_url = excluded.image_url, payments = excluded.payments;

-- --- VEHICLES (mock vehicles[]) ----------------------------------------------
insert into vehicles (id, kind, name, attributes, price_per_hour, price_per_day, price_per_week, rating, reviews_count, amenities, image_url) values
  ('toyota-corolla-cross','car','Toyota Corolla Cross','{"Tự động","5 chỗ","Xăng"}',250000,1200000,7500000,4.6,256,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/2023_Toyota_Corolla_Cross_XLE_4WD_in_Wind_Chill_Pearl%2C_front_left.jpg/1280px-2023_Toyota_Corolla_Cross_XLE_4WD_in_Wind_Chill_Pearl%2C_front_left.jpg'),
  ('toyota-vios','car','Toyota Vios','{"Tự động","5 chỗ","Xăng"}',180000,900000,5400000,4.5,312,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"leaf-outline","label":"Tiết kiệm xăng"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Toyota_Vios_1.5_VVT-i_G_%28IV%29_%E2%80%93_f_13032025.jpg/1280px-Toyota_Vios_1.5_VVT-i_G_%28IV%29_%E2%80%93_f_13032025.jpg'),
  ('honda-cr-v','car','Honda CR-V','{"Tự động","7 chỗ","Xăng"}',300000,1500000,9000000,4.7,184,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"cube-outline","label":"Cốp rộng rãi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg/1280px-Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg'),
  ('mazda-cx-5','car','Mazda CX-5','{"Tự động","5 chỗ","Xăng"}',280000,1400000,8400000,4.6,209,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg/1280px-2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg'),
  ('hyundai-accent','car','Hyundai Accent','{"Tự động","5 chỗ","Xăng"}',170000,850000,5000000,4.4,276,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"leaf-outline","label":"Tiết kiệm xăng"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/2019_Hyundai_Accent_1.6L%2C_front_10.8.19.jpg/1280px-2019_Hyundai_Accent_1.6L%2C_front_10.8.19.jpg'),
  ('ford-ranger','car','Ford Ranger','{"Tự động","Bán tải","Máy dầu"}',320000,1600000,9500000,4.7,142,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg/1280px-Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg'),
  ('mitsubishi-xpander','car','Mitsubishi Xpander','{"Tự động","7 chỗ","Xăng"}',260000,1300000,7800000,4.5,231,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"cube-outline","label":"Cốp rộng rãi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Mitsubishi_Xpander_NC1W_FL2_1.5_GLS_Quartz_White_Pearl_01.jpg/1280px-Mitsubishi_Xpander_NC1W_FL2_1.5_GLS_Quartz_White_Pearl_01.jpg'),
  ('vinfast-vf-8','car','VinFast VF 8','{"Tự động","5 chỗ","Điện"}',350000,1700000,10000000,4.8,167,
    '[{"icon":"shield-checkmark-outline","label":"Bảo hiểm đầy đủ"},{"icon":"leaf-outline","label":"Tiết kiệm xăng"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/VinFast_VF_8_DSC_8568.jpg/1280px-VinFast_VF_8_DSC_8568.jpg'),
  ('honda-vision-2024','motorbike','Honda Vision 2024','{"Tự động","110cc","Xăng 100%"}',20000,120000,700000,4.7,198,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Honda_Vision_110-002.JPG/1280px-Honda_Vision_110-002.JPG'),
  ('honda-air-blade','motorbike','Honda Air Blade','{"Tự động","125cc","Xăng"}',25000,150000,850000,4.6,221,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Honda_Airblade_125_scooters._Cambodia%2C_Sihanoukville.jpg/1280px-Honda_Airblade_125_scooters._Cambodia%2C_Sihanoukville.jpg'),
  ('honda-sh-150i','motorbike','Honda SH 150i','{"Tự động","150cc","Xăng"}',50000,300000,1700000,4.8,176,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"cube-outline","label":"Cốp rộng rãi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Honda_SH_150i_white.jpg/1280px-Honda_SH_150i_white.jpg'),
  ('honda-lead','motorbike','Honda Lead','{"Tự động","125cc","Xăng"}',25000,140000,800000,4.5,203,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"cube-outline","label":"Cốp rộng rãi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Honda_Lead_NH50.jpg'),
  ('honda-winner-x','motorbike','Honda Winner X','{"Côn tay","150cc","Xăng"}',35000,200000,1100000,4.6,158,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Honda_winner_in_anthoi_phuquoc.jpg/1280px-Honda_winner_in_anthoi_phuquoc.jpg'),
  ('honda-wave-alpha','motorbike','Honda Wave Alpha','{"Số sàn","110cc","Xăng"}',15000,100000,550000,4.4,287,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"leaf-outline","label":"Tiết kiệm xăng"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/7/76/2024_Honda_Wave_110.png'),
  ('yamaha-exciter','motorbike','Yamaha Exciter','{"Côn tay","155cc","Xăng"}',35000,200000,1100000,4.7,244,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Yamaha_Y15ZR.jpg/1280px-Yamaha_Y15ZR.jpg'),
  ('yamaha-nvx','motorbike','Yamaha NVX','{"Tự động","155cc","Xăng"}',40000,220000,1250000,4.6,139,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/2022_Yamaha_Aerox_155_ABS.jpg/1280px-2022_Yamaha_Aerox_155_ABS.jpg'),
  ('yamaha-grande','motorbike','Yamaha Grande','{"Tự động","125cc","Xăng"}',28000,160000,900000,4.5,171,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"leaf-outline","label":"Tiết kiệm xăng"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Yamaha_nozza_grande_ltf125_YCP.JPG/1280px-Yamaha_nozza_grande_ltf125_YCP.JPG'),
  ('piaggio-vespa','motorbike','Piaggio Vespa','{"Tự động","125cc","Xăng"}',60000,350000,2000000,4.7,118,
    '[{"icon":"bicycle-outline","label":"2 mũ bảo hiểm"},{"icon":"car-outline","label":"Giao xe tận nơi"},{"icon":"headset-outline","label":"Hỗ trợ 24/7"}]',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Vespa_LX.JPG/1280px-Vespa_LX.JPG')
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, attributes = excluded.attributes,
  price_per_hour = excluded.price_per_hour, price_per_day = excluded.price_per_day,
  price_per_week = excluded.price_per_week, rating = excluded.rating,
  reviews_count = excluded.reviews_count, amenities = excluded.amenities,
  image_url = excluded.image_url;

-- --- TRIPS (mock trips[]) — depart_at tính tương đối để luôn còn hiệu lực ------
insert into trips (id, driver_name, rating, from_label, to_label, depart_at, price, seats_total, seats_left, avatar_url) values
  ('trip-1','Minh Đức',4.8,'Q.1','Q.7', now() + interval '3 hour', 40000, 4, 2,
    'https://ui-avatars.com/api/?name=Minh%20Duc&background=0A683E&color=fff&bold=true'),
  ('trip-2','Thanh Hằng',4.9,'Q.10','Q.2', now() + interval '5 hour', 50000, 4, 3,
    'https://ui-avatars.com/api/?name=Thanh%20Hang&background=0A683E&color=fff&bold=true')
on conflict (id) do update set
  driver_name = excluded.driver_name, rating = excluded.rating,
  from_label = excluded.from_label, to_label = excluded.to_label,
  price = excluded.price, seats_total = excluded.seats_total, seats_left = excluded.seats_left,
  avatar_url = excluded.avatar_url;

-- --- PROMOTIONS (mock promos[]) — icon lưu khoá map sang ServiceIcons ---------
insert into promotions (id, tag, title, icon) values
  ('weekend',  'ƯU ĐÃI CUỐI TUẦN',   'Giảm 20% các bãi đỗ nổi bật trong thành phố', 'city'),
  ('car',      'THUÊ XE TỰ LÁI',      'Ô tô đời mới, nhận xe tận nơi chỉ với vài chạm', 'car'),
  ('motorbike','DI CHUYỂN LINH HOẠT', 'Thuê xe máy theo giờ, chỉ từ 20.000đ/giờ', 'motorbike')
on conflict (id) do update set
  tag = excluded.tag, title = excluded.title, icon = excluded.icon;
