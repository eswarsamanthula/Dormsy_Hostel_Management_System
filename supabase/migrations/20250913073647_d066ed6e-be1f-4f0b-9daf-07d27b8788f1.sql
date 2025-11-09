-- Insert sample mess menu data
INSERT INTO public.mess_menu (date, hostel_id, college_id, name, meal_type, is_vegetarian, description) VALUES
-- Breakfast items
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'South Indian Breakfast', 'breakfast', true, 'Idli, Sambar, Coconut Chutney, Filter Coffee'),
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'North Indian Breakfast', 'breakfast', true, 'Aloo Paratha, Curd, Pickle, Tea'),
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Continental Breakfast', 'breakfast', true, 'Bread Toast, Butter, Jam, Cornflakes, Milk'),

-- Lunch items
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Dal Rice Combo', 'lunch', true, 'Steamed Rice, Dal Tadka, Sabzi, Roti, Salad'),
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Chicken Curry', 'lunch', false, 'Chicken Curry, Rice, Roti, Dal, Salad'),
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Paneer Makhani', 'lunch', true, 'Paneer Makhani, Naan, Rice, Dal, Raita'),

-- Dinner items
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Biryani Special', 'dinner', false, 'Chicken Biryani, Raita, Boiled Egg, Pickle'),
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'South Indian Dinner', 'dinner', true, 'Sambar Rice, Rasam, Poriyal, Appalam, Curd'),
(CURRENT_DATE, (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'North Indian Thali', 'dinner', true, 'Roti, Dal, Sabzi, Rice, Pickle, Sweet'),

-- Tomorrow's menu
(CURRENT_DATE + INTERVAL '1 day', (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Dosa & Chutney', 'breakfast', true, 'Plain Dosa, Masala Dosa, Sambar, Chutneys'),
(CURRENT_DATE + INTERVAL '1 day', (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Rajma Chawal', 'lunch', true, 'Rajma, Steamed Rice, Roti, Salad, Pickle'),
(CURRENT_DATE + INTERVAL '1 day', (SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Fish Curry', 'dinner', false, 'Fish Curry, Rice, Dal, Vegetables, Papad');

-- Insert sample hostel rules (using only 'general' category for now)
INSERT INTO public.hostel_rules (hostel_id, college_id, title, description, category, is_active) VALUES
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Entry and Exit Timings', 'Hostel gates close at 10:30 PM on weekdays and 11:00 PM on weekends. Late entry requires prior permission from the warden.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Visitor Policy', 'Visitors are allowed only between 4:00 PM to 8:00 PM. All visitors must register at the reception and carry valid ID proof.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Room Maintenance', 'Students are responsible for keeping their rooms clean. Room inspection will be conducted monthly. Damage to hostel property will be charged.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Fire Safety', 'Use of heating appliances, candles, or incense sticks is strictly prohibited. Fire extinguishers are located on each floor - do not tamper with them.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Electrical Safety', 'Do not overload electrical sockets. Report any electrical faults immediately to the maintenance team. Use of personal electrical appliances requires approval.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Emergency Procedures', 'In case of emergency, contact the warden immediately. Emergency contact numbers are displayed on each floor. Follow evacuation procedures during fire drills.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Noise Policy', 'Maintain silence after 10:00 PM. Loud music, parties, or gatherings that disturb others are not allowed. Use headphones for entertainment.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Alcohol and Smoking', 'Consumption of alcohol, smoking, and use of tobacco products is strictly prohibited within hostel premises. Violation will result in disciplinary action.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Ragging Policy', 'Ragging in any form is strictly prohibited and is a punishable offense. Report any incidents immediately to the authorities.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Mess Timings', 'Breakfast: 7:00-9:00 AM, Lunch: 12:00-2:00 PM, Dinner: 7:00-9:00 PM. Late comers will not be served food.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Mess Etiquette', 'Maintain cleanliness in the dining hall. Do not waste food. Return plates and utensils to designated areas after eating.', 'general', true),
((SELECT id FROM hostels LIMIT 1), (SELECT id FROM colleges LIMIT 1), 'Outside Food', 'Outside food delivery is allowed only until 9:00 PM. Food should not be consumed in rooms - use common dining areas.', 'general', true);