-- TattoFlow — Schema SQL
-- Pegar en el SQL Editor de Supabase y ejecutar

-- ─────────────────────────────────────────────
--  TABLAS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kits (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  grupo      text        DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nodos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id     uuid        REFERENCES kits(id) ON DELETE CASCADE,
  tipo       text        CHECK (tipo IN ('yo', 'cliente', 'inicio')),
  texto      text        NOT NULL DEFAULT '',
  posicion_x float       DEFAULT 0,
  posicion_y float       DEFAULT 0,
  color      text        DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conexiones (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id           uuid REFERENCES kits(id) ON DELETE CASCADE,
  nodo_origen_id   uuid REFERENCES nodos(id) ON DELETE CASCADE,
  nodo_destino_id  uuid REFERENCES nodos(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  DATOS INICIALES
-- ─────────────────────────────────────────────

DO $$
DECLARE
  kit_poseidon_id  uuid;
  nodo_raiz_id     uuid;
  nodo_q1_id       uuid;
  nodo_q2_id       uuid;
  nodo_q3_id       uuid;
  nodo_q4_id       uuid;
  nodo_r1_id       uuid;
  nodo_r2_id       uuid;
  nodo_r3_id       uuid;
  nodo_r4_id       uuid;
  kit2_id          uuid;
  kit3_id          uuid;
  kit4_id          uuid;
  kit5_id          uuid;
BEGIN

  -- ── Kit Poseidón Clear ──────────────────────
  INSERT INTO kits (nombre)
  VALUES ('Kit Poseidón Clear')
  RETURNING id INTO kit_poseidon_id;

  -- Nodo raíz
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (
    kit_poseidon_id,
    'inicio',
    '¡Hola! Soy Nicolás 👋
El Kit Poseidon Clear trae todo listo para empezar a tatuar — máquina, batería, agujas, tinta, piel de práctica y estuche de viaje 🔥
💵 *$360.000* 💵
— Pagas cuando llega y Envío gratis📦
*¿Es tu primer kit o ya tatúas?*',
    0,
    0
  )
  RETURNING id INTO nodo_raiz_id;

  -- Preguntas del cliente
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'cliente', '¿Qué incluye exactamente?', -600, 300)
  RETURNING id INTO nodo_q1_id;

  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'cliente', 'Es mi primer kit', -200, 300)
  RETURNING id INTO nodo_q2_id;

  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'cliente', '¿Hacen envíos a mi ciudad?', 200, 300)
  RETURNING id INTO nodo_q3_id;

  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'cliente', '¿Tienen algo más económico?', 600, 300)
  RETURNING id INTO nodo_q4_id;

  -- Mis respuestas
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'yo', 'Escribe tu respuesta aquí — edítame', -600, 600)
  RETURNING id INTO nodo_r1_id;

  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'yo', 'Escribe tu respuesta aquí — edítame', -200, 600)
  RETURNING id INTO nodo_r2_id;

  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'yo', 'Escribe tu respuesta aquí — edítame', 200, 600)
  RETURNING id INTO nodo_r3_id;

  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit_poseidon_id, 'yo', 'Escribe tu respuesta aquí — edítame', 600, 600)
  RETURNING id INTO nodo_r4_id;

  -- Conexiones: raíz → preguntas
  INSERT INTO conexiones (kit_id, nodo_origen_id, nodo_destino_id)
  VALUES
    (kit_poseidon_id, nodo_raiz_id, nodo_q1_id),
    (kit_poseidon_id, nodo_raiz_id, nodo_q2_id),
    (kit_poseidon_id, nodo_raiz_id, nodo_q3_id),
    (kit_poseidon_id, nodo_raiz_id, nodo_q4_id);

  -- Conexiones: preguntas → respuestas
  INSERT INTO conexiones (kit_id, nodo_origen_id, nodo_destino_id)
  VALUES
    (kit_poseidon_id, nodo_q1_id, nodo_r1_id),
    (kit_poseidon_id, nodo_q2_id, nodo_r2_id),
    (kit_poseidon_id, nodo_q3_id, nodo_r3_id),
    (kit_poseidon_id, nodo_q4_id, nodo_r4_id);

  -- ── Kits vacíos ─────────────────────────────
  INSERT INTO kits (nombre) VALUES ('Kit 2') RETURNING id INTO kit2_id;
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit2_id, 'inicio', 'Mensaje inicial — edítame', 0, 0);

  INSERT INTO kits (nombre) VALUES ('Kit 3') RETURNING id INTO kit3_id;
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit3_id, 'inicio', 'Mensaje inicial — edítame', 0, 0);

  INSERT INTO kits (nombre) VALUES ('Kit 4') RETURNING id INTO kit4_id;
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit4_id, 'inicio', 'Mensaje inicial — edítame', 0, 0);

  INSERT INTO kits (nombre) VALUES ('Kit 5') RETURNING id INTO kit5_id;
  INSERT INTO nodos (kit_id, tipo, texto, posicion_x, posicion_y)
  VALUES (kit5_id, 'inicio', 'Mensaje inicial — edítame', 0, 0);

END $$;
