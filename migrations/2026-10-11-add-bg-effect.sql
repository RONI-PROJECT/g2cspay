-- sudah termasuk di schema.sql
INSERT INTO app_settings (key, value) VALUES ('bg_effect','aurora'),('bg_effect_intensity','1.0') ON CONFLICT (key) DO NOTHING;
