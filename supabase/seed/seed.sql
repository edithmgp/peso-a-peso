-- ==============================================================================
-- Peso a Peso - General Seed Data for Development
-- ==============================================================================

-- Categories
insert into categories (name, slug)
values
    ('Comida', 'food'),
    ('Servicios', 'utilities'),
    ('Transporte', 'transport'),
    ('Ocio', 'leisure'),
    ('Vivienda', 'housing'),
    ('Salud', 'health'),
    ('Educación', 'education'),
    ('Otros', 'other')
on conflict (slug) do nothing;
