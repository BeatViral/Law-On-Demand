insert into public.legal_categories (id, name, slug, default_fee_model, active) values
  ('00000000-0000-0000-0000-000000000101', 'DUI / DWI', 'dui-dwi', 'retainer', true),
  ('00000000-0000-0000-0000-000000000102', 'Traffic Stop', 'traffic-stop', 'retainer', true),
  ('00000000-0000-0000-0000-000000000103', 'Traffic Infraction', 'traffic-infraction', 'retainer', true),
  ('00000000-0000-0000-0000-000000000104', 'Auto Accident', 'auto-accident', 'contingency', true),
  ('00000000-0000-0000-0000-000000000105', 'Personal Injury', 'personal-injury', 'contingency', true),
  ('00000000-0000-0000-0000-000000000106', 'Criminal Defence', 'criminal-defence', 'retainer', true),
  ('00000000-0000-0000-0000-000000000107', 'Family Law', 'family-law', 'custom', true),
  ('00000000-0000-0000-0000-000000000108', 'Contract Law', 'contract-law', 'custom', true),
  ('00000000-0000-0000-0000-000000000109', 'Other Legal Help', 'other-legal-help', 'custom', true)
on conflict (slug) do update set name = excluded.name, default_fee_model = excluded.default_fee_model, active = excluded.active;

insert into public.users (id, role, name, email, phone) values
  ('10000000-0000-0000-0000-000000000001', 'client', 'Avery Johnson', 'avery.client@example.com', '+1 555 0134'),
  ('10000000-0000-0000-0000-000000000002', 'attorney', 'Sarah Mitchell', 'sarah@mitchelldefence.example', '+1 555 0201'),
  ('10000000-0000-0000-0000-000000000003', 'attorney', 'James Carter', 'james@cartertraffic.example', '+1 555 0202'),
  ('10000000-0000-0000-0000-000000000004', 'attorney', 'Elena Rodriguez', 'elena@rodriguezinjury.example', '+1 555 0203'),
  ('10000000-0000-0000-0000-000000000005', 'attorney', 'Michael Grant', 'michael@grantdefence.example', '+1 555 0204'),
  ('10000000-0000-0000-0000-000000000006', 'attorney', 'Priya Shah', 'priya@shahinjury.example', '+1 555 0205'),
  ('10000000-0000-0000-0000-000000000007', 'admin', 'Maya Admin', 'admin@lawyerondemand.test', '+1 555 0110')
on conflict (email) do update set name = excluded.name, role = excluded.role, phone = excluded.phone;

insert into public.client_profiles (id, user_id, preferred_language, location_permission, stripe_customer_id, default_payment_method_id, emergency_contact) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'English', true, 'cus_demo_client', 'pm_demo_visa', '+1 555 0199')
on conflict (id) do nothing;

insert into public.attorney_profiles (
  id, user_id, firm_name, bar_license_number, license_status, profile_photo_url, short_bio, full_bio,
  years_experience, languages, office_address, jurisdictions, service_zip_codes, availability_status,
  rating, subscription_status, premium_listing_level
) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Mitchell Defence Group', 'CA-482901', 'approved', '', 'DUI defence attorney focused on fast roadside guidance.', 'Fourteen years focused on DUI, DWI, implied consent, and license protection.', 14, array['English','Spanish'], '525 W 8th St, Los Angeles, CA', array['California','Nevada'], array['90012','90015','90017','90210'], 'online', 4.9, 'active', 'featured'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Carter Traffic Law', 'NY-711204', 'approved', '', 'Traffic court lawyer handling citations and license points.', 'Eleven years representing drivers in traffic infraction and suspended-license matters.', 11, array['English'], '88 Court St, Brooklyn, NY', array['New York','New Jersey'], array['10001','10007','11201','11217'], 'online', 4.8, 'active', 'premium'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Rodriguez Injury Law', 'TX-309477', 'approved', '', 'Auto accident attorney focused on evidence and medical-care next steps.', 'Sixteen years helping injury victims after crashes and insurance disputes.', 16, array['English','Spanish'], '1900 Main St, Dallas, TX', array['Texas'], array['75201','75204','75219','75001'], 'online', 5.0, 'active', 'priority_queue'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'Grant Criminal Defence', 'FL-884217', 'approved', '', 'Criminal defence attorney for arrest and first-appearance issues.', 'Nineteen years representing felony, misdemeanor, and pre-charge investigation clients.', 19, array['English'], '200 S Biscayne Blvd, Miami, FL', array['Florida','Georgia'], array['33131','33132','33139','30303'], 'online', 4.9, 'active', 'featured'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'Shah Personal Injury', 'IL-650118', 'approved', '', 'Personal injury attorney for urgent claim intake and next steps.', 'Twelve years handling personal injury, premises liability, and serious accident cases.', 12, array['English','Hindi','Gujarati'], '1 N LaSalle St, Chicago, IL', array['Illinois','Indiana'], array['60601','60602','60603','60611'], 'online', 4.9, 'active', 'premium')
on conflict (id) do nothing;

insert into public.attorney_practice_areas (
  attorney_id, legal_category_id, fee_model, retainer_required, retainer_amount, contingency_percentage, preliminary_guidance_minutes
) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'retainer', true, 2500, null, 5),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000103', 'retainer', true, 750, null, 6),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000104', 'contingency', false, null, 33, 7),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000106', 'retainer', true, 5000, null, 5),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000105', 'contingency', false, null, 33, 8)
on conflict (attorney_id, legal_category_id) do update
set fee_model = excluded.fee_model,
    retainer_required = excluded.retainer_required,
    retainer_amount = excluded.retainer_amount,
    contingency_percentage = excluded.contingency_percentage,
    preliminary_guidance_minutes = excluded.preliminary_guidance_minutes;

insert into public.attorney_integrations (attorney_id, integration_type, connected) values
  ('30000000-0000-0000-0000-000000000001', 'clio', false),
  ('30000000-0000-0000-0000-000000000002', 'mycase', false),
  ('30000000-0000-0000-0000-000000000003', 'lawmatics', false),
  ('30000000-0000-0000-0000-000000000004', 'filevine', false),
  ('30000000-0000-0000-0000-000000000005', 'zapier', false)
on conflict (attorney_id, integration_type) do nothing;

