-- ==============================================================================
-- Peso a Peso - Seed Default Categories
-- Version: 1.2
-- ==============================================================================

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
