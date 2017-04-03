CREATE OR REPLACE FUNCTION sales."getLastWebOrderNumber"() RETURNS text AS
$BODY$
SELECT web_order_number
FROM sales.sale
WHERE web_order_number IS NOT NULL
ORDER BY web_order_number DESC LIMIT 1;
$BODY$ LANGUAGE SQL VOLATILE NOT LEAKPROOF;

ALTER FUNCTION sales."getLastWebOrderNumber"() OWNER TO postgres_admin;

COMMENT ON FUNCTION sales."getLastWebOrderNumber"() IS 'Function that will get the last generated Web Order Number.';