SELECT web_order_number
FROM sales.sale
WHERE web_order_number IS NOT NULL AND web_order_number LIKE $1
ORDER BY web_order_number DESC LIMIT 1;