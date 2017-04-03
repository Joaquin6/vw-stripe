SELECT *
FROM public.item
WHERE (TYPE IN ('wheel',
                'tire',
                'accessory')
       AND specification ->> 'private_label_item' = '0')
UNION
SELECT *
FROM public.item
WHERE (TYPE IN ('wheel',
                'tire',
                'accessory')
       AND specification ->> 'private_label_item' = '1')
  AND ((specification ->> 'private_label_customer_1' = $1)
       OR (specification ->> 'private_label_customer_2' = $1)
       OR (specification ->> 'private_label_customer_3' = $1)
       OR (specification ->> 'private_label_customer_4' = $1)
       OR (specification ->> 'private_label_customer_5' = $1))
ORDER BY id;