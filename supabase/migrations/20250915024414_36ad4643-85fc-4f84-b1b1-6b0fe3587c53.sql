-- First, allow NULL dates for template items
ALTER TABLE mess_menu ALTER COLUMN date DROP NOT NULL;

-- Insert sample mess menu data for weekly template
-- Note: day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

-- Get a sample hostel and college (we'll use the first ones available)
WITH sample_data AS (
  SELECT 
    h.id as hostel_id,
    h.college_id
  FROM hostels h
  LIMIT 1
)

INSERT INTO mess_menu (college_id, hostel_id, name, description, meal_type, day_of_week, is_vegetarian, is_template, date)
SELECT 
  s.college_id,
  s.hostel_id,
  menu_item.name,
  menu_item.description,
  menu_item.meal_type,
  menu_item.day_of_week,
  menu_item.is_vegetarian,
  true,
  null
FROM sample_data s
CROSS JOIN (
  VALUES
  -- Monday (1)
  ('Idli Sambar', 'Steamed rice cakes with lentil curry', 'breakfast', 1, true),
  ('Coconut Chutney', 'Fresh coconut chutney with curry leaves', 'breakfast', 1, true),
  ('Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 'lunch', 1, false),
  ('Raita', 'Yogurt with cucumber and mint', 'lunch', 1, true),
  ('Roti', 'Fresh whole wheat flatbread', 'dinner', 1, true),
  ('Dal Tadka', 'Yellow lentils with spiced tempering', 'dinner', 1, true),
  ('Mixed Vegetable Curry', 'Seasonal vegetables in spiced gravy', 'dinner', 1, true),
  ('Tea', 'Hot masala tea', 'snacks', 1, true),
  ('Samosa', 'Crispy pastry with spiced potato filling', 'snacks', 1, true),

  -- Tuesday (2)
  ('Poha', 'Flattened rice with onions and spices', 'breakfast', 2, true),
  ('Upma', 'Semolina porridge with vegetables', 'breakfast', 2, true),
  ('Fish Curry Rice', 'Traditional fish curry with steamed rice', 'lunch', 2, false),
  ('Pickle', 'Spicy mango pickle', 'lunch', 2, true),
  ('Chapati', 'Soft wheat flatbread', 'dinner', 2, true),
  ('Paneer Butter Masala', 'Cottage cheese in rich tomato gravy', 'dinner', 2, true),
  ('Jeera Rice', 'Cumin flavored basmati rice', 'dinner', 2, true),
  ('Coffee', 'Filter coffee', 'snacks', 2, true),
  ('Biscuits', 'Tea biscuits', 'snacks', 2, true),

  -- Wednesday (3)
  ('Dosa', 'Crispy rice and lentil crepe', 'breakfast', 3, true),
  ('Sambar', 'Tangy lentil soup with vegetables', 'breakfast', 3, true),
  ('Mutton Curry', 'Spiced goat meat curry', 'lunch', 3, false),
  ('Rice', 'Steamed basmati rice', 'lunch', 3, true),
  ('Paratha', 'Layered flatbread', 'dinner', 3, true),
  ('Aloo Gobi', 'Potato and cauliflower curry', 'dinner', 3, true),
  ('Curd', 'Fresh yogurt', 'dinner', 3, true),
  ('Juice', 'Fresh fruit juice', 'snacks', 3, true),
  ('Pakora', 'Deep fried vegetable fritters', 'snacks', 3, true),

  -- Thursday (4)
  ('Paratha', 'Stuffed flatbread with potato', 'breakfast', 4, true),
  ('Curd', 'Fresh yogurt', 'breakfast', 4, true),
  ('Egg Curry', 'Boiled eggs in spiced tomato gravy', 'lunch', 4, false),
  ('Roti', 'Whole wheat flatbread', 'lunch', 4, true),
  ('Rice', 'Steamed rice', 'dinner', 4, true),
  ('Rajma', 'Red kidney beans curry', 'dinner', 4, true),
  ('Salad', 'Fresh vegetable salad', 'dinner', 4, true),
  ('Tea', 'Ginger tea', 'snacks', 4, true),
  ('Bread Pakora', 'Deep fried bread with filling', 'snacks', 4, true),

  -- Friday (5)
  ('Rava Idli', 'Steamed semolina cakes', 'breakfast', 5, true),
  ('Chutney', 'Mint and coriander chutney', 'breakfast', 5, true),
  ('Chicken Curry', 'Home-style chicken curry', 'lunch', 5, false),
  ('Pulao', 'Spiced rice with vegetables', 'lunch', 5, true),
  ('Naan', 'Leavened flatbread', 'dinner', 5, true),
  ('Palak Paneer', 'Spinach with cottage cheese', 'dinner', 5, true),
  ('Dal Makhani', 'Creamy black lentils', 'dinner', 5, true),
  ('Lassi', 'Sweet yogurt drink', 'snacks', 5, true),
  ('Sandwich', 'Vegetable sandwich', 'snacks', 5, true),

  -- Saturday (6)
  ('Puri Bhaji', 'Deep fried bread with spiced potato', 'breakfast', 6, true),
  ('Halwa', 'Sweet semolina pudding', 'breakfast', 6, true),
  ('Prawn Curry', 'Coastal style prawn curry', 'lunch', 6, false),
  ('Rice', 'Coconut rice', 'lunch', 6, true),
  ('Biryani', 'Vegetable biryani', 'dinner', 6, true),
  ('Boiled Egg', 'Hard boiled eggs', 'dinner', 6, false),
  ('Papad', 'Crispy lentil wafers', 'dinner', 6, true),
  ('Milkshake', 'Fresh fruit milkshake', 'snacks', 6, true),
  ('Cutlet', 'Vegetable cutlet', 'snacks', 6, true),

  -- Sunday (0)
  ('Pancakes', 'Sweet pancakes with syrup', 'breakfast', 0, true),
  ('Fruit', 'Fresh seasonal fruits', 'breakfast', 0, true),
  ('Special Chicken', 'Sunday special chicken preparation', 'lunch', 0, false),
  ('Fried Rice', 'Special fried rice', 'lunch', 0, false),
  ('Tandoori Roti', 'Clay oven baked bread', 'dinner', 0, true),
  ('Butter Chicken', 'Creamy tomato chicken curry', 'dinner', 0, false),
  ('Naan', 'Garlic naan bread', 'dinner', 0, true),
  ('Ice Cream', 'Vanilla ice cream', 'snacks', 0, true),
  ('Cake', 'Fresh baked cake slice', 'snacks', 0, true)
) AS menu_item(name, description, meal_type, day_of_week, is_vegetarian);