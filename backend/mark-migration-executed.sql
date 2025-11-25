-- Mark the initial migration as executed since tables already exist
INSERT INTO migrations (timestamp, name)
VALUES (1737756000000, 'InitialSchema1737756000000');
