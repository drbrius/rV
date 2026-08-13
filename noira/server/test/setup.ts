/* Jeder Testlauf bekommt eine eigene Datenbank im Arbeitsspeicher
   und ein eigenes Ablageverzeichnis. Kein Zustand überlebt eine
   Datei — Tests, die sich gegenseitig vorbereiten, verdecken genau
   die Fehler, die sie finden sollten. */

process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = ":memory:";
process.env.STORAGE_DIR = `var/test-storage/${process.pid}-${Math.random().toString(36).slice(2)}`;
process.env.PASSWORD_PEPPER = "test-pepper";
process.env.IP_HASH_SALT = "test-salt";
process.env.PAYMENT_PROVIDER = "mock";

export {};
