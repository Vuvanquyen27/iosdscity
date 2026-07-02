-- =============================================================================
-- DSCITY — 0004: Seed danh mục xe THẬT (schema B) vào bảng vehicles
-- =============================================================================
-- Chạy SAU 0003_owner_vehicles. Nạp toàn bộ danh mục ô tô + xe máy vào DB để
-- "dữ liệu thật" không còn phụ thuộc fallback từ data/mock.ts.
--
-- Vì sao cần seed đầy đủ: services/api.ts -> fetchVehicles() trả danh mục từ DB
-- NẾU DB có ít nhất 1 xe; ngược lại mới fallback về mock. Nếu DB chỉ có vài xe,
-- người dùng sẽ chỉ thấy vài xe đó. Seed đủ ở đây để xe người dùng tự đăng
-- (owner_id != null) trở thành chiếc TIẾP THEO trong danh mục đầy đủ.
--
-- Idempotent: xoá xe HỆ THỐNG (owner_id is null) rồi nạp lại; KHÔNG đụng xe do
-- người dùng đăng (owner_id != null).
-- =============================================================================

delete from vehicles where owner_id is null;

insert into vehicles
  (owner_id, type, name, brand, transmission, seats, engine_capacity, fuel_type,
   price_per_hour, price_per_day, price_per_week, features, rating, rating_count, image_url)
