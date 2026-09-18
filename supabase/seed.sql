-- Sample boards across Gujarat for local development / demo mode.
-- assigned_agent_id is left null here since seeding a real auth.users row
-- requires signing up through Supabase Auth first.
insert into boards (code, name, city, address, lat, lng, board_type, size_label, status, permit_expiry_date, current_photo_url, notes) values
('AHD-SG-014', 'SG Highway, near Iscon Circle', 'Ahmedabad', 'SG Highway, Ahmedabad', 23.0225, 72.5090, 'unipole', '40x20 ft', 'booked', '2027-03-15', null, null),
('AHD-CG-002', 'CG Road, Panchvati', 'Ahmedabad', 'CG Road, Ahmedabad', 23.0339, 72.5586, 'hoarding', '30x15 ft', 'available', '2026-09-05', null, null),
('AHD-SP-021', 'Sardar Patel Ring Road', 'Ahmedabad', 'Ring Road, Ahmedabad', 23.0801, 72.6455, 'gantry', '60x20 ft', 'under_maintenance', '2026-08-28', null, 'Lighting circuit needs replacement'),
('SUR-RS-007', 'Ring Road, Surat', 'Surat', 'Ring Road, Surat', 21.1959, 72.8302, 'led_screen', '20x10 ft', 'booked', '2027-01-10', null, null),
('SUR-VS-011', 'Vesu, near VR Mall', 'Surat', 'Vesu, Surat', 21.1351, 72.7797, 'unipole', '40x20 ft', 'available', '2026-08-20', null, null),
('SUR-AD-003', 'Adajan Bridge approach', 'Surat', 'Adajan, Surat', 21.1959, 72.7795, 'hoarding', '30x15 ft', 'pending_installation', null, null, 'Awaiting municipal approval'),
('VAD-AL-005', 'Alkapuri, near Race Course', 'Vadodara', 'Alkapuri, Vadodara', 22.3096, 73.1745, 'wall_wrap', '25x40 ft', 'booked', '2026-12-01', null, null),
('VAD-OP-009', 'Old Padra Road', 'Vadodara', 'Old Padra Road, Vadodara', 22.2971, 73.1808, 'hoarding', '30x15 ft', 'damaged', '2026-10-11', null, 'Vandalized creative, needs re-mount'),
('RAJ-KP-006', 'Kalawad Road', 'Rajkot', 'Kalawad Road, Rajkot', 22.2969, 70.7813, 'unipole', '40x20 ft', 'available', '2026-11-22', null, null),
('RAJ-YR-013', 'Yagnik Road junction', 'Rajkot', 'Yagnik Road, Rajkot', 22.2895, 70.7929, 'gantry', '60x20 ft', 'booked', '2027-02-18', null, null),
('GNR-CH-001', 'Sector 21, near Sachivalay', 'Gandhinagar', 'Sector 21, Gandhinagar', 23.2202, 72.6493, 'hoarding', '30x15 ft', 'available', '2026-08-30', null, null),
('BHV-ST-004', 'Station Road, Bhavnagar', 'Bhavnagar', 'Station Road, Bhavnagar', 21.7645, 72.1519, 'bus_shelter', '12x6 ft', 'booked', '2026-09-12', null, null),
('JAM-BH-008', 'Bedi Bunder Road', 'Jamnagar', 'Bedi Bunder Road, Jamnagar', 22.4707, 70.0577, 'unipole', '40x20 ft', 'available', '2026-08-25', null, 'Coastal wind zone — flag for pre-monsoon structural check'),
('JAM-TW-010', 'Teen Batti Circle', 'Jamnagar', 'Teen Batti, Jamnagar', 22.4622, 70.0669, 'hoarding', '30x15 ft', 'under_maintenance', '2026-07-30', null, 'Permit renewal overdue');
