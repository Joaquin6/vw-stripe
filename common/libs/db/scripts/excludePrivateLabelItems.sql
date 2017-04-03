SELECT *
FROM public.item
WHERE (TYPE IN ('wheel',
                'tire',
                'accessory')
       AND specification ->> 'private_label_item' = '0'
       AND specification ->> 'private_label_item' != '1')
ORDER BY id;