values
  -- -------------------------------- Ô TÔ --------------------------------
  (null,'car','Toyota Corolla Cross','Toyota','auto',5,null,'Xăng',250000,1200000,7500000,
    '{bao_hiem_day_du,giao_xe_tan_noi,ho_tro_247}',4.6,256,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/2023_Toyota_Corolla_Cross_XLE_4WD_in_Wind_Chill_Pearl%2C_front_left.jpg/1280px-2023_Toyota_Corolla_Cross_XLE_4WD_in_Wind_Chill_Pearl%2C_front_left.jpg'),
  (null,'car','Toyota Vios','Toyota','auto',5,null,'Xăng',180000,900000,5400000,
    '{bao_hiem_day_du,tiet_kiem_xang,ho_tro_247}',4.5,312,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Toyota_Vios_1.5_VVT-i_G_%28IV%29_%E2%80%93_f_13032025.jpg/1280px-Toyota_Vios_1.5_VVT-i_G_%28IV%29_%E2%80%93_f_13032025.jpg'),
  (null,'car','Honda CR-V','Honda','auto',7,null,'Xăng',300000,1500000,9000000,
    '{bao_hiem_day_du,cop_rong,ho_tro_247}',4.7,184,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg/1280px-Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg'),
  (null,'car','Mazda CX-5','Mazda','auto',5,null,'Xăng',280000,1400000,8400000,
    '{bao_hiem_day_du,giao_xe_tan_noi,ho_tro_247}',4.6,209,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg/1280px-2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg'),
  (null,'car','Hyundai Accent','Hyundai','auto',5,null,'Xăng',170000,850000,5000000,
    '{bao_hiem_day_du,tiet_kiem_xang,ho_tro_247}',4.4,276,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/2019_Hyundai_Accent_1.6L%2C_front_10.8.19.jpg/1280px-2019_Hyundai_Accent_1.6L%2C_front_10.8.19.jpg'),
  (null,'car','Ford Ranger','Ford','auto',5,null,'Dầu',320000,1600000,9500000,
    '{bao_hiem_day_du,giao_xe_tan_noi,ho_tro_247}',4.7,142,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg/1280px-Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg'),
  (null,'car','Mitsubishi Xpander','Mitsubishi','auto',7,null,'Xăng',260000,1300000,7800000,
    '{bao_hiem_day_du,cop_rong,ho_tro_247}',4.5,231,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Mitsubishi_Xpander_NC1W_FL2_1.5_GLS_Quartz_White_Pearl_01.jpg/1280px-Mitsubishi_Xpander_NC1W_FL2_1.5_GLS_Quartz_White_Pearl_01.jpg'),
  (null,'car','VinFast VF 8','VinFast','auto',5,null,'Điện',350000,1700000,10000000,
    '{bao_hiem_day_du,tiet_kiem_xang,ho_tro_247}',4.8,167,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/VinFast_VF_8_DSC_8568.jpg/1280px-VinFast_VF_8_DSC_8568.jpg'),

  -- ------------------------------- XE MÁY -------------------------------
  (null,'motorbike','Honda Vision 2024','Honda','auto',null,110,'Xăng',20000,120000,700000,
    '{2_mu_bao_hiem,giao_xe_tan_noi,ho_tro_247}',4.7,198,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Honda_Vision_110-002.JPG/1280px-Honda_Vision_110-002.JPG'),
  (null,'motorbike','Honda Air Blade','Honda','auto',null,125,'Xăng',25000,150000,850000,
    '{2_mu_bao_hiem,giao_xe_tan_noi,ho_tro_247}',4.6,221,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Honda_Airblade_125_scooters._Cambodia%2C_Sihanoukville.jpg/1280px-Honda_Airblade_125_scooters._Cambodia%2C_Sihanoukville.jpg'),
  (null,'motorbike','Honda SH 150i','Honda','auto',null,150,'Xăng',50000,300000,1700000,
    '{2_mu_bao_hiem,cop_rong,ho_tro_247}',4.8,176,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Honda_SH_150i_white.jpg/1280px-Honda_SH_150i_white.jpg'),
  (null,'motorbike','Honda Lead','Honda','auto',null,125,'Xăng',25000,140000,800000,
    '{2_mu_bao_hiem,cop_rong,ho_tro_247}',4.5,203,
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Honda_Lead_NH50.jpg'),
  (null,'motorbike','Honda Winner X','Honda','manual',null,150,'Xăng',35000,200000,1100000,
    '{2_mu_bao_hiem,giao_xe_tan_noi,ho_tro_247}',4.6,158,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Honda_winner_in_anthoi_phuquoc.jpg/1280px-Honda_winner_in_anthoi_phuquoc.jpg'),
  (null,'motorbike','Honda Wave Alpha','Honda','manual',null,110,'Xăng',15000,100000,550000,
    '{2_mu_bao_hiem,tiet_kiem_xang,ho_tro_247}',4.4,287,
    'https://upload.wikimedia.org/wikipedia/commons/7/76/2024_Honda_Wave_110.png'),
  (null,'motorbike','Yamaha Exciter','Yamaha','manual',null,155,'Xăng',35000,200000,1100000,
    '{2_mu_bao_hiem,giao_xe_tan_noi,ho_tro_247}',4.7,244,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Yamaha_Y15ZR.jpg/1280px-Yamaha_Y15ZR.jpg'),
  (null,'motorbike','Yamaha NVX','Yamaha','auto',null,155,'Xăng',40000,220000,1250000,
    '{2_mu_bao_hiem,giao_xe_tan_noi,ho_tro_247}',4.6,139,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/2022_Yamaha_Aerox_155_ABS.jpg/1280px-2022_Yamaha_Aerox_155_ABS.jpg'),
  (null,'motorbike','Yamaha Grande','Yamaha','auto',null,125,'Xăng',28000,160000,900000,
    '{2_mu_bao_hiem,tiet_kiem_xang,ho_tro_247}',4.5,171,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Yamaha_nozza_grande_ltf125_YCP.JPG/1280px-Yamaha_nozza_grande_ltf125_YCP.JPG'),
  (null,'motorbike','Piaggio Vespa','Piaggio','auto',null,125,'Xăng',60000,350000,2000000,
    '{2_mu_bao_hiem,giao_xe_tan_noi,ho_tro_247}',4.7,118,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Vespa_LX.JPG/1280px-Vespa_LX.JPG');
